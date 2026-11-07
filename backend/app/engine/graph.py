from typing import List, Dict, Any, Optional, TypedDict
from app.engine.models import run_model_inference
from app.engine.metrics import EvaluationMetrics
from app.engine.rag import RAGPipeline

class EvalGraphState(TypedDict):
    run_id: str
    model_name: str
    provider: str
    prompt_template: str
    temperature: float
    test_cases: List[Dict[str, Any]]
    rag_config: Dict[str, Any]
    eval_records: List[Dict[str, Any]]
    metrics_summary: Dict[str, Any]

async def rag_retrieval_node(state: EvalGraphState) -> EvalGraphState:
    rag_cfg = state.get("rag_config", {})
    if not rag_cfg.get("enabled", False):
        return state

    collection_name = rag_cfg.get("collection_name", "evalforge_default")
    top_k = rag_cfg.get("top_k", 2)
    pipeline = RAGPipeline(collection_name=collection_name)

    updated_test_cases = []
    for tc in state["test_cases"]:
        # If contexts are already provided in test case, keep them; otherwise retrieve
        contexts = tc.get("context_documents", [])
        if not contexts:
            contexts = pipeline.retrieve(query=tc["input_prompt"], top_k=top_k)
        tc_copy = dict(tc)
        tc_copy["context_documents"] = contexts
        updated_test_cases.append(tc_copy)

    state["test_cases"] = updated_test_cases
    return state

async def inference_node(state: EvalGraphState) -> EvalGraphState:
    provider = state.get("provider", "mock")
    model_name = state.get("model_name", "qwen2.5:latest")
    prompt_template = state.get("prompt_template", "{input}")
    temperature = state.get("temperature", 0.2)

    eval_records = []
    for tc in state["test_cases"]:
        raw_prompt = tc["input_prompt"]
        formatted_prompt = prompt_template.replace("{input}", raw_prompt)
        contexts = tc.get("context_documents", [])
        context_str = "\n---\n".join(contexts) if contexts else None

        response = await run_model_inference(
            provider=provider,
            model_name=model_name,
            prompt=formatted_prompt,
            context=context_str,
            temperature=temperature
        )

        eval_records.append({
            "test_case_id": tc.get("id"),
            "input_prompt": raw_prompt,
            "ground_truth": tc.get("ground_truth", ""),
            "retrieved_contexts": contexts,
            "generated_output": response.text,
            "latency_ms": response.latency_ms,
            "prompt_tokens": response.prompt_tokens,
            "completion_tokens": response.completion_tokens,
            "estimated_cost": response.cost,
        })

    state["eval_records"] = eval_records
    return state

async def evaluation_node(state: EvalGraphState) -> EvalGraphState:
    records = state["eval_records"]
    evaluated = []

    for item in records:
        eval_result = EvaluationMetrics.evaluate_sample(
            prompt=item["input_prompt"],
            output=item["generated_output"],
            contexts=item["retrieved_contexts"],
            ground_truth=item["ground_truth"]
        )

        merged = dict(item)
        merged["faithfulness_score"] = eval_result["faithfulness"]
        merged["answer_relevance_score"] = eval_result["answer_relevance"]
        merged["context_precision_score"] = eval_result["context_precision"]
        merged["hallucination_score"] = eval_result["hallucination_score"]
        merged["pass_fail"] = eval_result["pass_fail"]
        merged["evaluation_reasoning"] = eval_result["reasoning"]
        evaluated.append(merged)

    state["eval_records"] = evaluated
    return state

async def aggregation_node(state: EvalGraphState) -> EvalGraphState:
    records = state["eval_records"]
    if not records:
        state["metrics_summary"] = {
            "total_samples": 0,
            "avg_faithfulness": 0.0,
            "avg_relevance": 0.0,
            "avg_precision": 0.0,
            "hallucination_rate": 0.0,
            "pass_rate": 0.0,
            "avg_latency_ms": 0.0,
            "total_cost": 0.0
        }
        return state

    n = len(records)
    avg_faith = sum(r["faithfulness_score"] for r in records) / n
    avg_rel = sum(r["answer_relevance_score"] for r in records) / n
    avg_prec = sum(r["context_precision_score"] for r in records) / n
    avg_halluc = sum(r["hallucination_score"] for r in records) / n
    avg_lat = sum(r["latency_ms"] for r in records) / n
    total_cost = sum(r["estimated_cost"] for r in records)
    pass_count = sum(1 for r in records if r["pass_fail"])

    state["metrics_summary"] = {
        "total_samples": n,
        "avg_faithfulness": round(avg_faith, 2),
        "avg_relevance": round(avg_rel, 2),
        "avg_precision": round(avg_prec, 2),
        "hallucination_rate": round(avg_halluc, 2),
        "pass_rate": round((pass_count / n) * 100, 1),
        "avg_latency_ms": round(avg_lat, 1),
        "total_cost": round(total_cost, 6)
    }
    return state

def build_evaluation_workflow():
    try:
        from langgraph.graph import StateGraph, START, END

        builder = StateGraph(EvalGraphState)
        builder.add_node("rag_retrieval", rag_retrieval_node)
        builder.add_node("inference", inference_node)
        builder.add_node("evaluation", evaluation_node)
        builder.add_node("aggregation", aggregation_node)

        builder.add_edge(START, "rag_retrieval")
        builder.add_edge("rag_retrieval", "inference")
        builder.add_edge("inference", "evaluation")
        builder.add_edge("evaluation", "aggregation")
        builder.add_edge("aggregation", END)

        return builder.compile()
    except Exception:
        # Fallback executor if langgraph graph compilation is invoked in a standalone flow
        class StandaloneRunner:
            async def ainvoke(self, state: EvalGraphState) -> EvalGraphState:
                s1 = await rag_retrieval_node(state)
                s2 = await inference_node(s1)
                s3 = await evaluation_node(s2)
                s4 = await aggregation_node(s3)
                return s4
        return StandaloneRunner()
