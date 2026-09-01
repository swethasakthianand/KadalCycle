import React, { useState, useEffect, useRef } from 'react';
import {
  Anchor, Plus, Camera, Sparkles, QrCode, Coins, CheckCircle2,
  Clock, Shield, Fuel, Snowflake, RefreshCw, AlertCircle, ArrowUpRight,
  ChevronRight, Activity, Award, BarChart3, Layers, Filter, Upload,
  Zap, Volume2, Check, ArrowRight, UploadCloud, MapPin, Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../locales';
import { api } from '../services/api';
import { BatchQRCodeModal } from '../components/BatchQRCodeModal';
import LiveGeoCamera from '../components/LiveGeoCamera';

export const VendorDashboard = () => {
  const { t, lang } = useLanguage();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Live Web Camera State & References
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [geoData, setGeoData] = useState(null);

  // Live Geotag Camera State
  const [capturedBatch, setCapturedBatch] = useState(null);
  const handlePhotoCaptured = (data) => {
    // Receives { image, latitude, longitude, timestamp } from LiveGeoCamera
    setCapturedBatch(data);
    setImagePreview(data.image);
  };

  // Web Camera Controller Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      alert("Unable to access camera. Please check browser camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureAndClassify = () => {
    if (!videoRef.current) return;

    // 1. Draw frame to hidden canvas
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // 2. Export canvas to Base64 image
    const imageDataUrl = canvas.toDataURL("image/jpeg");
    
    // 3. Update states to display photo on dashboard screen
    setImagePreview(imageDataUrl);
    setCapturedBatch({ image: imageDataUrl });

    // 4. Capture current location metadata
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setGeoData({
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
          time: new Date().toLocaleTimeString(),
        });
      });
    }

    // 5. Trigger backend AI payload call
    runAiClassifier(imageDataUrl);
  };

  const runAiClassifier = async (base64Image) => {
    setIsClassifying(true);
    try {
      const response = await fetch("/api/v1/classify-waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data: base64Image }),
      });
      const data = await response.json();
      setAiResult(data);
    } catch (error) {
      setAiResult({
        detected_class: 'thermocol',
        class_label_ta: 'தெர்மாகோல் பெட்டி',
        class_label_en: 'Thermocol Ice Box',
        confidence: 0.95,
        suggested_route: 'EPS Compactor & Resins',
        recycling_facility_type: 'Coastal Valorization Hub',
        reward_credits_per_kg: 3,
        hazards_notes: 'Non-biodegradable marine hazard',
        classes_probabilities: { thermocol: 0.95, mixed_waste: 0.05 }
      });
    } finally {
      setIsClassifying(false);
    }
  };

  // Form State
  const [harbour, setHarbour] = useState('Kasimedu Fishing Harbour (காசிமேடு)');
  const [weight, setWeight] = useState(35);
  const [priority, setPriority] = useState('Normal');
  const [imagePreview, setImagePreview] = useState(null);
  const [aiResult, setAiResult] = useState({
    detected_class: 'fish_waste',
    class_label_ta: 'மீன் கழிவு (குடல் / தலைகள் / செதில்கள்)',
    class_label_en: 'Fish Waste & Guts (Viscera/Heads)',
    confidence: 0.96,
    suggested_route: 'Biogas Digester & Liquid Bio-Fertilizer Unit',
    recycling_facility_type: 'Coastal Bio-Energy Plant (Ennore)',
    reward_credits_per_kg: 3,
    hazards_notes: 'High odor potential. Priority dispatch recommended within 6 hours.',
    classes_probabilities: {
      fish_waste: 0.96,
      plastic: 0.02,
      thermocol: 0.01,
      fishing_nets: 0.005,
      shell_waste: 0.003,
      mixed_waste: 0.002
    }
  });
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [selectedPickupQR, setSelectedPickupQR] = useState(null);
  const [pointsBalance, setPointsBalance] = useState(320);
  const [redeemSuccess, setRedeemSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const harbours = [
    { name: 'Kasimedu Fishing Harbour (காசிமேடு)', lat: 13.1256, lng: 80.2974 },
    { name: 'Royapuram Coastal Market (ராயபுரம்)', lat: 13.1115, lng: 80.2942 },
    { name: 'Marina Beach Fish Landing (மரீனா)', lat: 13.0500, lng: 80.2824 },
    { name: 'Cuddalore Port Basin (கடலூர்)', lat: 11.7142, lng: 79.7712 },
    { name: 'Tuticorin Old Port (தூத்துக்குடி)', lat: 8.7642, lng: 78.1348 },
    { name: 'Rameswaram Jetty (ராமேஸ்வரம்)', lat: 9.2876, lng: 79.3129 }
  ];

  const wasteSamples = [
    { id: 'fish_waste', label: '🐟 Fish Guts & Heads', labelTa: 'மீன் கழிவு', weight: 45, confidence: 0.96, route: 'Biogas & Bio-Fertilizer' },
    { id: 'fishing_nets', label: '🕸️ Ghost Net Mono', labelTa: 'பழைய வலை', weight: 80, confidence: 0.94, route: 'High-Grade Polymer Pellets' },
    { id: 'thermocol', label: '📦 Thermocol Ice Box', labelTa: 'தெர்மாகோல் பெட்டி', weight: 15, confidence: 0.91, route: 'EPS Compactor & Resins' },
    { id: 'plastic', label: '🧴 Rigids & Marine PET', labelTa: 'பிளாஸ்டிக் பாட்டில்கள்', weight: 28, confidence: 0.93, route: 'Plastic Pyrolysis Oil' },
    { id: 'shell_waste', label: '🦀 Crab / Prawn Shells', labelTa: 'ஓடு கழிவு', weight: 30, confidence: 0.89, route: 'Chitosan Biochemical Lab' },
  ];

  useEffect(() => {
    loadPickups();
  }, []);

  const loadPickups = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getPickups({ role: 'vendor', user_id: 'usr_ven_01' });
      setPickups(data || []);
    } catch (err) {
      console.error('Failed to fetch pickups:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectSample = (sample) => {
    setAnalyzingAi(true);
    setTimeout(() => {
      setAiResult({
        detected_class: sample.id,
        class_label_ta: sample.labelTa,
        class_label_en: sample.label,
        confidence: sample.confidence,
        suggested_route: sample.route,
        recycling_facility_type: 'Coastal Valorization Hub',
        reward_credits_per_kg: sample.id === 'fishing_nets' ? 5 : 3,
        hazards_notes: sample.id === 'fish_waste' ? 'Rapid organic breakdown within 6 hrs' : 'Non-biodegradable marine hazard',
        classes_probabilities: {
          [sample.id]: sample.confidence,
          mixed_waste: 0.05,
          plastic: 0.03
        }
      });
      setAnalyzingAi(false);
    }, 500);
  };

  const handleCreatePickup = async (e) => {
    e.preventDefault();
    setCreating(true);

    const selectedHarbourObj = harbours.find(h => h.name === harbour) || harbours[0];
    const payload = {
      vendor_id: 'usr_ven_01',
      vendor_name: 'Murugan (முருகன்) • Kasimedu Boat #42',
      harbour_name: harbour,
      waste_type: aiResult?.detected_class || 'fish_waste',
      ai_classification_tag: aiResult?.class_label_en || 'Fish Waste',
      ai_confidence: aiResult?.confidence || 0.95,
      estimated_weight_kg: parseFloat(weight),
      destination_route: aiResult?.suggested_route || 'Biogas & Bio-Fertilizer',
      location_lat: capturedBatch?.latitude ? parseFloat(capturedBatch.latitude) : selectedHarbourObj.lat,
      location_lng: capturedBatch?.longitude ? parseFloat(capturedBatch.longitude) : selectedHarbourObj.lng,
      priority: priority,
      image_base64: capturedBatch?.image || imagePreview
    };

    const res = await api.createPickup(payload);
    setCreating(false);

    if (res && (res.success || res.pickup)) {
      const created = res.pickup || res;
      setPickups(prev => [created, ...prev]);
      setSelectedPickupQR(created);
      setSuccessToast(`Pickup Batch ${created.qr_code_hash || 'KC-2026'} Generated Successfully!`);
      setCapturedBatch(null);
      setImagePreview(null);
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      setTimeout(() => setSuccessToast(null), 6000);
    }
  };

  const handleRedeem = (cost, benefitName) => {
    if (pointsBalance >= cost) {
      setPointsBalance(prev => prev - cost);
      setRedeemSuccess(`Voucher for "${benefitName}" generated! Check your SMS.`);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
      setTimeout(() => setRedeemSuccess(null), 5000);
    } else {
      alert(lang === 'ta' ? 'போதுமான புள்ளிகள் இல்லை' : 'Insufficient reward points');
    }
  };

  const playTamilGuidance = () => {
    if ('speechSynthesis' in window) {
      const text = `வணக்கம் மீனவ நண்பரே! உங்கள் படகில் உள்ள மீன் கழிவு அல்லது பழைய வலைகளின் புகைப்படத்தை எடுக்கவும். AI தானாகவே வகைப்படுத்தி அதிக புள்ளிகளை வழங்கும். உடனே சேகரிப்பாளரை அழைக்க பொத்தானை அழுத்தவும்.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ta-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredPickups = pickups.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

 return (
  <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    
    {/* Hero Welcome Banner */}
    <div className="relative overflow-hidden rounded-3xl glass-panel-glow border border-sky-500/30 p-6 sm:p-8 bg-gradient-to-r from-sky-950/80 via-slate-900/90 to-emerald-950/80">
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <Anchor className="w-4 h-4" />
            <span>{t('role_vendor')} • Murugan Fishery (முருகன் படகு #42)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t('vendor_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {t('vendor_subtitle')}
          </p>
        </div>

        {/* Action Cluster: Tamil Voice Assist + Green Balance */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={playTamilGuidance}
            className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 font-bold text-xs transition touch-btn shadow-sm cursor-pointer"
            title="Tamil Audio Instructions"
          >
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>கேட்க (Audio Help)</span>
          </button>

          <div className="flex items-center space-x-3 px-5 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 shadow-amber-glow">
            <Coins className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
            <div>
              <div className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">{t('wallet_balance')}</div>
              <div className="text-xl font-mono font-black text-white">{pointsBalance} <span className="text-xs font-normal text-amber-300">{t('points')}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ========================================================= */}
    {/* LIVE WEBCAM & CAPTURED SNAPSHOT DISPLAY PANEL             */}
    {/* ========================================================= */}
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
        <Camera className="w-5 h-5 text-emerald-400" /> Live Geo-Verification & AI Inspection
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT: WEBCAM FEED */}
        <div className="flex flex-col items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            Live Camera Feed
          </span>

          <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
            />
            {!isCameraActive && (
              <p className="text-slate-500 text-sm">Click 'Open Camera' to view live video feed.</p>
            )}
          </div>

          <div className="flex gap-3 mt-4 w-full justify-center">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20"
              >
                Open Camera
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={captureAndClassify}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm transition flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Snap Photo & Inspect
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-xl text-sm font-semibold transition"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: DASHBOARD CAPTURED SNAPSHOT DISPLAY */}
        <div className="flex flex-col bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            Captured Waste Snapshot
          </span>

          {imagePreview ? (
            <div className="flex flex-col h-full">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-emerald-500/40 shadow-md">
                <img 
                  src={imagePreview} 
                  alt="Captured Waste" 
                  className="w-full h-full object-cover" 
                />
                {geoData && (
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> GPS: {geoData.lat}, {geoData.lng} | {geoData.time}
                  </div>
                )}
              </div>

              {aiResult && (
                <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Detection</span>
                    <div className="text-sm font-bold text-emerald-400">{aiResult.class_label_en || aiResult.detected_class}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                    {(aiResult.confidence * 100).toFixed(1)}% Match
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-6 text-slate-500 min-h-[180px]">
              <Camera className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">No Image Captured Yet</p>
              <p className="text-xs text-slate-600 mt-1 text-center">
                Click 'Open Camera' then 'Snap Photo' to trigger live inspection.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="glass-panel-emerald border border-emerald-500/50 p-4 rounded-2xl text-emerald-200 flex items-center justify-between shadow-emerald-glow animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)} 
            className="text-xs text-emerald-400 underline font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: AI Waste Scanner & Quick Dispatch Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: AI Marine Waste Classifier */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {t('ai_classifier_title')}
                  </h2>
                  <p className="text-xs text-slate-400">{t('ai_classifier_subtitle')}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>AI VISION LIVE</span>
              </span>
            </div>

            {/* Quick Sample Presets */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Sample Presets (மாதிரிகள்)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {wasteSamples.map(sample => {
                  const isSelected = aiResult?.detected_class === sample.id;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => selectSample(sample)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition touch-btn flex flex-col justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold shadow-cyan-glow' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate">{sample.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{sample.labelTa}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ========== LIVE CAMERA (always visible) ========== */}
            <div className="space-y-3">
              <LiveGeoCamera onCapture={handlePhotoCaptured} />

              {/* ========== CAPTURED PHOTO PREVIEW AREA (always reserved below camera) ========== */}
              <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-4 min-h-[220px]">
                {capturedBatch || imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-emerald-500/40">
                      <img 
                        src={capturedBatch?.image || imagePreview} 
                        alt="Captured Waste Photo" 
                        className="w-full h-48 object-cover" 
                      />
                      <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                        Photo Captured ✓
                      </div>
                      {capturedBatch?.latitude && (
                        <div className="absolute bottom-2 left-2 bg-black/70 text-emerald-300 text-[10px] font-mono px-2 py-1 rounded">
                          LAT {capturedBatch.latitude} • LNG {capturedBatch.longitude}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-emerald-400 font-medium">
                        Photo ready for AI classification & dispatch
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedBatch(null);
                          setImagePreview(null);
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        Retake Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                    <Camera className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs font-medium">No photo taken yet</p>
                    <p className="text-[10px] mt-1 text-slate-600">Use the live camera above to capture</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Classification Analysis Card */}
            {aiResult && (
              <div className="glass-panel-glow rounded-2xl p-4 sm:p-5 border border-sky-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {t('ai_confidence')}:
                    </span>
                  </div>
                  <span className="font-mono text-sm font-black text-emerald-400">
                    {Math.round((aiResult.confidence || 0.95) * 100)}% Match
                  </span>
                </div>

                {/* Confidence Bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((aiResult.confidence || 0.95) * 100)}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {t('detected_category')}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-sky-300 mt-0.5 truncate">
                      {lang === 'ta' ? aiResult.class_label_ta : aiResult.class_label_en}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {t('suggested_valorization')}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-300 mt-0.5 truncate">
                      {aiResult.suggested_route}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 bg-sky-950/30 p-2.5 rounded-xl border border-sky-800/30">
                  <span className="text-slate-400">Estimated Eco-Credits:</span>
                  <span className="font-mono font-black text-amber-300">
                    +{weight * (aiResult.reward_credits_per_kg || 3)} {t('points')} ({aiResult.reward_credits_per_kg || 3} pts/kg)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Quick Pickup Dispatch Request */}
          <form onSubmit={handleCreatePickup} className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-5">
            <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {t('quick_dispatch_title')}
                </h2>
                <p className="text-xs text-slate-400">{t('quick_dispatch_subtitle')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Harbour Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('select_harbour')}
                </label>
                <select
                  value={harbour}
                  onChange={(e) => setHarbour(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-sky-400 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 outline-none transition"
                >
                  {harbours.map(h => (
                    <option key={h.name} value={h.name} className="bg-slate-900 text-white">
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">{t('estimated_weight')}</span>
                  <span className="font-mono text-base font-black text-sky-400">
                    {weight} <span className="text-xs font-normal text-slate-400">kg</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-sky-400 bg-slate-900 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>5 kg</span>
                  <span>100 kg</span>
                  <span>250 kg</span>
                  <span>500 kg</span>
                </div>
              </div>

              {/* Priority Tagging */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Dispatch Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Normal', 'High (குறைந்த நேரம்)', 'Urgent (உடனே)'].map((p) => {
                    const isSelected = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition touch-btn text-center cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-glow' 
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Dispatch Button */}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition touch-btn cursor-pointer"
              >
                {creating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>{t('create_request_btn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Active Batches & Green Rewards Wallet (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 4: Green Rewards Wallet */}
          <div className="glass-panel-amber rounded-3xl p-6 sm:p-7 border border-amber-500/30 space-y-5">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {t('green_rewards')}
                  </h2>
                  <p className="text-xs text-amber-200/80">{t('redeem_benefits')}</p>
                </div>
              </div>
              <Coins className="w-5 h-5 text-amber-400" />
            </div>

            {redeemSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-200 text-xs font-bold">
                ✓ {redeemSuccess}
              </div>
            )}

            {/* Quick Redemption Options */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t('diesel_subsidy')}</div>
                    <div className="text-[11px] text-slate-400">₹200 Off for 10L diesel</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRedeem(100, 'Boat Diesel Subsidy ₹200')}
                  disabled={pointsBalance < 100}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition touch-btn cursor-pointer ${
                    pointsBalance >= 100 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  100 {t('points')}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                    <Snowflake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t('crushed_ice')}</div>
                    <div className="text-[11px] text-slate-400">50kg Crushed Ice Block</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRedeem(60, '50kg Ice Block Voucher')}
                  disabled={pointsBalance < 60}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition touch-btn cursor-pointer ${
                    pointsBalance >= 60 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  60 {t('points')}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t('net_repair')}</div>
                    <div className="text-[11px] text-slate-400">Nylon Twine repair coupon</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRedeem(150, 'Net Repair Coupon')}
                  disabled={pointsBalance < 150}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition touch-btn cursor-pointer ${
                    pointsBalance >= 150 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  150 {t('points')}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Active Batches & Traceability QR Badges */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {t('active_batches')}
                  </h2>
                  <p className="text-xs text-slate-400">{t('traceable_batches')}</p>
                </div>
              </div>
              <button 
                onClick={loadPickups}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1.5 p-1 rounded-xl bg-slate-950 border border-white/5 text-[11px] font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'requested', label: 'Requested' },
                { id: 'in_transit', label: 'In Transit' },
                { id: 'completed', label: 'Verified' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-sky-500/20 text-sky-300 font-extrabold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Batches List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredPickups.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No batches found for this view.
                </div>
              ) : (
                filteredPickups.map((p) => {
                  const isCompleted = p.status === 'completed';
                  const isInTransit = p.status === 'in_transit';

                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-sky-500/30 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-black text-sky-400">
                            {p.qr_code_hash || p.id}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isCompleted
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : isInTransit
                            ? 'bg-sky-950/80 text-sky-300 border-sky-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500">Waste Type</div>
                          <div className="font-bold text-slate-200 capitalize truncate">{p.waste_type?.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Weight</div>
                          <div className="font-mono font-bold text-slate-200">{p.estimated_weight_kg || p.actual_weight_kg || 25} kg</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {p.harbour_name || 'Kasimedu Harbour'}
                        </span>
                        <button
                          onClick={() => setSelectedPickupQR(p)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View QR</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* QR Code Modal for Selected Batch */}
      {selectedPickupQR && (
        <BatchQRCodeModal
          pickup={selectedPickupQR}
          onClose={() => setSelectedPickupQR(null)}
        />
      )}

    </div>
  );
};