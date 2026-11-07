from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import json
import csv
import io
from app.db.session import get_db
from app.db.models import Dataset, TestCase, Project
from app.api.schemas import DatasetCreate, DatasetResponse, TestCaseCreate, TestCaseResponse

router = APIRouter(prefix="/datasets", tags=["datasets"])

@router.get("/project/{project_id}", response_model=List[DatasetResponse])
async def list_datasets_for_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Dataset)
        .options(selectinload(Dataset.test_cases))
        .filter(Dataset.project_id == project_id)
        .order_by(Dataset.created_at.desc())
    )
    datasets = result.scalars().all()
    responses = []
    for d in datasets:
        responses.append(DatasetResponse(
            id=d.id,
            project_id=d.project_id,
            name=d.name,
            description=d.description or "",
            test_cases_count=len(d.test_cases),
            created_at=d.created_at
        ))
    return responses

@router.post("/project/{project_id}", response_model=DatasetResponse)
async def create_dataset(project_id: str, data: DatasetCreate, db: AsyncSession = Depends(get_db)):
    # Verify project
    proj = await db.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    dataset = Dataset(
        project_id=project_id,
        name=data.name,
        description=data.description or ""
    )
    db.add(dataset)
    await db.flush()

    if data.test_cases:
        for tc in data.test_cases:
            db.add(TestCase(
                dataset_id=dataset.id,
                input_prompt=tc.input_prompt,
                ground_truth=tc.ground_truth or "",
                context_documents=tc.context_documents or [],
                metadata_info=tc.metadata_info or {}
            ))

    await db.commit()
    await db.refresh(dataset)
    return DatasetResponse(
        id=dataset.id,
        project_id=dataset.project_id,
        name=dataset.name,
        description=dataset.description,
        test_cases_count=len(data.test_cases or []),
        created_at=dataset.created_at
    )

@router.get("/{dataset_id}/test_cases", response_model=List[TestCaseResponse])
async def get_dataset_test_cases(dataset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestCase).filter(TestCase.dataset_id == dataset_id))
    return result.scalars().all()

@router.post("/{dataset_id}/test_cases", response_model=TestCaseResponse)
async def add_test_case(dataset_id: str, data: TestCaseCreate, db: AsyncSession = Depends(get_db)):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    tc = TestCase(
        dataset_id=dataset_id,
        input_prompt=data.input_prompt,
        ground_truth=data.ground_truth or "",
        context_documents=data.context_documents or [],
        metadata_info=data.metadata_info or {}
    )
    db.add(tc)
    await db.commit()
    await db.refresh(tc)
    return tc

@router.post("/{dataset_id}/upload_csv")
async def upload_csv_dataset(dataset_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    content = await file.read()
    decoded = content.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(decoded))
    
    count = 0
    for row in reader:
        prompt = row.get("prompt") or row.get("input") or row.get("input_prompt") or ""
        if not prompt:
            continue
        ground_truth = row.get("ground_truth") or row.get("target") or row.get("answer") or ""
        context = row.get("context") or row.get("contexts") or ""
        contexts_list = [context] if context else []
        
        tc = TestCase(
            dataset_id=dataset_id,
            input_prompt=prompt,
            ground_truth=ground_truth,
            context_documents=contexts_list
        )
        db.add(tc)
        count += 1

    await db.commit()
    return {"status": "success", "imported_count": count}
