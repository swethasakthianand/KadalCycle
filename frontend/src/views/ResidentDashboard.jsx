import React, { useState, useEffect } from 'react';
import { 
  MapPin, Camera, AlertTriangle, Send, CheckCircle2, 
  ShieldAlert, RefreshCw, Eye, Sparkles, Upload, 
  LifeBuoy, Award, Shield, AlertOctagon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../locales';
import { api } from '../services/api';
import { MapView } from '../components/MapView';

export const ResidentDashboard = () => {
  const { t, lang } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [beachName, setBeachName] = useState('Marina Beach Promenade (மரீனா)');
  const [selectedLocation, setSelectedLocation] = useState({ lat: 13.0500, lng: 80.2824 });
  const [wasteCategory, setWasteCategory] = useState('ghost_nets');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('high');
  const [imagePreview, setImagePreview] = useState(null);

  const beaches = [
    { name: 'Marina Beach Promenade (மரீனா)', lat: 13.0500, lng: 80.2824 },
    { name: "Besant Nagar / Elliot's Beach (பெசன்ட் நகர்)", lat: 13.0001, lng: 80.2668 },
    { name: 'Kovalam Surf Bay (கோவளம்)', lat: 12.7892, lng: 80.2528 },
    { name: 'Silver Beach Cuddalore (சில்வர் பீச்)', lat: 11.7050, lng: 79.7750 },
    { name: 'Kasimedu Coastal Wharf (காசிமேடு)', lat: 13.1256, lng: 80.2974 }
  ];

  const severityLevels = [
    { id: 'low', label: 'Low (குறைவு)', color: 'text-slate-300 border-slate-700 bg-slate-900/60' },
    { id: 'medium', label: 'Moderate (நடுத்தரம்)', color: 'text-sky-300 border-sky-500/40 bg-sky-950/40' },
    { id: 'high', label: 'High (அதிகம்)', color: 'text-amber-300 border-amber-500/40 bg-amber-950/40' },
    { id: 'critical', label: 'Critical Hazard (ஆபத்து - விலங்குகள் சிக்கல்)', color: 'text-rose-300 border-rose-500/50 bg-rose-950/50' }
  ];

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaints();
      setComplaints(data || []);
    } catch (e) {
      console.error('Failed to load complaints', e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectMapLocation = (latlng) => {
    setSelectedLocation(latlng);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      resident_name: 'Anitha Citizen (அனிதா)',
      resident_phone: '9840456789',
      beach_name: beachName,
      location_lat: selectedLocation.lat,
      location_lng: selectedLocation.lng,
      waste_category: wasteCategory,
      description: description || 'Abandoned ghost nets and ocean plastic debris near high-tide line.',
      severity: severity,
      image_base64: imagePreview
    };

    const res = await api.reportComplaint(payload);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('✓ Report lodged successfully! Municipal Marine Cleanup Patrol dispatched. +150 Eco-Bounty credits awarded!');
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
      setDescription('');
      setImagePreview(null);
      loadComplaints();
      setTimeout(() => setSuccessMsg(null), 6000);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-rose border border-rose-500/30 p-6 sm:p-8 bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-teal-950/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
              <ShieldAlert className="w-4 h-4" />
              <span>{t('role_resident')} • Coastal Beach Watch & Citizen Eco-Patrol</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('resident_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {t('resident_subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-3 px-5 py-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 shadow-rose-500/20">
            <Award className="w-6 h-6 text-rose-400" />
            <div>
              <div className="text-[10px] text-rose-300 uppercase font-bold tracking-wider">Citizen Eco-Bounty</div>
              <div className="text-xl font-mono font-black text-white">+150 <span className="text-xs font-normal text-rose-300">pts / report</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="glass-panel-emerald border border-emerald-500/50 p-4 rounded-2xl text-emerald-200 flex items-center justify-between shadow-emerald-glow animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{successMsg}</span>
          </div>
          <button 
            onClick={() => setSuccessMsg(null)} 
            className="text-xs text-emerald-400 underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Interactive Map & Report Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Map Pin-Drop Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {t('pin_on_map')}
                  </h2>
                  <p className="text-xs text-slate-400">Click anywhere on the coastal line to drop incident marker</p>
                </div>
              </div>
              <span className="font-mono text-xs text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-full border border-sky-800">
                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </span>
            </div>

            <MapView
              height="340px"
              selectable={true}
              selectedPin={selectedLocation}
              onSelectLocation={handleSelectMapLocation}
              complaints={complaints}
              center={[selectedLocation.lat, selectedLocation.lng]}
              zoom={12}
            />
          </div>

          {/* Rapid Incident Report Form */}
          <form onSubmit={handleSubmitComplaint} className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-5">
            <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {t('report_dumping_form')}
                </h2>
                <p className="text-xs text-slate-400">Directly alerts Municipal Marine Cleanup Vessels</p>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Beach Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('select_harbour')} / Beach Promenade
                </label>
                <select
                  value={beachName}
                  onChange={(e) => {
                    setBeachName(e.target.value);
                    const found = beaches.find(b => b.name === e.target.value);
                    if (found) setSelectedLocation({ lat: found.lat, lng: found.lng });
                  }}
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-400 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 outline-none"
                >
                  {beaches.map(b => (
                    <option key={b.name} value={b.name} className="bg-slate-900 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Waste Category & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Debris Classification
                  </label>
                  <select
                    value={wasteCategory}
                    onChange={(e) => setWasteCategory(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-400 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none"
                  >
                    <option value="ghost_nets">🕸️ Abandoned Ghost Net (வலை)</option>
                    <option value="thermocol_and_plastic">📦 Thermocol & Marine Plastics</option>
                    <option value="illegal_fish_dumping">🐟 Untreated Fish Gut Dumping</option>
                    <option value="chemical_oil_slick">🛢️ Fuel / Oil Slick Debris</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Hazard Severity Tag
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-400 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none"
                  >
                    <option value="low">Low Priority (குறைவு)</option>
                    <option value="medium">Moderate Hazard (நடுத்தரம்)</option>
                    <option value="high">High Hazard (அதிகம்)</option>
                    <option value="critical">Critical Hazard (விலங்குகள் ஆபத்து)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t('description_placeholder')}
                </label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Large ghost fishing net washed up near low-tide line, risk to sea turtles..."
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-rose-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 outline-none resize-none"
                ></textarea>
              </div>

              {/* Photo Upload */}
              <div className="relative border border-dashed border-rose-500/30 rounded-2xl p-4 text-center bg-slate-950/40">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {imagePreview ? (
                  <div className="relative max-h-36 mx-auto overflow-hidden rounded-xl">
                    <img src={imagePreview} alt="Incident" className="w-full h-32 object-cover rounded-xl" />
                    <span className="text-[11px] text-rose-300 font-bold mt-1 block">Click to change evidence photo</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs py-2">
                    <Camera className="w-4 h-4 text-rose-400" />
                    <span>Upload Photographic Evidence (JPG, PNG)</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 transition touch-btn"
              >
                {submitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>{t('submit_report')}</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Right: Public Incident Feed & Community Impact (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Community Impact Metric */}
          <div className="glass-panel-glow rounded-3xl p-6 border border-sky-500/30 space-y-3 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Citizen Ocean Cleanup Impact
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-sky-300">
              4,250 <span className="text-base font-normal text-slate-400">kg cleared</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Across Chennai, Cuddalore, and Tuticorin beach watches.
            </p>
          </div>

          {/* Public Resolution Feed */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {t('recent_reports')}
                  </h2>
                  <p className="text-xs text-slate-400">Live community resolution stream</p>
                </div>
              </div>
              <button onClick={loadComplaints} className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {complaints.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No incident reports currently recorded.
                </div>
              ) : (
                complaints.map(c => {
                  const isResolved = c.status === 'resolved';
                  const isDispatched = c.status === 'dispatched';

                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate max-w-[170px]">
                          {c.beach_name}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isResolved 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                            : isDispatched
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2">
                        {c.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-1.5">
                        <span className="capitalize text-slate-400">
                          {c.waste_category?.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-[10px] text-rose-400 font-bold uppercase">
                          {c.severity} severity
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
