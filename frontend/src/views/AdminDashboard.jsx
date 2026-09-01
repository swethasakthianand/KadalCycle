import React, { useState, useEffect } from 'react';
import { 
  Compass, BarChart3, MapPin, Truck, RefreshCw, 
  Leaf, ShieldAlert, Award, FileText, CheckCircle2, ArrowUpRight,
  Download, ShieldCheck, Waves, Cpu, Sparkles, Filter, Search,
  AlertTriangle, Send
} from 'lucide-react';
import { useLanguage } from '../locales';
import { api } from '../services/api';
import { MapView } from '../components/MapView';

export const AdminDashboard = () => {
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Interactive Admin Dispatch & Map State
  const [incidents, setIncidents] = useState([
    {
      id: 'INC-101',
      title: 'Plastic Waste Dump near Shore',
      location: 'Kasimedu North Beach',
      coords: { lat: 13.128, lng: 80.298 },
      severity: 'High',
      status: 'Pending',
      time: '10 mins ago',
      assignedTo: null
    },
    {
      id: 'INC-102',
      title: 'Abandoned Ghost Fishing Net',
      location: 'Kasimedu Harbour Gate 3',
      coords: { lat: 13.122, lng: 80.292 },
      severity: 'Medium',
      status: 'Pending',
      time: '25 mins ago',
      assignedTo: null
    }
  ]);

  const [collectors] = useState([
    { id: 'COL-01', name: 'Murugan (Truck 04)', location: 'Kasimedu South' },
    { id: 'COL-02', name: 'Kannan (Boat 02)', location: 'Harbour Gate 1' },
    { id: 'COL-03', name: 'Velu (EV Vehicle)', location: 'Processing Hub' }
  ]);

  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);
  const [selectedCollector, setSelectedCollector] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashData, pickupList] = await Promise.all([
        api.getAnalytics(),
        api.getPickups()
      ]);
      setData(dashData);
      setPickups(pickupList || []);
    } catch (e) {
      console.error('Failed to load admin analytics', e);
    } finally {
      setLoading(false);
    }
  };

  // Dispatch Action Handler
  const handleDispatch = (e) => {
    e.preventDefault();
    if (!selectedCollector || !selectedIncident) return;

    const updatedIncidents = incidents.map((item) => {
      if (item.id === selectedIncident.id) {
        return {
          ...item,
          status: 'Dispatched',
          assignedTo: selectedCollector
        };
      }
      return item;
    });

    setIncidents(updatedIncidents);
    setSelectedIncident({
      ...selectedIncident,
      status: 'Dispatched',
      assignedTo: selectedCollector
    });
    setSelectedCollector('');
  };

  const kpis = data?.kpis || {
    total_waste_collected_kg: 248.5,
    total_processed_kg: 184.5,
    co2_avoided_kg: 193.5,
    ocean_plastic_diverted_kg: 142.0,
    total_credits_disbursed: 540,
    active_collectors: 6,
    verified_processors: 3,
    active_complaints: incidents.filter(i => i.status === 'Pending').length,
    resolved_complaints: incidents.filter(i => i.status === 'Dispatched').length
  };

  const filteredPickups = pickups.filter(p => {
    const matchesSearch = (p.qr_code_hash || p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.harbour_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.waste_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true : p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportAuditReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Batch ID,Harbour,Waste Type,Est Weight (kg),Actual Weight (kg),Route,Status,Credits Awarded"]
      .concat(pickups.map(p => `"${p.qr_code_hash || p.id}","${p.harbour_name || 'Kasimedu'}","${p.waste_type}","${p.estimated_weight_kg || 0}","${p.actual_weight_kg || 0}","${p.destination_route || 'Valorization'}","${p.status}","${p.credits_awarded || 0}"`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kadalcycle_traceability_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-purple-500/30 p-6 sm:p-8 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-teal-950/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-widest">
              <Compass className="w-4 h-4" />
              <span>TN Maritime & Fisheries Board (தமிழ்நாடு கடல் வாரியம்)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('admin_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Real-time port waste valorization, collector fleet tracking, and coastal pollution mitigation ledger.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportAuditReport}
              className="px-4 py-3 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-xs shadow-sm transition touch-btn flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Export Audit CSV</span>
            </button>

            <button 
              onClick={loadDashboard}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition touch-btn cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Bioluminescent 4-KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI 1: Total Diverted */}
        <div className="glass-panel-glow rounded-3xl p-5 border border-sky-500/30 space-y-3">
          <div className="flex items-center justify-between text-sky-400 text-xs font-bold">
            <span>{t('kpi_total_diverted')}</span>
            <Leaf className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {kpis.total_waste_collected_kg} <span className="text-xs font-normal text-sky-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">From 5 coastal harbours</div>
        </div>

        {/* KPI 2: Net CO2 Avoided */}
        <div className="glass-panel-emerald rounded-3xl p-5 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
            <span>{t('kpi_co2_saved')}</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {kpis.co2_avoided_kg} <span className="text-xs font-normal text-emerald-300">kg CO2e</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Landfill methane avoided</div>
        </div>

        {/* KPI 3: Ocean Plastics Intercepted */}
        <div className="glass-panel-amber rounded-3xl p-5 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
            <span>Ocean Plastics Recovered</span>
            <Waves className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            {kpis.ocean_plastic_diverted_kg} <span className="text-xs font-normal text-amber-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Ghost nets & EPS thermocol</div>
        </div>

        {/* KPI 4: Eco-Points Released */}
        <div className="glass-panel rounded-3xl p-5 border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between text-purple-400 text-xs font-bold">
            <span>{t('kpi_points_disbursed')}</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
            {kpis.total_credits_disbursed} <span className="text-xs font-normal text-purple-400">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Diesel & ice subsidies credited</div>
        </div>

      </div>

      {/* Geospatial Radar & Fleet Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map View */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {t('geospatial_hotspots')}
                </h2>
                <p className="text-xs text-slate-400">Coastal harbours, active dispatch radars & fleet positions</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-emerald-400">RADAR ACTIVE</span>
            </div>
          </div>

          <MapView
            height="380px"
            hubs={data?.hubs || []}
            pickups={pickups}
            center={[13.0827, 80.2707]}
            zoom={11}
          />
        </div>

        {/* Dispatch Console */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Fleet Dispatch Console
                </h3>
                <p className="text-xs text-slate-400">Assign nearby collectors to incident alerts</p>
              </div>
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>

            {/* Active Incident List Selection */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold">Active Incidents Queue:</span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                      selectedIncident?.id === inc.id 
                        ? 'bg-purple-500/20 border-purple-500/60 text-white font-bold' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-sky-400">{inc.id}</span>
                        <span>{inc.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{inc.location}</div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      inc.status === 'Dispatched' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {inc.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Details & Form */}
            {selectedIncident && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{selectedIncident.title}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">{selectedIncident.severity} Priority</span>
                </div>

                {selectedIncident.status === 'Pending' ? (
                  <form onSubmit={handleDispatch} className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">
                        Select Collector Unit:
                      </label>
                      <select
                        value={selectedCollector}
                        onChange={(e) => setSelectedCollector(e.target.value)}
                        required
                        className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-purple-400"
                      >
                        <option value="">-- Choose Fleet Unit --</option>
                        {collectors.map(c => (
                          <option key={c.id} value={c.name}>{c.name} ({c.location})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-purple-600/30"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Fleet Unit</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Unit Assigned & En Route</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Dispatched to: <strong className="text-white">{selectedIncident.assignedTo}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* End-to-End Traceability Blockchain Ledger Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {t('audit_ledger_title')}
              </h2>
              <p className="text-xs text-slate-400">Tamper-proof verifiable provenance chain</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Hash / Harbour..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 focus:border-purple-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none w-48 sm:w-56"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="requested">Requested</option>
              <option value="in_transit">In Transit</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Cryptographic Hash</th>
                <th className="py-3 px-4">Harbour Node</th>
                <th className="py-3 px-4">Waste Classification</th>
                <th className="py-3 px-4">Scale Weight</th>
                <th className="py-3 px-4">Valorization Route</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPickups.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No batches match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredPickups.map((p) => {
                  const isCompleted = p.status === 'completed';
                  const isInTransit = p.status === 'in_transit';

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition font-sans">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                        {p.qr_code_hash || p.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-200 truncate max-w-[160px]">
                        {p.harbour_name || 'Kasimedu Fishing Harbour'}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-slate-300">
                        {p.waste_type?.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {p.actual_weight_kg || p.estimated_weight_kg || 25} kg
                      </td>
                      <td className="py-3.5 px-4 text-emerald-300 font-medium truncate max-w-[200px]">
                        {p.destination_route || 'Coastal Bio-Energy Plant'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isCompleted
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : isInTransit
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-amber-300">
                        +{p.credits_awarded || 0}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};