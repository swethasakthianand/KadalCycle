import React, { useState, useEffect } from 'react';
import { 
  Factory, QrCode, Award, CheckCircle2, Scale, 
  Sparkles, FileText, ArrowRight, ShieldCheck, RefreshCw,
  Zap, Droplets, Check, Download, ShieldAlert, Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../locales';
import { api } from '../services/api';
import { QRScannerModal } from '../components/QRScannerModal';

export const ProcessorDashboard = () => {
  const { t, lang } = useLanguage();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  // Verification Form State
  const [actualWeight, setActualWeight] = useState(44.5);
  const [destination, setDestination] = useState('Biogas Digester & Liquid Bio-Fertilizer Unit');
  const [purityRating, setPurityRating] = useState(96);
  const [moistureLevel, setMoistureLevel] = useState(14);
  const [processedCert, setProcessedCert] = useState(null);

  const destinationOptions = [
    { label: t('destination_biogas'), value: 'Biogas Digester & Liquid Bio-Fertilizer Unit', desc: 'Methane capture & nutrient-rich soil tonic' },
    { label: t('destination_compost'), value: 'Organic Coastal Composting', desc: 'Aerobic marine organic compost' },
    { label: t('destination_fishmeal'), value: 'Fish-Meal Protein Feed', desc: 'High-protein aquaculture feed pellets' },
    { label: t('destination_chitin'), value: 'Chitin & Chitosan Biochemical Extraction', desc: 'Biomedical & industrial biopolymers' },
    { label: t('destination_pyrolysis'), value: 'Marine Plastic Pyrolysis & Polymer Pellets', desc: 'High-density fuel oil from recovered plastics' }
  ];

  useEffect(() => {
    loadPickups();
  }, []);

  const loadPickups = async () => {
    setLoading(true);
    try {
      const data = await api.getPickups({ role: 'processor', user_id: 'usr_pro_01' });
      setPickups(data || []);
    } catch (e) {
      console.error('Failed to fetch processor batches', e);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanned = (code) => {
    const found = pickups.find(p => p.qr_code_hash === code || p.id === code);
    setScannerOpen(false);
    if (found) {
      setSelectedBatch(found);
      setActualWeight(found.estimated_weight_kg || 45);
    } else {
      setSelectedBatch({
        id: 'pk_scanned_01',
        qr_code_hash: code,
        harbour_name: 'Kasimedu Fishing Harbour',
        waste_type: 'fish_waste',
        estimated_weight_kg: 45.0
      });
      setActualWeight(44.5);
    }
  };

  const handleCompleteIntake = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    const res = await api.verifyQR({
      qr_code_hash: selectedBatch.qr_code_hash,
      scanned_by_role: 'processor',
      user_id: 'usr_pro_01',
      actual_weight_kg: parseFloat(actualWeight),
      waste_destination: destination,
      facility_name: 'Coastal Bio-Energy Plant (Ennore Hub)',
      purity_rating: parseFloat(purityRating)
    });

    if (res.success) {
      setProcessedCert({
        batchId: selectedBatch.qr_code_hash,
        weight: actualWeight,
        destination: destination,
        purity: purityRating,
        moisture: moistureLevel,
        credits: res.credits_awarded || Math.round(actualWeight * 3),
        facility: 'Coastal Bio-Energy Plant (Ennore Hub)',
        signature: `SHA256:${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
        timestamp: new Date().toLocaleString()
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSelectedBatch(null);
      loadPickups();
    }
  };

  const inTransitBatches = pickups.filter(p => p.status === 'in_transit');
  const completedBatches = pickups.filter(p => p.status === 'completed');

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-amber border border-amber-500/30 p-6 sm:p-8 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-teal-950/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
              <Factory className="w-4 h-4" />
              <span>{t('role_processor')} • Coastal Bio-Energy Plant (கடலோர உயிரி ஆலை)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('processor_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {t('processor_subtitle')}
            </p>
          </div>

          <button
            onClick={() => setScannerOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center space-x-2 transition touch-btn shrink-0"
          >
            <QrCode className="w-5 h-5 text-slate-950" />
            <span>{t('scan_collector_qr')}</span>
          </button>
        </div>
      </div>

      {/* Facility Throughput KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Throughput This Week</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-white">24.5 <span className="text-xs font-normal text-slate-400">Tons</span></div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Net CO2 Offset</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">12.8 <span className="text-xs font-normal text-slate-400">MT</span></div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-sky-500/15 text-sky-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Bio-Feed / Pyrolysis Produced</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-sky-400">5.2 <span className="text-xs font-normal text-slate-400">Tons</span></div>
          </div>
        </div>
      </div>

      {/* Certificate Issued Modal / Banner */}
      {processedCert && (
        <div className="glass-panel-emerald rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-emerald-glow space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Digital Certificate of Responsible Valorization Issued
                </h3>
                <p className="text-xs text-emerald-300">
                  Batch provenance permanently committed to the KadalCycle audit ledger.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800">
              BLOCKCHAIN VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Batch Cryptographic ID</div>
              <div className="font-mono font-black text-sky-400 mt-0.5">{processedCert.batchId}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Certified Intake Weight</div>
              <div className="font-mono font-black text-white mt-0.5">{processedCert.weight} kg</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Purity Grade</div>
              <div className="font-mono font-black text-emerald-400 mt-0.5">{processedCert.purity}% Grade-A</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Vendor Eco-Credits Released</div>
              <div className="font-mono font-black text-amber-400 mt-0.5">+{processedCert.credits} Points</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-emerald-500/20 pt-3">
            <span className="font-mono truncate max-w-sm">Signature: {processedCert.signature}</span>
            <button 
              onClick={() => setProcessedCert(null)}
              className="px-4 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40 transition"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Verification & Intake Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCompleteIntake} className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Digital Scale & Quality Grading
                  </h2>
                  <p className="text-xs text-slate-400">Step 2: Calibrate intake payload & route to processing line</p>
                </div>
              </div>
              {selectedBatch && (
                <span className="font-mono text-xs font-black text-amber-400 px-3 py-1 rounded-full bg-amber-950 border border-amber-800">
                  {selectedBatch.qr_code_hash || selectedBatch.id}
                </span>
              )}
            </div>

            {!selectedBatch ? (
              <div className="p-6 rounded-2xl bg-slate-950/50 border border-dashed border-amber-500/30 text-center space-y-3">
                <p className="text-xs sm:text-sm text-slate-300">
                  No active delivery selected. Scan a collector delivery QR or choose from the queue on the right.
                </p>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition touch-btn inline-flex items-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan Incoming QR</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Weight Verification Dual Scale */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Harbour Dispatched Weight</div>
                    <div className="font-mono text-lg font-bold text-slate-300 mt-1">
                      {selectedBatch.estimated_weight_kg || 45.0} kg
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-300 uppercase font-bold block">
                      Actual Verified Scale Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={actualWeight}
                      onChange={(e) => setActualWeight(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/40 focus:border-amber-400 font-mono text-lg font-black text-amber-300 rounded-xl px-3 py-1.5 mt-1 outline-none"
                    />
                  </div>
                </div>

                {/* Purity & Moisture Sliders */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">Organic Purity / Polymer Cleanliness:</span>
                      <span className="font-mono text-emerald-400 font-black">{purityRating}%</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="100"
                      value={purityRating}
                      onChange={(e) => setPurityRating(e.target.value)}
                      className="w-full accent-emerald-400 bg-slate-900 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">Moisture Content:</span>
                      <span className="font-mono text-sky-400 font-black">{moistureLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={moistureLevel}
                      onChange={(e) => setMoistureLevel(e.target.value)}
                      className="w-full accent-sky-400 bg-slate-900 h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Circular Valorization Route Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    {t('valorization_destination')}
                  </label>
                  <div className="space-y-2">
                    {destinationOptions.map(opt => {
                      const isSelected = destination === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDestination(opt.value)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs transition touch-btn flex items-center justify-between ${
                            isSelected 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-amber-glow' 
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{opt.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition touch-btn"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{t('verify_complete_btn')}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right: Deliveries Queue & Completed Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {t('pending_deliveries')}
                  </h2>
                  <p className="text-xs text-slate-400">Batches delivered by collector fleet</p>
                </div>
              </div>
              <button onClick={loadPickups} className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {inTransitBatches.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No batches awaiting intake inspection.
                </div>
              ) : (
                inTransitBatches.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedBatch(p);
                      setActualWeight(p.estimated_weight_kg || 45);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                      selectedBatch?.id === p.id 
                        ? 'bg-amber-500/20 border-amber-400 shadow-amber-glow' 
                        : 'bg-slate-950/70 border-white/5 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-amber-400">{p.qr_code_hash || p.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                        In Transit
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{p.waste_type?.replace('_', ' ')}</span>
                      <span className="font-mono font-bold text-white">{p.estimated_weight_kg || 45} kg</span>
                    </div>

                    <div className="text-[11px] text-slate-500 border-t border-white/5 pt-1.5 flex items-center justify-between">
                      <span>{p.harbour_name || 'Kasimedu Harbour'}</span>
                      <span className="text-amber-400 font-bold">Inspect & Verify →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <QRScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleQRScanned}
          title="Step 2: Scan Incoming Delivery QR"
        />
      )}

    </div>
  );
};
