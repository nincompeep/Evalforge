import asyncio
from datetime import datetime, timezone, timedelta
from app.db.session import AsyncSessionLocal, init_db
from app.db.models import Project, Dataset, TestCase, Experiment, ExperimentRun, EvaluationRecord

async def seed_database():
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy.future import select
        res = await db.execute(select(Project))
        if res.scalars().first():
            print("Database already contains projects. Skipping seeding.")
            return

        print("Seeding EvalForge with realistic enterprise benchmark data...")

        # 1. Project
        project = Project(
            name="Enterprise Customer Copilot",
            description="LLM and RAG evaluation suite for customer service automation, policy adherence, and hallucination reduction."
        )
        db.add(project)
        await db.flush()

        # 2. Golden Dataset
        dataset = Dataset(
            project_id=project.id,
            name="Golden Policy & Refunds Test Suite",
            description="5 curated high-impact test cases covering return policies, SLA windows, privacy rules, and exceptions."
        )
        db.add(dataset)
        await db.flush()

        test_cases_data = [
            {
                "input_prompt": "What is the return window for opened software licenses, and do customers get cash refunds?",
                "ground_truth": "Software licenses are non-refundable once the digital license key has been revealed or activated. If unopened/unrevealed, customers may request store credit within 14 days of purchase. No cash refunds are granted for digital software.",
                "context_documents": [
                    "Section 4.2 - Digital Goods: Activated digital licenses and revealed keys are strictly non-refundable. Store credit is permitted within 14 calendar days only if the key remains unrevealed.",
                    "Section 4.5 - Payout Methods: Digital products are eligible for store credit or replacement only; cash or card charge reversals are not authorized for digital licenses."
                ]
            },
            {
                "input_prompt": "Can an enterprise customer roll over unused monthly API support hours to the next billing quarter?",
                "ground_truth": "No. Support hours expire at the end of each monthly billing cycle and do not roll over to subsequent months or quarters, except for Tier 4 Diamond agreements with written addenda.",
                "context_documents": [
                    "SLA Policy 8.1: Dedicated tier support hours are allocated on a per-calendar-month basis. Unused support allocations forfeit at 23:59 UTC on the final day of the billing period.",
                    "SLA Policy 8.3: Rollover hours are strictly restricted to custom Tier 4 Diamond enterprise contracts containing explicit Schedule E addenda."
                ]
            },
            {
                "input_prompt": "How does our platform handle customer data deletion requests under GDPR Article 17?",
                "ground_truth": "Customer data deletion requests are processed within 30 days. PII is permanently purged from production databases and scrubbed from secondary backups within 60 days.",
                "context_documents": [
                    "Privacy & Compliance Clause 12: In compliance with GDPR and CCPA, account erasure requests must be validated by Security and purged from live stores within 30 calendar days. Immutable offline archives are rotated and cleared within 60 days."
                ]
            },
            {
                "input_prompt": "What is the maximum latency guaranteed for priority streaming inference under the Enterprise SLA?",
                "ground_truth": "The Enterprise SLA guarantees a first-token latency of under 250ms for 99.5% of requests during standard operating hours.",
                "context_documents": [
                    "Infrastructure SLA Doc 3.1: For Priority Streaming tier endpoints, First Token Latency (FTL) is guaranteed at <= 250 milliseconds at the 99.5th percentile across North American and European clusters."
                ]
            },
            {
                "input_prompt": "Can a customer downgrade their plan mid-billing cycle and receive a prorated refund for remaining days?",
                "ground_truth": "Customers can downgrade anytime, but changes take effect at the end of the current billing cycle. No prorated refunds are issued for early downgrades.",
                "context_documents": [
                    "Billing Terms 5.4: Plan downgrades become effective upon the commencement of the subsequent subscription period. Prorated refunds or credits are not provided for partial term usage."
                ]
            }
        ]

        created_tcs = []
        for tc_dict in test_cases_data:
            tc = TestCase(
                dataset_id=dataset.id,
                input_prompt=tc_dict["input_prompt"],
                ground_truth=tc_dict["ground_truth"],
                context_documents=tc_dict["context_documents"]
            )
            db.add(tc)
            created_tcs.append(tc)
        await db.flush()

        # 3. Experiment
        experiment = Experiment(
            project_id=project.id,
            name="Policy QA - Model Benchmark & Prompt Grounding",
            description="Comparing Ollama Qwen2.5 baseline against Llama 3.3 70B with strict RAG context grounding prompt.",
            model_configs=[
                {"provider": "ollama", "model_name": "qwen2.5:latest", "temperature": 0.2},
                {"provider": "groq", "model_name": "llama-3.3-70b-versatile", "temperature": 0.1}
            ],
            prompt_template="Answer the question using strictly the verified context below. Do not speculate:\n\n{input}",
            rag_config={"enabled": True, "collection_name": "policy_qa_docs", "top_k": 2}
        )
        db.add(experiment)
        await db.flush()

        # 4. Seed Run A (Baseline: Qwen 2.5 7B)
        now = datetime.now(timezone.utc)
        run_a = ExperimentRun(
            experiment_id=experiment.id,
            dataset_id=dataset.id,
            name="Run #1 - Qwen 2.5 7B (Baseline Prompt)",
            model_name="qwen2.5:7b-instruct",
            status="COMPLETED",
            metrics_summary={
                "total_samples": 5,
                "avg_faithfulness": 0.74,
                "avg_relevance": 0.81,
                "avg_precision": 0.78,
                "hallucination_rate": 0.26,
                "pass_rate": 80.0,
                "avg_latency_ms": 340.5,
                "total_cost": 0.0
            },
            started_at=now - timedelta(hours=2),
            completed_at=now - timedelta(hours=1, minutes=58)
        )
        db.add(run_a)
        await db.flush()

        # Records for Run A
        for tc in created_tcs:
            db.add(EvaluationRecord(
                run_id=run_a.id,
                test_case_id=tc.id,
                input_prompt=tc.input_prompt,
                ground_truth=tc.ground_truth,
                retrieved_contexts=tc.context_documents,
                generated_output=f"According to policy, {tc.ground_truth[:90]}... (Generated by Qwen2.5)",
                latency_ms=330.0,
                prompt_tokens=140,
                completion_tokens=65,
                estimated_cost=0.0,
                faithfulness_score=0.74,
                answer_relevance_score=0.81,
                context_precision_score=0.78,
                hallucination_score=0.26,
                pass_fail=True,
                evaluation_reasoning="Moderate faithfulness. Answer mostly grounded, with minor phrasing drift."
            ))

        # 5. Seed Run B (Optimized: Llama 3.3 70B Grounded)
        run_b = ExperimentRun(
            experiment_id=experiment.id,
            dataset_id=dataset.id,
            name="Run #2 - Llama 3.3 70B (Strict Grounding)",
            model_name="llama-3.3-70b-versatile",
            status="COMPLETED",
            metrics_summary={
                "total_samples": 5,
                "avg_faithfulness": 0.94,
                "avg_relevance": 0.92,
                "avg_precision": 0.91,
                "hallucination_rate": 0.06,
                "pass_rate": 100.0,
                "avg_latency_ms": 185.2,
                "total_cost": 0.000412
            },
            started_at=now - timedelta(minutes=45),
            completed_at=now - timedelta(minutes=44)
        )
        db.add(run_b)
        await db.flush()

        # Records for Run B
        for tc in created_tcs:
            db.add(EvaluationRecord(
                run_id=run_b.id,
                test_case_id=tc.id,
                input_prompt=tc.input_prompt,
                ground_truth=tc.ground_truth,
                retrieved_contexts=tc.context_documents,
                generated_output=f"Strict Context Verified: {tc.ground_truth} (Llama 3.3 70B)",
                latency_ms=185.0,
                prompt_tokens=145,
                completion_tokens=55,
                estimated_cost=0.000082,
                faithfulness_score=0.94,
                answer_relevance_score=0.92,
                context_precision_score=0.91,
                hallucination_score=0.06,
                pass_fail=True,
                evaluation_reasoning="High faithfulness and precision. All factual claims are verified by retrieved context." ))
        # 6. Seed Run C (Premier: Claude 3 Opus)
        run_c = ExperimentRun(
            experiment_id=experiment.id,
            dataset_id=dataset.id,
            name="Run #3 - Claude 3 Opus (Deep Grounding)",
            model_name="claude-3-opus",
            status="COMPLETED",
            metrics_summary={
                "total_samples": 5,
                "avg_faithfulness": 0.98,
                "avg_relevance": 0.96,
                "avg_precision": 0.95,
                "hallucination_rate": 0.02,
                "pass_rate": 100.0,
                "avg_latency_ms": 320.0,
                "total_cost": 0.00512
            },
            started_at=now - timedelta(minutes=15),
            completed_at=now - timedelta(minutes=14)
        )
        db.add(run_c)
        await db.flush()

        for tc in created_tcs:
            db.add(EvaluationRecord(
                run_id=run_c.id,
                test_case_id=tc.id,
                input_prompt=tc.input_prompt,
                ground_truth=tc.ground_truth,
                retrieved_contexts=tc.context_documents,
                generated_output=f"Claude Opus Verified Statement: {tc.ground_truth} Strict policy compliance confirmed with zero unverified extrapolation.",
                latency_ms=320.0,
                prompt_tokens=160,
                completion_tokens=60,
                estimated_cost=0.001024,
                faithfulness_score=0.98,
                answer_relevance_score=0.96,
                context_precision_score=0.95,
                hallucination_score=0.02,
                pass_fail=True,
                evaluation_reasoning="Flawless faithfulness (0.98). Response rigorously grounded in retrieved clauses without speculative hallucination."
            ))

        await db.commit()
        print("Database successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed_database())
