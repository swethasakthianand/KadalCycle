import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { 
  Truck, QrCode, Navigation, CheckCircle2, Clock, 
  MapPin, Check, RefreshCw, AlertCircle, Compass, 
  Fuel, ShieldCheck, ArrowRight, Activity, Zap, X, Factory
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../locales';
import { api } from '../services/api';
import { QRScannerModal } from '../components/QRScannerModal';
import { MapView } from '../components/MapView';

// Inline Modal to display the Collector's Transit QR Code for the Processor Facility
const CollectorQRModal = ({ pickup, onClose }) => {
  if (!pickup) return null;

  // Encoded JSON payload containing chain-of-custody data for the Processor Facility scanner
  const processorPayload = JSON.stringify({
    batch_id: pickup.id,
    transit_hash: pickup.transit_qr_hash || `TRANSIT-${pickup.id}`,
    collector: 'Kannan Logistics (கண்ணன் எகோ)',
    harbour: pickup.harbour_name || 'Kasimedu Harbour',
    waste_type: pickup.waste_type,
    weight_kg: pickup.estimated_weight_kg || 25,
    status: 'in_transit',
    timestamp: new Date().toISOString()
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 space-y-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Collector Transit Pass</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Display */}
        <div className="flex flex-col items-center justify-center bg-white p-5 rounded-2xl border border-emerald-500/20 shadow-inner">
          <QRCode value={processorPayload} size={180} />
          <div className="font-mono text-[11px] text-slate-800 font-bold mt-3">
            {pickup.transit_qr_hash || `TRANSIT-${pickup.id}`}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-emerald-400">
            <Factory className="w-4 h-4" />
            <span>Ready for Processor Delivery</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Present this QR code to the Processor Facility operator at gate drop-off to complete chain of custody and release payouts.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
        >
          Close Pass
        </button>
      </div>
    </div>
  );
};

export const CollectorDashboard = () => {
  const { t } = useLanguage();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' or 'list'
  const [selectedCollectorQR, setSelectedCollectorQR] = useState(null);

  useEffect(() => {
    loadPickups();
  }, []);

  const loadPickups = async () => {
    setLoading(true);
    try {
      const data = await api.getPickups({ 
        role: 'collector', 
        user_id: 'usr_col_01', 
        collector_lat: 13.1256, 
        collector_lng: 80.2974 
      });
      setPickups(data || []);
    } catch (e) {
      console.error('Failed to load collector pickups', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (pickup) => {
    const res = await api.assignCollector(pickup.id, 'usr_col_01');
    if (res.success) {
      const transitHash = `TRANSIT-${pickup.qr_code_hash || pickup.id}-${Date.now().toString().slice(-4)}`;
      
      const updatedPickup = {
        ...pickup,
        status: 'in_transit',
        collector_id: 'usr_col_01',
        transit_qr_hash: transitHash
      };

      // Optimistic update so UI reflects transit state right away
      setPickups(prev => prev.map(p => p.id === pickup.id ? updatedPickup : p));

      setActionNotice('✓ Job accepted! Collector QR Pass generated for facility delivery.');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      
      // Automatically display the generated QR code for the collector
      setSelectedCollectorQR(updatedPickup);
      
      loadPickups();
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handleQRVerified = async (scannedCode) => {
    const res = await api.verifyQR({
      qr_code_hash: scannedCode,
      scanned_by_role: 'collector',
      user_id: 'usr_col_01'
    });
    setScannerOpen(false);
    if (res.success) {
      setActionNotice(res.message_en || `✓ Batch ${scannedCode} verified and marked IN-TRANSIT!`);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      loadPickups();
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const requestedPickups = pickups.filter(p => p.status === 'requested');
  const assignedPickups = pickups.filter(p => p.status === 'assigned');
  const inTransitPickups = pickups.filter(p => p.status === 'in_transit');
  const completedPickups = pickups.filter(p => p.status === 'completed');

  const totalInTransitKg = inTransitPickups.reduce((acc, p) => acc + (p.estimated_weight_kg || 25), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-emerald border border-emerald-500/30 p-6 sm:p-8 bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
              <Truck className="w-4 h-4" />
              <span>{t('role_collector')} • Kannan Logistics (கண்ணன் எகோ)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('collector_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {t('collector_subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setScannerOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition touch-btn shrink-0"
            >
              <QrCode className="w-5 h-5 text-slate-950" />
              <span>{t('scan_vendor_qr')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="glass-panel-emerald border border-emerald-500/50 p-4 rounded-2xl text-emerald-200 flex items-center justify-between shadow-emerald-glow animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{actionNotice}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)} 
            className="text-xs text-emerald-400 underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Column Logistics Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Nearby Open Requests Radar & Active Dispatch List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {t('nearby_requests')}
                  </h2>
                  <p className="text-xs text-slate-400">Sorted by GPS Proximity to your vehicle</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono bg-sky-950 text-sky-300 px-3 py-1 rounded-full border border-sky-800 font-bold">
                  {requestedPickups.length} Open
                </span>
                <button 
                  onClick={loadPickups}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Interactive Proximity Radar Map / List */}
            <div className="space-y-3">
              {requestedPickups.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-white/5">
                  No pending pickup requests in this coastal sector.
                </div>
              ) : (
                requestedPickups.map((p, idx) => {
                  const distanceKm = (1.2 + idx * 1.8).toFixed(1);

                  return (
                    <div 
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-emerald-500/30 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span className="font-mono text-xs font-black text-sky-400">{p.qr_code_hash || p.id}</span>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800 font-bold">
                          📍 {distanceKm} km away
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500">Location</div>
                          <div className="font-bold text-slate-200 truncate">{p.harbour_name || 'Kasimedu Harbour'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Waste Category</div>
                          <div className="font-bold text-emerald-300 capitalize truncate">{p.waste_type?.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Est. Weight</div>
                          <div className="font-mono font-bold text-amber-300">{p.estimated_weight_kg || 45} kg</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[11px] text-slate-400">
                          Route: <strong className="text-slate-300">{p.destination_route || 'Coastal Bio-Energy Plant'}</strong>
                        </span>
                        <button
                          onClick={() => handleAcceptJob(p)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition touch-btn flex items-center space-x-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{t('accept_pickup')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Route Optimization & Vehicle Load Summary Card */}
          <div className="glass-panel-glow rounded-3xl p-6 border border-sky-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
              <div className="flex items-center space-x-2 text-sky-400">
                <Navigation className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Logistics & Route Efficiency
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">12.5 km/L avg</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Consolidated Haul</div>
                <div className="text-xl font-mono font-black text-sky-300 mt-1">{totalInTransitKg} <span className="text-xs font-normal text-slate-400">kg</span></div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase font-bold">In-Transit Batches</div>
                <div className="text-xl font-mono font-black text-emerald-300 mt-1">{inTransitPickups.length}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Target Hub</div>
                <div className="text-xs font-bold text-amber-300 mt-2 truncate">Ennore Bio-Plant</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right: In-Transit Batches & QR Scanner Trigger (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Step 1 QR Scanner Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-5 text-center">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-emerald-glow">
              <QrCode className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Step 1: In-Field QR Scanner
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Scan the fisherman's Batch QR badge when loading waste to initiate chain of custody.
              </p>
            </div>

            <button
              onClick={() => setScannerOpen(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition touch-btn"
            >
              <QrCode className="w-5 h-5" />
              <span>Launch Field Scanner</span>
            </button>
          </div>

          {/* In-Transit Batches List */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    In-Transit Loads
                  </h2>
                  <p className="text-xs text-slate-400">Batches currently on your collection vehicle</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">{inTransitPickups.length}</span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {inTransitPickups.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No loads currently in transit. Accept and scan open batches.
                </div>
              ) : (
                inTransitPickups.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-emerald-400">{p.qr_code_hash || p.id}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        In Transit
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 capitalize">{p.waste_type?.replace('_', ' ')}</span>
                      <span className="font-mono font-bold text-white">{p.estimated_weight_kg || 25} kg</span>
                    </div>

                    <div className="text-[11px] text-slate-500 border-t border-white/5 pt-2 flex items-center justify-between">
                      <span className="truncate max-w-[130px]">{p.harbour_name || 'Kasimedu Harbour'}</span>
                      <button 
                        onClick={() => setSelectedCollectorQR(p)}
                        className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-800 transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Show QR Pass</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* QR Scanner Modal for scanning vendor badge */}
      {scannerOpen && (
        <QRScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleQRVerified}
          title="Step 1: Verify Pickup Batch"
        />
      )}

      {/* Collector QR Code Modal for Processor Facility Verification */}
      {selectedCollectorQR && (
        <CollectorQRModal
          pickup={selectedCollectorQR}
          onClose={() => setSelectedCollectorQR(null)}
        />
      )}

    </div>
  );
};