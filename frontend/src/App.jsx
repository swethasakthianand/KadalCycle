import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { VendorDashboard } from './views/VendorDashboard';
import { CollectorDashboard } from './views/CollectorDashboard';
import { ProcessorDashboard } from './views/ProcessorDashboard';
import { ResidentDashboard } from './views/ResidentDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { Waves, ShieldCheck, Globe } from 'lucide-react';
import { useLanguage } from './locales';

export default function App() {
  const [currentRole, setCurrentRole] = useState('vendor');
  const [points, setPoints] = useState(320);
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-ocean-void text-slate-100 flex flex-col font-sans relative selection:bg-sky-500/30 selection:text-sky-300">
      
      {/* Ambient Bioluminescent Background Glows (Stitch Design Token) */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.05)_0%,transparent_50%)] z-0"></div>
      
      <Navbar 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole} 
        points={points}
      />

      <main className="flex-1 pb-16 relative z-10">
        {currentRole === 'vendor' && <VendorDashboard />}
        {currentRole === 'collector' && <CollectorDashboard />}
        {currentRole === 'processor' && <ProcessorDashboard />}
        {currentRole === 'resident' && <ResidentDashboard />}
        {currentRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Enterprise Maritime Footer */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md py-6 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Waves className="w-4 h-4 text-sky-400" />
            <span>
              <strong className="text-white font-extrabold">KadalCycle (கடல் சுழற்சி)</strong> — Coastal Fish & Marine Plastic Traceability Platform
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TN Maritime Board & Coastal Ecology Taskforce</span>
            </span>
            <span className="font-mono text-slate-400">v2.0 • ISO-14001 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
