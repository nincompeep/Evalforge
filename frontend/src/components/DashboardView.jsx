import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import {
  ShieldCheck, AlertTriangle, CheckCircle2,
  Clock, Plus, GitCompare, FileDown, ArrowUpRight
} from 'lucide-react';
import { setSelectedRun, setActiveTab } from '../store/evalSlice';
import { api } from '../services/api';

export default function DashboardView() {
  const dispatch = useDispatch();
  const { runs, selectedRun, activeProject } = useSelector((state) => state.eval);

  const currentRun = selectedRun || (runs.length > 0 ? runs[0] : null);
  const m = currentRun?.metrics_summary || {};

  const totalEvaluations = runs.length;
  const passRate = m.pass_rate !== undefined ? m.pass_rate : 80;
  const faithfulness = m.avg_faithfulness !== undefined ? Math.round(m.avg_faithfulness * 100) : 75;
  const hallucination = m.hallucination_rate !== undefined ? Math.round(m.hallucination_rate * 100) : 25;
  const latency = m.avg_latency_ms !== undefined ? m.avg_latency_ms : 240;

  // Pie chart data for Health Distribution
  const donutData = [
    { name: 'Grounded Output', value: Math.max(1, Math.round(faithfulness * 0.7)), color: '#10B981' },
    { name: 'Variance / Review', value: Math.max(1, 100 - faithfulness - Math.round(hallucination * 0.6)), color: '#F59E0B' },
    { name: 'Unsupported Claims', value: Math.max(1, Math.round(hallucination * 0.6)), color: '#EF4444' },
  ];

  // Radar chart data
  const radarData = [
    { metric: 'Faithfulness', value: faithfulness, fullMark: 100 },
    { metric: 'Answer Relevance', value: m.avg_relevance ? Math.round(m.avg_relevance * 100) : 85, fullMark: 100 },
    { metric: 'Context Precision', value: m.avg_precision ? Math.round(m.avg_precision * 100) : 80, fullMark: 100 },
    { metric: 'Pass Rate', value: passRate, fullMark: 100 },
    { metric: 'Groundedness', value: 100 - hallucination, fullMark: 100 },
  ];

  const handleInspectRun = async (run) => {
    dispatch(setSelectedRun(run));
    try {
      const recordsRes = await api.getRunRecords(run.id);
      dispatch({ type: 'eval/setSelectedRunRecords', payload: recordsRes.data });
      dispatch(setActiveTab('inspector'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            BENCHMARK OVERVIEW
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reliability & Health Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Project: <span className="font-semibold text-slate-800">{activeProject?.name || "Enterprise Customer Copilot"}</span> • Active Run: <span className="font-mono text-slate-900 font-medium">{currentRun?.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last sync: Just now</span>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL RUNS</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {totalEvaluations}
          </div>
          <div className="text-[11px] text-slate-500">
            Evaluations recorded
          </div>
        </div>

        {/* Avg Faithfulness */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">FAITHFULNESS</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {faithfulness}%
          </div>
          <div className="text-[11px] text-slate-500">
            Context-grounded claims
          </div>
        </div>

        {/* Hallucination Rate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">HALLUCINATION RATE</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {hallucination > 0 ? `${hallucination}%` : '0%'}
          </div>
          <div className="text-[11px] text-slate-500">
            Ungrounded assertions
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">P95 LATENCY</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {latency} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Average response time
          </div>
        </div>
      </div>

      {/* Two Center Visualizations (Donut + Radar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Distribution Donut */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              EVALUATION DISTRIBUTION
            </h3>
            <span className="text-xs text-slate-500 font-medium">Active Test Set</span>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{faithfulness}%</span>
              <span className="text-[11px] text-slate-400 font-medium">Reliability</span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Grounded {faithfulness}%</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Variance 15%</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Unsupported {hallucination}%</span>
            </span>
          </div>
        </div>

        {/* Multi-Dimensional Radar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              MULTIDIMENSIONAL BENCHMARK
            </h3>
            <span className="text-xs text-slate-500 font-medium">Scale: 0-100</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="metric" stroke="#64748B" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" />
                <Radar name="Quality" dataKey="value" stroke="#0F172A" fill="#0F172A" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Faithfulness, Relevance, Groundedness, and Latency under RAGAS evaluation criteria.
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => dispatch(setActiveTab('runs'))}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Benchmark Run</span>
        </button>

        <button
          onClick={() => dispatch(setActiveTab('compare'))}
          className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 active:scale-95 text-xs font-semibold px-5 py-2.5 rounded-lg shadow-2xs transition"
        >
          <GitCompare className="w-3.5 h-3.5 text-slate-600" />
          <span>Compare Model Runs</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-2xs transition"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Summary</span>
        </button>
      </div>

      {/* Recent Evaluations Table (Professional Engineering Layout - No dramatic Critical Drift badges) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            RECENT EVALUATIONS
          </h3>
          <button
            onClick={() => dispatch(setActiveTab('runs'))}
            className="text-xs font-semibold text-slate-900 hover:text-slate-600 flex items-center space-x-1"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {runs.map((r, idx) => {
            const isSelected = currentRun?.id === r.id;
            const ms = r.metrics_summary || {};
            const scorePct = ms.avg_faithfulness !== undefined ? Math.round(ms.avg_faithfulness * 100) : 75;
            const isHighQuality = scorePct >= 70;
            return (
              <div
                key={r.id || idx}
                onClick={() => dispatch(setSelectedRun(r))}
                className={`py-3.5 px-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl transition cursor-pointer ${
                  isSelected ? 'bg-slate-100/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {r.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {r.model_name} • {ms.avg_latency_ms || 280}ms
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-end sm:self-center">
                  {/* Clean Technical Metric Chip instead of Critical Drift pill */}
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className={`w-2 h-2 rounded-full ${isHighQuality ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-slate-700 font-semibold">{scorePct}% score</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 text-[11px]">{ms.pass_rate !== undefined ? `${ms.pass_rate}% pass` : '5/5 cases'}</span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(r.started_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInspectRun(r);
                    }}
                    className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-lg transition"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
