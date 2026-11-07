# EvalForge — LLM Evaluation & Reliability Platform

EvalForge is a comprehensive developer-centric platform to evaluate, compare, and benchmark **Large Language Models**, **prompt templates**, and **RAG pipelines** against standardized golden test sets.

---

## 🏗️ Architecture & Tech Stack

EvalForge is architected strictly according to your system blueprint:

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React.js (v18) + Vite | High-performance developer web interface |
| **State Management** | Redux Toolkit | Centralized state for projects, runs, and comparison deltas |
| **UI Styling** | Tailwind CSS (Dark Mode) | Modern developer dark theme matching evaluation platforms |
| **Visualization** | Recharts | Multi-dimensional radar charts, model comparison bar graphs |
| **Backend API** | Python 3.12 + FastAPI | REST APIs with asynchronous execution and background jobs |
| **Workflow Engine** | LangGraph | Modular evaluation pipeline DAG (Retrieval $\to$ Inference $\to$ Evaluate $\to$ Aggregate) |
| **LLM Integration** | LangChain & LangChain Community | Model connectors and prompt template pipeline |
| **Local LLM** | Ollama (Qwen2.5 / Qwen3) | Local inference engine + Groq / Cloud API fallback |
| **Embeddings & Vector DB** | ChromaDB + HuggingFace | Persistent vector retrieval sandbox for RAG pipelines |
| **Quality Evaluation** | RAGAS & DeepEval Criteria | Automated Faithfulness, Hallucination Rate, Relevance, Precision |
| **Observability** | Langfuse | Tracing, metadata, and token cost tracking |
| **Database** | SQLite + SQLAlchemy Async | Experiment history, datasets, test cases, and evaluation records |

---

## ⚡ Quickstart Guide

### 1. Start the Backend API (FastAPI)
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
- API will be accessible at: `http://localhost:8000`
- Interactive Swagger docs at: `http://localhost:8000/docs`
- On startup, the database is automatically seeded with sample enterprise test cases and benchmark runs.

### 2. Start the Frontend Dashboard (React + Vite)
```bash
cd frontend
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## 🔍 Core Features

- **Multi-Dimensional Reliability Radar**: Visualizes Faithfulness, Relevance, Groundedness, and Context Precision on a 0–100 scale.
- **Hallucination Detection**: Flags unsupported model assertions and quantifies hallucination risk percentages.
- **A/B Model & Prompt Comparison**: Side-by-side run comparison showing exact delta tags ($+12\%$ faithfulness, $-150\text{ms}$ latency).
- **Golden Dataset Hub**: Manage test cases with prompts, reference answers (ground truth), and context chunks. Supports CSV imports.
- **Granular Record Inspector**: Line-by-line inspection of prompt, retrieved context passages, generated text, and evaluator verbal rationale.
