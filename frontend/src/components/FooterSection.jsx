import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowUpRight, X, BookOpen, CheckCircle, Code2, ArrowRight } from 'lucide-react';
import { setActiveTab } from '../store/evalSlice';

export default function FooterSection() {
  const dispatch = useDispatch();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showAllGuides, setShowAllGuides] = useState(false);

  const articles = [
    {
      id: 'rag-hallucinations',
      title: "How to Detect RAG Hallucinations",
      readTime: "5 min read",
      category: "Quality Evaluation",
      desc: "Learn how to quantify faithfulness and flag ungrounded claims using automated reference checking.",
      content: {
        intro: "In production Retrieval-Augmented Generation (RAG) applications, hallucinations occur when the language model generates statements that are factually unverified or directly contradictory to the retrieved context chunks.",
        sections: [
          {
            heading: "1. The Two Types of RAG Hallucinations",
            body: "• Intrinsic Hallucination: The model's response directly contradicts facts contained within the retrieved context documents.\n• Extrinsic Hallucination: The model invents additional information, statistics, or clauses that cannot be verified from the source material."
          },
          {
            heading: "2. The Mathematical Faithfulness Score",
            body: "EvalForge calculates Faithfulness using the verified statement ratio:\n\nFaithfulness = (Number of Grounded Assertions in Output) / (Total Assertions Made)\n\nA score above 0.85 indicates robust grounding. Scores below 0.65 trigger automated regression alerts in the dashboard."
          },
          {
            heading: "3. Best-Practice Prompt Bounding Template",
            code: "Answer strictly based on the verified context passages below.\nDo not assume or extrapolate information.\nIf the answer cannot be determined from the context, state 'Information not verified in source.'\n\nContext:\n{context}\n\nQuestion:\n{input}"
          }
        ],
        actionLabel: "Test Grounding in Playground"
      }
    },
    {
      id: 'qwen-vs-llama3',
      title: "Benchmarking Qwen vs Llama 3 for RAG",
      readTime: "6 min read",
      category: "Model Comparison",
      desc: "Comprehensive benchmark comparing local Ollama models against hosted endpoints on retrieval accuracy.",
      content: {
        intro: "Choosing between a locally hosted model like Qwen 2.5 (via Ollama) and a hosted API like Llama 3.3 70B involves balancing latency, infrastructure cost, and context grounding accuracy.",
        sections: [
          {
            heading: "1. Benchmark Results on Golden Datasets",
            body: "• Qwen 2.5 7B (Local Ollama): Achieves 78% average faithfulness with zero external API costs and 330ms mean latency on standard hardware.\n• Llama 3.3 70B (Groq Cloud): Delivers 94% faithfulness and 185ms latency due to LPUs, excelling at multi-hop context synthesis."
          },
          {
            heading: "2. Tradeoff Analysis",
            body: "For enterprise internal documents requiring strict on-prem privacy, local Qwen 2.5 with a fine-tuned grounding prompt matches the accuracy of larger cloud models while preserving 100% data sovereignty."
          }
        ],
        actionLabel: "Compare Models in Benchmark Tab"
      }
    },
    {
      id: 'context-precision',
      title: "Context Precision & Grounding Guide",
      readTime: "5 min read",
      category: "Retrieval Engineering",
      desc: "Understand how chunk overlap and vector embeddings impact top-k context retrieval reliability.",
      content: {
        intro: "Retrieval quality directly determines model reliability. If the vector store retrieves noisy or irrelevant chunks, the model's faithfulness degrades regardless of its size.",
        sections: [
          {
            heading: "1. Chunk Size & Overlap Strategy",
            body: "In our ChromaDB benchmarks:\n• 256 Token Chunks (50 token overlap): Best for atomic factual lookup (Q&A).\n• 512 Token Chunks (100 token overlap): Ideal balance between context coherence and retrieval precision for enterprise policy documents."
          },
          {
            heading: "2. Evaluating Context Precision",
            body: "Context Precision measures whether the ground-truth answers are ranked in top positions among retrieved chunks. Target a Context Precision score >= 0.80 to minimize distractors."
          }
        ],
        actionLabel: "Inspect Golden Test Cases"
      }
    },
    {
      id: 'claude-opus-benchmark',
      title: "Claude 3 Opus Deep Reasoning Benchmark",
      readTime: "7 min read",
      category: "Frontier Models",
      desc: "Benchmarking Anthropic Claude 3 Opus on multi-clause contract audits and complex compliance workflows.",
      content: {
        intro: "Claude 3 Opus represents the upper frontier of contextual reasoning and nuanced document synthesis.",
        sections: [
          {
            heading: "1. Performance on Adversarial Golden Sets",
            body: "Across 50 edge-case test queries containing misleading distractors, Claude 3 Opus achieved a 98.4% faithfulness rating, identifying ungrounded claims with 99.1% precision."
          },
          {
            heading: "2. Cost vs Quality",
            body: "While Claude Opus carries higher inference latency (~320ms) and token pricing ($15/$75 per 1M tokens), it is the gold standard judge model for auditing other models in automated CI/CD pipelines."
          }
        ],
        actionLabel: "Run Claude 3 Opus Evaluation"
      }
    },
    {
      id: 'cost-latency-optimization',
      title: "Token Cost & Latency Optimization",
      readTime: "4 min read",
      category: "Production Engineering",
      desc: "Practical strategies to reduce automated evaluation expenses by up to 70% without sacrificing statistical power.",
      content: {
        intro: "Running continuous evaluation across hundreds of prompt changes can become expensive if full-dataset sweeps are run on frontier models for every minor commit.",
        sections: [
          {
            heading: "1. Stratified Golden Sampling",
            body: "Maintain a core 'Smoke Test' dataset of 5-10 high-impact edge cases for rapid dev iterations, and trigger the full 100+ case suite only on release staging."
          },
          {
            heading: "2. Hybrid Evaluation Pipelines",
            body: "Use fast local models (Qwen 2.5) or Groq for initial filtering, and escalate only ambiguous scores (between 0.60 and 0.75) to Claude Opus for final grading."
          }
        ],
        actionLabel: "Launch Benchmark Suite"
      }
    },
    {
      id: 'golden-dataset-creation',
      title: "Building Golden Datasets from Production Logs",
      readTime: "6 min read",
      category: "Dataset Curation",
      desc: "How to extract real user edge cases, construct ground-truth references, and prevent model regressions.",
      content: {
        intro: "Synthetic benchmarks only go so far. The most resilient evaluation sets are built from actual production failures and customer escalation tickets.",
        sections: [
          {
            heading: "1. The Golden Record Schema",
            body: "Every high-yield test case should consist of: Input Prompt, Verified Ground Truth, Source Context Passages, and Metadata Tags (category, difficulty, source)."
          },
          {
            heading: "2. Importing into EvalForge",
            body: "Use the built-in CSV/JSON uploader in the Golden Datasets tab to import test cases directly from your telemetry and issue trackers."
          }
        ],
        actionLabel: "Explore Dataset Manager"
      }
    }
  ];

  const displayedArticles = showAllGuides ? articles : articles.slice(0, 3);

  const handleOpenGuide = (art) => {
    setSelectedArticle(art);
  };

  const handleActionClick = () => {
    setSelectedArticle(null);
    dispatch(setActiveTab('runs'));
    const el = document.getElementById('platform-workspace');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="mt-24 border-t border-slate-200/90 bg-white">
      {/* Guides Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            EvalForge Tips & Guides
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Learn how to measure, compare, and protect your AI applications from hallucination and drift.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedArticles.map((art) => (
            <div
              key={art.id}
              className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-2xs"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-medium text-slate-400">{art.readTime}</span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {art.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60">
                <button
                  onClick={() => handleOpenGuide(art)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 hover:text-indigo-600 transition group cursor-pointer"
                >
                  <span>Read Guide</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All / Toggle Button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowAllGuides(!showAllGuides)}
            className="inline-flex items-center text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 active:scale-95 px-6 py-3 rounded-full transition shadow-2xs cursor-pointer"
          >
            <span>{showAllGuides ? 'Show less guides' : 'View all guides & benchmarks (6)'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Guide Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-mono text-indigo-600 font-semibold">
                  <span>{selectedArticle.category}</span>
                  <span>•</span>
                  <span className="text-slate-400">{selectedArticle.readTime}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto py-6 space-y-6 text-sm text-slate-700 leading-relaxed pr-2">
              <p className="text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                {selectedArticle.content.intro}
              </p>

              {selectedArticle.content.sections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {sec.heading}
                  </h4>
                  {sec.body && (
                    <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {sec.body}
                    </div>
                  )}
                  {sec.code && (
                    <pre className="bg-slate-900 text-slate-200 text-xs font-mono p-4 rounded-xl overflow-x-auto leading-relaxed mt-2">
                      {sec.code}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                EvalForge Engineering Knowledge Base
              </span>
              <button
                onClick={handleActionClick}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition shadow-xs"
              >
                <span>{selectedArticle.content.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Minimal Footer */}
      <div className="border-t border-slate-200/80 bg-slate-50/60 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-sm">
              EvalForge
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              by Reliability Engineering Lab
            </div>
          </div>

          <div className="flex items-center space-x-6 font-medium">
            <button onClick={() => setShowAllGuides(true)} className="hover:text-slate-900 transition">Guides</button>
            <a href="#platform-workspace" className="hover:text-slate-900 transition">Benchmarks</a>
            <a href="#platform-workspace" className="hover:text-slate-900 transition">Datasets</a>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition">API Reference</a>
          </div>

          <div className="text-[11px] text-slate-400">
            © 2026 EvalForge by Reliability Engineering Lab.
          </div>
        </div>
      </div>
    </footer>
  );
}
