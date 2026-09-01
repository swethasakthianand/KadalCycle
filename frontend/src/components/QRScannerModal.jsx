import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Camera, CheckCircle2, AlertCircle, X, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../locales';
import { supabase } from '../utils/supabaseClient';

export const QRScannerModal = ({ 
  isOpen = true, 
  onClose, 
  onScanSuccess, 
  scannedRole = "collector",
  title = null
}) => {
  const { t } = useLanguage();
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const scannerRef = useRef(null);

  // Demo Batch hashes for 1-click test simulation
  const demoBatches = [
    { code: 'KC-KAS-2026-001', label: 'Kasimedu Fish Waste (45kg)' },
    { code: 'KC-ROY-2026-002', label: 'Royapuram Ghost Net (80kg)' },
    { code: 'KC-KAS-2026-003', label: 'Kasimedu Thermocol EPS (15kg)' }
  ];

  useEffect(() => {
    if (!isOpen) return;

    let scanner = null;
    const scannerElementId = 'qr-reader-container';

    const timer = setTimeout(() => {
      const el = document.getElementById(scannerElementId);
      if (el) {
        try {
          scanner = new Html5QrcodeScanner(
            scannerElementId,
            { fps: 10, qrbox: { width: 220, height: 220 } },
            false
          );

          scanner.render(
            (decodedText) => {
              handleCodeFound(decodedText);
              if (scanner) {
                scanner.clear().catch(console.error);
              }
            },
            (errorMessage) => {
              // Ignore standard frame scan errors
            }
          );
          scannerRef.current = scanner;
        } catch (e) {
          console.warn('QR camera scanner initialization notice:', e);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isOpen]);

  const handleCodeFound = async (scannedValue) => {
    setErrorMsg('');
    setIsUpdating(true);

    try {
      let batchIdToUpdate = scannedValue;

      // If the scanned code is a JSON string from our badge QR, parse it
      try {
        const parsed = JSON.parse(scannedValue);
        if (parsed.batchId) {
          batchIdToUpdate = parsed.batchId;
        }
      } catch (e) {
        // Not JSON, treat as raw text hash string
      }

      // Update the status in Supabase pickups table
      const { data, error } = await supabase
        .from('pickups')
        .update({ status: 'Collected' })
        .eq('qr_code_hash', batchIdToUpdate)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        setErrorMsg(`Warning: Batch hash "${batchIdToUpdate}" not found in database. Status not updated.`);
      } else {
        console.log("Batch successfully updated to Collected in Supabase!");
      }

      setScanResult(batchIdToUpdate);
      if (onScanSuccess) {
        onScanSuccess(batchIdToUpdate);
      }
    } catch (err) {
      console.error("Error updating batch status:", err.message);
      setErrorMsg(`Database error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setErrorMsg('Please enter a valid Batch QR Code Hash');
      return;
    }
    handleCodeFound(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="glass-panel-glow border border-sky-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {title || (scannedRole === 'collector' ? t('scan_vendor_qr') : t('scan_intake_qr'))}
              </h3>
              <p className="text-xs text-slate-400">Point camera at QR badge or select a batch hash below</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Viewfinder Area */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 min-h-[220px] flex flex-col items-center justify-center p-2">
          <div id="qr-reader-container" className="w-full text-slate-200"></div>
          
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-2">
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Camera scanner active. Allow browser video permission if prompted.</span>
          </div>
          {isUpdating && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-sky-400 text-xs font-bold animate-pulse">
              Updating batch status to Collected in Supabase...
            </div>
          )}
        </div>

        {/* Success / Status Banner */}
        {scanResult && !errorMsg && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Successfully verified & marked <strong>{scanResult}</strong> as Collected!</span>
          </div>
        )}

        {/* 1-Click Simulation Batch Badges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Quick Test Batch Simulation (1-Click)
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Fast-Forward Demo</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {demoBatches.map(demo => (
              <button
                key={demo.code}
                type="button"
                onClick={() => handleCodeFound(demo.code)}
                disabled={isUpdating}
                className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-sky-950/40 border border-white/5 hover:border-sky-500/40 text-left transition flex items-center justify-between group touch-btn"
              >
                <div>
                  <div className="font-mono text-xs font-black text-sky-400 group-hover:text-sky-300">{demo.code}</div>
                  <div className="text-[10px] text-slate-400">{demo.label}</div>
                </div>
                <span className="text-xs font-bold text-sky-400 flex items-center space-x-1">
                  <span>Simulate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Hash Entry Form */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-white/10 space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Manual Batch Hash Entry
          </label>
          <div className="flex space-x-2">
            <input 
              type="text"
              placeholder="e.g. KC-KAS-2026-001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              disabled={isUpdating}
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none"
            />
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
            >
              Verify
            </button>
          </div>
          {errorMsg && (
            <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>
          )}
        </form>

      </div>
    </div>
  );
};