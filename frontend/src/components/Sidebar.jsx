import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, PlaySquare, GitCompare, Database, FileSearch, Sparkles } from 'lucide-react';
import { setActiveTab } from '../store/evalSlice';

export default function Sidebar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.eval.activeTab);

  const menuItems = [
    { id: 'dashboard', label: 'Evaluation Hub', icon: LayoutDashboard },
    { id: 'runs', label: 'Run Benchmark', icon: PlaySquare },
    { id: 'compare', label: 'Model Regression', icon: GitCompare },
    { id: 'datasets', label: 'Golden Datasets', icon: Database },
    { id: 'inspector', label: 'Record Inspector', icon: FileSearch },
  ];

  return (
    <aside className="w-64 border-r border-dark-700 bg-dark-900/60 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
          Platform Navigation
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch(setActiveTab(item.id))}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-dark-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-dark-800/80 border border-dark-700/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-brand-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Local Engine</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Ollama Qwen2.5/3 with ChromaDB RAG and RAGAS metric scorers.
        </p>
      </div>
    </aside>
  );
}
