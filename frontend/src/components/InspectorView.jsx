import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FileSearch, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function InspectorView() {
  const { selectedRun, selectedRunRecords } = useSelector((state) => state.eval);
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SAMPLE RECORD INSPECTION
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <FileSearch className="w-5 h-5 text-slate-900" />
              <span>Prompt & Grounding Record Inspector</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Deep-dive into individual model outputs, hallucination detection flags, and evaluation rationales for <span className="font-mono text-slate-900 font-semibold">{selectedRun?.name || "Active Run"}</span>.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {selectedRunRecords.length} records evaluated
          </span>
        </div>
      </div>

      {/* Records Accordion List */}
      <div className="space-y-3">
        {selectedRunRecords.map((rec, idx) => {
          const isExpanded = expandedIndex === idx;
          const isPassed = rec.pass_fail;
          const faithPct = (rec.faithfulness_score * 100).toFixed(0);
          const relevPct = (rec.answer_relevance_score * 100).toFixed(0);
          const hallucPct = (rec.hallucination_score * 100).toFixed(0);

          return (
            <div
              key={rec.id || idx}
              className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-2xs ${
                isExpanded ? 'border-slate-400 shadow-xs' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Header Bar */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-1.5 rounded-lg ${isPassed ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">
                      {rec.input_prompt}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-3 font-mono">
                      <span>{rec.latency_ms}ms</span>
                      <span>•</span>
                      <span>{rec.prompt_tokens + rec.completion_tokens} tokens</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-600">
                    <span className="font-semibold text-slate-800">{faithPct}% faithful</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{hallucPct}% hallucination</span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-5">
                  {/* Model Generated Output */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Model Generated Output:
                    </span>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-900 leading-relaxed font-mono shadow-2xs">
                      {rec.generated_output}
                    </div>
                  </div>

                  {/* Ground Truth & Evaluator Reasoning */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ground truth */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        Ground Truth Reference:
                      </span>
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 leading-relaxed font-medium">
                        {rec.ground_truth || "No reference answer provided."}
                      </div>
                    </div>

                    {/* Evaluator Reasoning */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Evaluation Rationale:
                      </span>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed font-medium">
                        {rec.evaluation_reasoning || "Standard groundedness criteria met."}
                      </div>
                    </div>
                  </div>

                  {/* Retrieved Contexts */}
                  {rec.retrieved_contexts && rec.retrieved_contexts.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Retrieved Context Passages:
                      </span>
                      <div className="space-y-2">
                        {rec.retrieved_contexts.map((ctx, cIdx) => (
                          <div key={cIdx} className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-mono text-[11px]">
                            {ctx}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
