import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Database, UploadCloud, Plus, FileText, CheckCircle2, Tag } from 'lucide-react';
import { api } from '../services/api';

export default function DatasetView() {
  const { datasets, activeProject } = useSelector((state) => state.eval);
  const [selectedDataset, setSelectedDataset] = useState(datasets[0] || null);
  const [testCases, setTestCases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newGroundTruth, setNewGroundTruth] = useState('');
  const [newContext, setNewContext] = useState('');

  useEffect(() => {
    if (selectedDataset) {
      loadTestCases(selectedDataset.id);
    }
  }, [selectedDataset]);

  const loadTestCases = async (datasetId) => {
    setIsLoading(true);
    try {
      const res = await api.getTestCases(datasetId);
      setTestCases(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!newPrompt || !selectedDataset) return;

    try {
      await api.addTestCase(selectedDataset.id, {
        input_prompt: newPrompt,
        ground_truth: newGroundTruth,
        context_documents: newContext ? [newContext] : []
      });
      setNewPrompt('');
      setNewGroundTruth('');
      setNewContext('');
      setShowAddModal(false);
      loadTestCases(selectedDataset.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDataset) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.uploadCSV(selectedDataset.id, formData);
      loadTestCases(selectedDataset.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            TEST SUITE MANAGEMENT
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>Golden Test Datasets</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Standardized evaluation test suites with prompts, context references, and ground truth baselines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-lg border border-slate-300 cursor-pointer flex items-center space-x-2 transition shadow-2xs">
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Case</span>
          </button>
        </div>
      </div>

      {/* Dataset Selection Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {datasets.map((ds) => (
          <button
            key={ds.id}
            onClick={() => setSelectedDataset(ds)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              selectedDataset?.id === ds.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {ds.name} ({ds.test_cases_count || testCases.length} items)
          </button>
        ))}
      </div>

      {/* Test Cases List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            GOLDEN TEST CASES ({testCases.length})
          </h3>
          <span className="text-xs text-slate-500">Benchmark Ground Truth</span>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs text-slate-400 font-mono">Loading dataset cases...</div>
        ) : (
          <div className="space-y-4">
            {testCases.map((tc, idx) => (
              <div key={tc.id || idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono text-indigo-600 font-semibold">
                  <span className="bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                    Test Case #{idx + 1}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Input Prompt / Query:</span>
                  <p className="text-xs text-slate-900 leading-relaxed font-semibold">{tc.input_prompt}</p>
                </div>

                {tc.ground_truth && (
                  <div className="space-y-1 bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Ground Truth Reference:</span>
                    <p className="text-xs text-emerald-950 leading-relaxed">{tc.ground_truth}</p>
                  </div>
                )}

                {tc.context_documents && tc.context_documents.length > 0 && (
                  <div className="space-y-1 bg-white border border-slate-200 rounded-lg p-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Context Chunks ({tc.context_documents.length}):</span>
                    <ul className="text-xs text-slate-700 space-y-1 font-mono text-[11px] list-disc list-inside">
                      {tc.context_documents.map((c, i) => (
                        <li key={i} className="truncate">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add Golden Test Case</h3>

            <form onSubmit={handleAddTestCase} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Input Prompt / Query</label>
                <textarea
                  rows={2}
                  required
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  placeholder="Enter the test query..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Ground Truth Reference</label>
                <textarea
                  rows={2}
                  value={newGroundTruth}
                  onChange={(e) => setNewGroundTruth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  placeholder="The ideal verified response..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Context Passage (Optional)</label>
                <textarea
                  rows={2}
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  placeholder="Source document chunk for RAG..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
