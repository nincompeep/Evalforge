import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, PlaySquare, GitCompare, Database, FileSearch, ArrowUpRight, ShieldCheck, Cpu } from 'lucide-react';
import { setActiveTab } from '../store/evalSlice';

export default function HeroSection() {
  const dispatch = useDispatch();
  const { activeTab, runs } = useSelector((state) => state.eval);

  const tabs = [
    { id: 'dashboard', label: 'Overview Hub', icon: LayoutDashboard },
    { id: 'runs', label: 'Run Benchmark', icon: PlaySquare },
    { id: 'compare', label: 'Model Regression', icon: GitCompare },
    { id: 'datasets', label: 'Golden Datasets', icon: Database },
    { id: 'inspector', label: 'Record Inspector', icon: FileSearch },
  ];

  const scrollToWorkspace = (tabId) => {
    dispatch(setActiveTab(tabId));
    const el = document.getElementById('platform-workspace');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="pt-32 pb-16 bg-white text-center">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {/* Main Headline (Directly matching QuickPDF "Powerful PDF Tools, Simple Conversations.") */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
          Powerful Evaluation Tools,<br />
          <span className="text-slate-400">Zero Hallucinations.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed font-normal">
          Everything you need to benchmark, evaluate, and audit your LLMs and RAG pipelines. No guesswork.
        </p>

        {/* Segmented Floating Pill Bar (Exact match to QuickPDF tab switcher) */}
        <div className="pt-4 flex justify-center">
          <div className="inline-flex items-center p-1.5 bg-white border border-slate-200 rounded-full shadow-xs gap-1 max-w-full overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToWorkspace(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual Split Feature Preview (Inspired by lower cards in QuickPDF) */}
        <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Card 1 */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Automated Faithfulness & Grounding
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Score model outputs against verified document context using RAGAS criteria. Instantly flag hallucinations and ungrounded assertions.
              </p>
            </div>
            <div className="pt-5 mt-2 border-t border-slate-200/60">
              <button
                onClick={() => scrollToWorkspace('dashboard')}
                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 flex items-center space-x-1 group"
              >
                <span>Explore reliability metrics</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                <Cpu className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Multi-Model A/B Regression
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Benchmark Claude 3 Opus, Qwen 2.5, and Llama 3 side-by-side against golden datasets to identify latency and quality regressions before deploying.
              </p>
            </div>
            <div className="pt-5 mt-2 border-t border-slate-200/60">
              <button
                onClick={() => scrollToWorkspace('compare')}
                className="text-xs font-semibold text-slate-900 hover:text-indigo-600 flex items-center space-x-1 group"
              >
                <span>Compare model benchmarks</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
