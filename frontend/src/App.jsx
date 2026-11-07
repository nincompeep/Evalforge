import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchInitialData, setActiveTab } from './store/evalSlice';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import DashboardView from './components/DashboardView';
import RunLauncherView from './components/RunLauncherView';
import ComparisonView from './components/ComparisonView';
import DatasetView from './components/DatasetView';
import InspectorView from './components/InspectorView';
import FooterSection from './components/FooterSection';
import { ArrowUpRight } from 'lucide-react';

export default function App() {
  const dispatch = useDispatch();
  const { activeTab, isLoading, isRunningEval } = useSelector((state) => state.eval);

  useEffect(() => {
    dispatch(fetchInitialData());
  }, [dispatch]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'runs':
        return <RunLauncherView />;
      case 'compare':
        return <ComparisonView />;
      case 'datasets':
        return <DatasetView />;
      case 'inspector':
        return <InspectorView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Sticky Top Navbar (QuickPDF Style) */}
      <Navbar />

      {/* Hero Section (QuickPDF Style) */}
      <HeroSection />

      {/* Main Workspace Section */}
      <main id="platform-workspace" className="max-w-6xl mx-auto px-6 w-full flex-1 pb-16">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-white border border-slate-200 rounded-2xl p-12 shadow-2xs">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs text-slate-500 font-mono">
              Loading benchmark test runs and datasets...
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </main>

      {/* Clean Minimal Floating Action Pill (QuickPDF Style) */}
      <div className="fixed bottom-6 right-8 z-40">
        <button
          onClick={() => {
            dispatch(setActiveTab('runs'));
            const el = document.getElementById('platform-workspace');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          disabled={isRunningEval}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <span>{isRunningEval ? 'Evaluating...' : 'Run new benchmark'}</span>
          <ArrowUpRight className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* Footer Section (QuickPDF Style) */}
      <FooterSection />
    </div>
  );
}
