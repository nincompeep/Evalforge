import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Play, AlertCircle, Check } from 'lucide-react';
import { triggerEvaluationRun } from '../store/evalSlice';

export default function RunLauncherView() {
  const dispatch = useDispatch();
  const { experiments, datasets, isRunningEval, error } = useSelector((state) => state.eval);

  const activeExp = experiments[0] || null;
  const activeDs = datasets[0] || null;

  const [provider, setProvider] = useState('claude'); // 'claude', 'ollama', 'groq', 'mock'
  const [modelName, setModelName] = useState('claude-3-opus');
  const [promptTemplate, setPromptTemplate] = useState('Answer using strictly the verified context below. Do not extrapolate:\n\n{input}');
  const [temperature, setTemperature] = useState(0.1);
  const [runTitle, setRunTitle] = useState('');

  const handleLaunch = () => {
    if (!activeExp || !activeDs) return;

    const payload = {
      experiment_id: activeExp.id,
      dataset_id: activeDs.id,
      run_name: runTitle || `Run - ${modelName} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      provider: provider,
      model_name: modelName,
      prompt_template: promptTemplate,
      temperature: parseFloat(temperature),
    };

    dispatch(triggerEvaluationRun(payload));
  };

  const providersList = [
    {
      id: 'claude',
      name: 'Claude 3 Opus',
      identifier: 'anthropic/claude-3-opus',
      desc: 'Anthropic deep reasoning & high-precision context grounding',
      defaultModel: 'claude-3-opus',
    },
    {
      id: 'ollama',
      name: 'Local Ollama',
      identifier: 'ollama/qwen2.5:latest',
      desc: 'Local private inference for Qwen 2.5 / Qwen 3 models',
      defaultModel: 'qwen2.5:latest',
    },
    {
      id: 'groq',
      name: 'Groq Cloud',
      identifier: 'groq/llama-3.3-70b-versatile',
      desc: 'High-throughput low-latency inference on Llama 3.3',
      defaultModel: 'llama-3.3-70b-versatile',
    },
    {
      id: 'mock',
      name: 'Offline Simulator',
      identifier: 'evalforge/mock-eval-engine',
      desc: 'Instant mock generator for local testing without API keys',
      defaultModel: 'mock-eval-engine',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          BENCHMARK CONFIGURATION
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Play className="w-5 h-5 text-slate-900 fill-current" />
          <span>Launch Evaluation Benchmark</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Configure an automated evaluation workflow via LangGraph. Models will be evaluated against golden test cases for Faithfulness, Hallucination Risk, Relevance, and Latency.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Model Provider Cards (Clean, authentic developer tiles without artificial badges) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            1. Select Model Provider
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {providersList.map((item) => {
              const isSelected = provider === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setProvider(item.id);
                    setModelName(item.defaultModel);
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{item.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">{item.identifier}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Name and Run Label */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800">Model Identifier</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
              placeholder="e.g. claude-3-opus, qwen2.5:latest"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800">Custom Run Title (Optional)</label>
            <input
              type="text"
              value={runTitle}
              onChange={(e) => setRunTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              placeholder="e.g. Claude 3 Opus - Grounded Policy Test #1"
            />
          </div>
        </div>

        {/* Prompt Template */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-800">Prompt Template</label>
            <span className="text-[11px] text-slate-500 font-mono font-medium">Variable: {'{input}'}</span>
          </div>
          <textarea
            rows={3}
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-900 leading-relaxed"
          />
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-800">
            <span>Sampling Temperature: <span className="font-mono text-slate-900 font-bold">{temperature}</span></span>
            <span className="text-slate-400 text-[11px]">Lower values produce deterministic groundings</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="w-full accent-slate-900 cursor-pointer"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            onClick={handleLaunch}
            disabled={isRunningEval}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-lg font-semibold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-xs disabled:opacity-50"
          >
            {isRunningEval ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Executing LangGraph Batch Evaluation...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Benchmark Run</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
