import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GitCompare, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { compareTwoRuns } from '../store/evalSlice';

export default function ComparisonView() {
  const dispatch = useDispatch();
  const { runs, comparisonData } = useSelector((state) => state.eval);

  const [runAId, setRunAId] = useState(runs[1]?.id || runs[0]?.id || '');
  const [runBId, setRunBId] = useState(runs[0]?.id || '');

  useEffect(() => {
    if (runAId && runBId && runAId !== runBId) {
      dispatch(compareTwoRuns({ runAId, runBId }));
    }
  }, [runAId, runBId, dispatch]);

  const runA = comparisonData?.run_a;
  const runB = comparisonData?.run_b;
  const delta = comparisonData?.delta || {};

  const radarData = [
    {
      metric: 'Faithfulness',
      RunA: Math.round((runA?.metrics?.avg_faithfulness || 0) * 100),
      RunB: Math.round((runB?.metrics?.avg_faithfulness || 0) * 100),
    },
    {
      metric: 'Relevance',
      RunA: Math.round((runA?.metrics?.avg_relevance || 0) * 100),
      RunB: Math.round((runB?.metrics?.avg_relevance || 0) * 100),
    },
    {
      metric: 'Precision',
      RunA: Math.round((runA?.metrics?.avg_precision || 0) * 100),
      RunB: Math.round((runB?.metrics?.avg_precision || 0) * 100),
    },
    {
      metric: 'Pass Rate',
      RunA: Math.round(runA?.metrics?.pass_rate || 0),
      RunB: Math.round(runB?.metrics?.pass_rate || 0),
    },
    {
      metric: 'Low Drift',
      RunA: 100 - Math.round((runA?.metrics?.hallucination_rate || 0) * 100),
      RunB: 100 - Math.round((runB?.metrics?.hallucination_rate || 0) * 100),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          REGRESSION ANALYSIS
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <GitCompare className="w-5 h-5 text-indigo-600" />
          <span>Model & Prompt Regression Comparison</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Compare two evaluation runs to detect performance gains, regression, hallucination drift, or latency variations across Claude, Qwen, and Llama prompts.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline A */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Baseline Run (A)
          </label>
          <select
            value={runAId}
            onChange={(e) => setRunAId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.model_name})
              </option>
            ))}
          </select>
        </div>

        {/* Candidate B */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Candidate Run (B)
          </label>
          <select
            value={runBId}
            onChange={(e) => setRunBId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.model_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deltas Grid */}
      {comparisonData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Faithfulness */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">FAITHFULNESS DELTA</span>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-extrabold font-mono ${delta.faithfulness_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {delta.faithfulness_delta >= 0 ? `+${(delta.faithfulness_delta * 100).toFixed(0)}%` : `${(delta.faithfulness_delta * 100).toFixed(0)}%`}
              </span>
              {delta.faithfulness_delta >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
            </div>
          </div>

          {/* Hallucination */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">HALLUCINATION DELTA</span>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-extrabold font-mono ${delta.hallucination_delta <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {delta.hallucination_delta >= 0 ? `+${(delta.hallucination_delta * 100).toFixed(0)}%` : `${(delta.hallucination_delta * 100).toFixed(0)}%`}
              </span>
              {delta.hallucination_delta <= 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
            </div>
          </div>

          {/* Latency */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">LATENCY DELTA</span>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-extrabold font-mono ${delta.latency_delta_ms <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {delta.latency_delta_ms >= 0 ? `+${delta.latency_delta_ms}ms` : `${delta.latency_delta_ms}ms`}
              </span>
            </div>
          </div>

          {/* Pass Rate */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PASS RATE DELTA</span>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-extrabold font-mono ${delta.pass_rate_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {delta.pass_rate_delta >= 0 ? `+${delta.pass_rate_delta}%` : `${delta.pass_rate_delta}%`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Radar Overlay Card */}
      {comparisonData && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              COMPARATIVE QUALITY OVERLAY
            </h3>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <span className="flex items-center space-x-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span>Run A: {runA?.name}</span>
              </span>
              <span className="flex items-center space-x-1.5 text-indigo-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span>Run B: {runB?.name}</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="metric" stroke="#64748B" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" />
                <Radar name="Run A" dataKey="RunA" stroke="#475569" fill="#475569" fillOpacity={0.15} />
                <Radar name="Run B" dataKey="RunB" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
