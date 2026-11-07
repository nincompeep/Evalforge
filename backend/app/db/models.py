import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, Integer, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)

    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")
    experiments = relationship("Experiment", back_populates="project", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(120), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)

    project = relationship("Project", back_populates="datasets")
    test_cases = relationship("TestCase", back_populates="dataset", cascade="all, delete-orphan")
    runs = relationship("ExperimentRun", back_populates="dataset", cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    input_prompt = Column(Text, nullable=False)
    ground_truth = Column(Text, nullable=True, default="")
    context_documents = Column(JSON, default=list)  # list of str or dict
    metadata_info = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    dataset = relationship("Dataset", back_populates="test_cases")
    records = relationship("EvaluationRecord", back_populates="test_case")

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(120), nullable=False)
    description = Column(Text, default="")
    model_configs = Column(JSON, default=list)  # list of provider configs
    prompt_template = Column(Text, default="{input}")
    rag_config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    project = relationship("Project", back_populates="experiments")
    runs = relationship("ExperimentRun", back_populates="experiment", cascade="all, delete-orphan")

class ExperimentRun(Base):
    __tablename__ = "experiment_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    experiment_id = Column(String(36), ForeignKey("experiments.id"), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    name = Column(String(150), nullable=False)
    status = Column(String(30), default="QUEUED")  # QUEUED, RUNNING, COMPLETED, FAILED
    model_name = Column(String(100), default="default")
    metrics_summary = Column(JSON, default=dict)  # avg_faithfulness, avg_relevance, etc.
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    experiment = relationship("Experiment", back_populates="runs")
    dataset = relationship("Dataset", back_populates="runs")
    records = relationship("EvaluationRecord", back_populates="run", cascade="all, delete-orphan")

class EvaluationRecord(Base):
    __tablename__ = "evaluation_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("experiment_runs.id"), nullable=False)
    test_case_id = Column(String(36), ForeignKey("test_cases.id"), nullable=True)
    input_prompt = Column(Text, nullable=False)
    ground_truth = Column(Text, default="")
    retrieved_contexts = Column(JSON, default=list)
    generated_output = Column(Text, default="")
    latency_ms = Column(Float, default=0.0)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)
    faithfulness_score = Column(Float, default=0.0)
    answer_relevance_score = Column(Float, default=0.0)
    context_precision_score = Column(Float, default=0.0)
    hallucination_score = Column(Float, default=0.0)
    pass_fail = Column(Boolean, default=True)
    evaluation_reasoning = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)

    run = relationship("ExperimentRun", back_populates="records")
    test_case = relationship("TestCase", back_populates="records")
