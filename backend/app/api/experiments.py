from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from app.db.session import get_db
from app.db.models import Experiment, ExperimentRun, EvaluationRecord
from app.api.schemas import ExperimentCreate, ExperimentResponse, ExperimentRunResponse, EvaluationRecordResponse

router = APIRouter(prefix="/experiments", tags=["experiments"])

@router.get("/project/{project_id}", response_model=List[ExperimentResponse])
async def list_experiments(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Experiment)
        .filter(Experiment.project_id == project_id)
        .order_by(Experiment.created_at.desc())
    )
    return result.scalars().all()

@router.post("/project/{project_id}", response_model=ExperimentResponse)
async def create_experiment(project_id: str, data: ExperimentCreate, db: AsyncSession = Depends(get_db)):
    exp = Experiment(
        project_id=project_id,
        name=data.name,
        description=data.description or "",
        model_configs=data.model_configs or [],
        prompt_template=data.prompt_template or "{input}",
        rag_config=data.rag_config or {}
    )
    db.add(exp)
    await db.commit()
    await db.refresh(exp)
    return exp

@router.get("/{experiment_id}/runs", response_model=List[ExperimentRunResponse])
async def get_experiment_runs(experiment_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ExperimentRun)
        .filter(ExperimentRun.experiment_id == experiment_id)
        .order_by(ExperimentRun.started_at.desc())
    )
    return result.scalars().all()

@router.get("/runs/{run_id}", response_model=ExperimentRunResponse)
async def get_run_details(run_id: str, db: AsyncSession = Depends(get_db)):
    run = await db.get(ExperimentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.get("/runs/{run_id}/records", response_model=List[EvaluationRecordResponse])
async def get_run_records(run_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EvaluationRecord)
        .filter(EvaluationRecord.run_id == run_id)
        .order_by(EvaluationRecord.created_at.asc())
    )
    return result.scalars().all()

@router.get("/compare/{run_a_id}/{run_b_id}")
async def compare_runs(run_a_id: str, run_b_id: str, db: AsyncSession = Depends(get_db)):
    run_a = await db.get(ExperimentRun, run_a_id)
    run_b = await db.get(ExperimentRun, run_b_id)
    if not run_a or not run_b:
        raise HTTPException(status_code=404, detail="One or both runs not found")

    m_a = run_a.metrics_summary or {}
    m_b = run_b.metrics_summary or {}

    delta = {
        "faithfulness_delta": round((m_b.get("avg_faithfulness", 0) - m_a.get("avg_faithfulness", 0)), 2),
        "relevance_delta": round((m_b.get("avg_relevance", 0) - m_a.get("avg_relevance", 0)), 2),
        "precision_delta": round((m_b.get("avg_precision", 0) - m_a.get("avg_precision", 0)), 2),
        "hallucination_delta": round((m_b.get("hallucination_rate", 0) - m_a.get("hallucination_rate", 0)), 2),
        "pass_rate_delta": round((m_b.get("pass_rate", 0) - m_a.get("pass_rate", 0)), 1),
        "latency_delta_ms": round((m_b.get("avg_latency_ms", 0) - m_a.get("avg_latency_ms", 0)), 1),
        "cost_delta": round((m_b.get("total_cost", 0) - m_a.get("total_cost", 0)), 6),
    }

    return {
        "run_a": {
            "id": run_a.id,
            "name": run_a.name,
            "model_name": run_a.model_name,
            "metrics": m_a
        },
        "run_b": {
            "id": run_b.id,
            "name": run_b.name,
            "model_name": run_b.model_name,
            "metrics": m_b
        },
        "delta": delta
    }
