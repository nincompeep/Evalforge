from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
from typing import Dict, Any

from app.db.session import get_db, AsyncSessionLocal
from app.db.models import Experiment, Dataset, TestCase, ExperimentRun, EvaluationRecord
from app.api.schemas import RunTriggerRequest, ExperimentRunResponse
from app.engine.graph import build_evaluation_workflow, EvalGraphState
from app.observability.langfuse_tracker import tracker

router = APIRouter(prefix="/evaluate", tags=["evaluate"])

async def execute_run_workflow(run_id: str, payload: RunTriggerRequest):
    async with AsyncSessionLocal() as db:
        run = await db.get(ExperimentRun, run_id)
        if not run:
            return

        exp = await db.get(Experiment, payload.experiment_id)
        dataset = await db.get(Dataset, payload.dataset_id)
        if not exp or not dataset:
            run.status = "FAILED"
            await db.commit()
            return

        # Fetch test cases
        tc_res = await db.execute(select(TestCase).filter(TestCase.dataset_id == payload.dataset_id))
        test_cases = tc_res.scalars().all()
        if not test_cases:
            run.status = "COMPLETED"
            run.metrics_summary = {"total_samples": 0, "message": "No test cases found"}
            await db.commit()
            return

        tc_dicts = [
            {
                "id": tc.id,
                "input_prompt": tc.input_prompt,
                "ground_truth": tc.ground_truth,
                "context_documents": tc.context_documents or []
            }
            for tc in test_cases
        ]

        # Prepare LangGraph state
        initial_state: EvalGraphState = {
            "run_id": run_id,
            "model_name": payload.model_name or "qwen2.5:latest",
            "provider": payload.provider or "mock",
            "prompt_template": payload.prompt_template or exp.prompt_template or "{input}",
            "temperature": payload.temperature or 0.2,
            "test_cases": tc_dicts,
            "rag_config": exp.rag_config or {},
            "eval_records": [],
            "metrics_summary": {}
        }

        try:
            workflow = build_evaluation_workflow()
            final_state = await workflow.ainvoke(initial_state)

            # Persist records
            for rec in final_state.get("eval_records", []):
                db.add(EvaluationRecord(
                    run_id=run_id,
                    test_case_id=rec.get("test_case_id"),
                    input_prompt=rec.get("input_prompt"),
                    ground_truth=rec.get("ground_truth", ""),
                    retrieved_contexts=rec.get("retrieved_contexts", []),
                    generated_output=rec.get("generated_output", ""),
                    latency_ms=rec.get("latency_ms", 0.0),
                    prompt_tokens=rec.get("prompt_tokens", 0),
                    completion_tokens=rec.get("completion_tokens", 0),
                    estimated_cost=rec.get("estimated_cost", 0.0),
                    faithfulness_score=rec.get("faithfulness_score", 0.0),
                    answer_relevance_score=rec.get("answer_relevance_score", 0.0),
                    context_precision_score=rec.get("context_precision_score", 0.0),
                    hallucination_score=rec.get("hallucination_score", 0.0),
                    pass_fail=rec.get("pass_fail", True),
                    evaluation_reasoning=rec.get("evaluation_reasoning", "")
                ))

            run.metrics_summary = final_state.get("metrics_summary", {})
            run.status = "COMPLETED"
            run.completed_at = datetime.now(timezone.utc)

            # Langfuse observability
            tracker.log_run(
                run_id=run_id,
                experiment_name=exp.name,
                metrics=run.metrics_summary
            )

        except Exception as e:
            run.status = "FAILED"
            run.metrics_summary = {"error": str(e)}

        await db.commit()

@router.post("/run", response_model=ExperimentRunResponse)
async def trigger_run(payload: RunTriggerRequest, db: AsyncSession = Depends(get_db)):
    exp = await db.get(Experiment, payload.experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    dataset = await db.get(Dataset, payload.dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    run_name = payload.run_name or f"Run - {payload.model_name} ({datetime.now().strftime('%b %d %H:%M')})"
    run = ExperimentRun(
        experiment_id=payload.experiment_id,
        dataset_id=payload.dataset_id,
        name=run_name,
        model_name=payload.model_name or "qwen2.5:latest",
        status="RUNNING"
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    # Execute synchronously or fast async so immediate results return
    await execute_run_workflow(run.id, payload)
    await db.refresh(run)
    return run
