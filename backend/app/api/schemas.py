from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TestCaseBase(BaseModel):
    input_prompt: str
    ground_truth: Optional[str] = ""
    context_documents: Optional[List[str]] = []
    metadata_info: Optional[Dict[str, Any]] = {}

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseResponse(TestCaseBase):
    id: str
    dataset_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    test_cases: Optional[List[TestCaseCreate]] = []

class DatasetResponse(BaseModel):
    id: str
    project_id: str
    name: str
    description: str
    test_cases_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

class ExperimentCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    model_configs: Optional[List[Dict[str, Any]]] = []
    prompt_template: Optional[str] = "{input}"
    rag_config: Optional[Dict[str, Any]] = {}

class ExperimentResponse(BaseModel):
    id: str
    project_id: str
    name: str
    description: str
    model_configs: List[Dict[str, Any]]
    prompt_template: str
    rag_config: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class RunTriggerRequest(BaseModel):
    experiment_id: str
    dataset_id: str
    run_name: Optional[str] = ""
    provider: Optional[str] = "mock"  # ollama, groq, mock
    model_name: Optional[str] = "qwen2.5:latest"
    prompt_template: Optional[str] = None
    temperature: Optional[float] = 0.2

class EvaluationRecordResponse(BaseModel):
    id: str
    run_id: str
    test_case_id: Optional[str]
    input_prompt: str
    ground_truth: Optional[str]
    retrieved_contexts: List[str]
    generated_output: str
    latency_ms: float
    prompt_tokens: int
    completion_tokens: int
    estimated_cost: float
    faithfulness_score: float
    answer_relevance_score: float
    context_precision_score: float
    hallucination_score: float
    pass_fail: bool
    evaluation_reasoning: str
    created_at: datetime

    class Config:
        from_attributes = True

class ExperimentRunResponse(BaseModel):
    id: str
    experiment_id: str
    dataset_id: str
    name: str
    status: str
    model_name: str
    metrics_summary: Dict[str, Any]
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
