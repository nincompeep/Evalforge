import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Zap, Moon, Sparkles } from 'lucide-react';
import { setActiveTab } from '../store/evalSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const { activeTab, isRunningEval } = useSelector((state) => state.eval);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'runs', label: 'Run Benchmark' },
    { id: 'compare', label: 'Regression' },
    { id: 'datasets', label: 'Golden Datasets' },
    { id: 'inspector', label: 'Record Inspector' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3.5'
          : 'bg-white/70 backdrop-blur-xs border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
        {/* Brand Logo (Matching QuickPDF style) */}
        <div
          onClick={() => {
            dispatch(setActiveTab('dashboard'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">
            EvalForge
          </span>
          <span className="font-light text-xl text-slate-500 tracking-tight">
            Platform
          </span>
        </div>

        {/* Center Links (QuickPDF style) */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-normal text-slate-600">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                dispatch(setActiveTab(link.id));
                const targetEl = document.getElementById('platform-workspace');
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`transition-colors py-1 hover:text-slate-900 ${
                activeTab === link.id
                  ? 'text-slate-900 font-semibold'
                  : ''
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right CTA Button (Matching '⚡ Get Pro' in QuickPDF) */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              dispatch(setActiveTab('runs'));
              const targetEl = document.getElementById('platform-workspace');
              if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
            }}
            disabled={isRunningEval}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-xs active:scale-95 disabled:opacity-60"
          >
            <Zap className="w-3.5 h-3.5 fill-white text-white" />
            <span>{isRunningEval ? "Evaluating..." : "Launch Test"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
