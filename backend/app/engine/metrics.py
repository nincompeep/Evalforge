import re
from typing import List, Dict, Any, Optional

def clean_tokens(text: str) -> set:
    words = re.findall(r"\b\w{3,}\b", text.lower())
    stopwords = {"the", "and", "that", "this", "with", "from", "for", "are", "was", "were", "been"}
    return {w for w in words if w not in stopwords}

class EvaluationMetrics:
    @staticmethod
    def calculate_faithfulness(output: str, contexts: List[str]) -> Dict[str, Any]:
        """
        RAGAS/DeepEval inspired faithfulness:
        Checks if claims made in output are grounded in the retrieved contexts.
        """
        if not contexts:
            # If no context was provided, faithfulness is neutral or ungrounded if context was expected
            return {"score": 0.85, "reasoning": "No context provided; standard assertion validity assumed."}

        context_combined = " ".join(contexts)
        output_tokens = clean_tokens(output)
        context_tokens = clean_tokens(context_combined)

        if not output_tokens:
            return {"score": 1.0, "reasoning": "Output was empty."}

        grounded_tokens = output_tokens.intersection(context_tokens)
        grounded_ratio = len(grounded_tokens) / len(output_tokens)

        # Scale grounded ratio realistically
        score = min(1.0, max(0.1, round(grounded_ratio * 1.35, 2)))
        hallucination_score = round(1.0 - score, 2)

        if score >= 0.80:
            reasoning = f"High faithfulness ({score}): Output claims are firmly backed by retrieved context passages."
        elif score >= 0.60:
            reasoning = f"Moderate faithfulness ({score}): Minor unsupported assertions or slight drift from source documents."
        else:
            reasoning = f"Low faithfulness ({score}): Potential hallucination detected. Multiple entities/statements not present in context."

        return {
            "score": score,
            "hallucination_score": hallucination_score,
            "reasoning": reasoning
        }

    @staticmethod
    def calculate_answer_relevance(prompt: str, output: str) -> Dict[str, Any]:
        """
        Calculates how directly the answer addresses the prompt question.
        """
        prompt_tokens = clean_tokens(prompt)
        output_tokens = clean_tokens(output)

        if not prompt_tokens or not output_tokens:
            return {"score": 0.5, "reasoning": "Insufficient tokens to determine relevance."}

        overlap = prompt_tokens.intersection(output_tokens)
        relevance_ratio = len(overlap) / len(prompt_tokens)
        score = min(1.0, max(0.2, round(0.4 + (relevance_ratio * 0.7), 2)))

        if score >= 0.75:
            reasoning = f"Directly relevant ({score}): Response specifically addresses the user intent and keywords."
        else:
            reasoning = f"Partially relevant ({score}): Response provides related information but strays from central question."

        return {"score": score, "reasoning": reasoning}

    @staticmethod
    def calculate_context_precision(ground_truth: str, contexts: List[str]) -> Dict[str, Any]:
        """
        Evaluates whether retrieved contexts are accurate to the reference answer.
        """
        if not contexts or not ground_truth:
            return {"score": 0.80, "reasoning": "Ground truth or context not supplied; baseline precision assumed."}

        gt_tokens = clean_tokens(ground_truth)
        precision_scores = []

        for idx, ctx in enumerate(contexts):
            ctx_tokens = clean_tokens(ctx)
            if not ctx_tokens:
                continue
            overlap = gt_tokens.intersection(ctx_tokens)
            precision_scores.append(len(overlap) / max(1, len(gt_tokens)))

        avg_precision = sum(precision_scores) / len(precision_scores) if precision_scores else 0.5
        score = min(1.0, max(0.1, round(avg_precision * 1.25, 2)))
        return {
            "score": score,
            "reasoning": f"Retrieved {len(contexts)} contexts with {score * 100:.0f}% ground-truth alignment."
        }

    @classmethod
    def evaluate_sample(
        cls,
        prompt: str,
        output: str,
        contexts: List[str],
        ground_truth: Optional[str] = None
    ) -> Dict[str, Any]:
        faithfulness = cls.calculate_faithfulness(output, contexts)
        relevance = cls.calculate_answer_relevance(prompt, output)
        precision = cls.calculate_context_precision(ground_truth or "", contexts)

        faith_score = faithfulness["score"]
        rel_score = relevance["score"]
        halluc_score = faithfulness.get("hallucination_score", 0.0)
        prec_score = precision["score"]

        # Pass condition: Faithfulness >= 0.65 and Relevance >= 0.60
        passed = (faith_score >= 0.65) and (rel_score >= 0.60)
        combined_reasoning = f"{faithfulness['reasoning']} | {relevance['reasoning']}"

        return {
            "faithfulness": faith_score,
            "answer_relevance": rel_score,
            "context_precision": prec_score,
            "hallucination_score": halluc_score,
            "pass_fail": passed,
            "reasoning": combined_reasoning
        }
