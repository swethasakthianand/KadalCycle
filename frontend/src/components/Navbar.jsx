import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Waves, Globe, RefreshCw, 
  Coins, Volume2, Menu, X, Anchor, Truck, Factory, MapPin, Compass, Sparkles, ChevronDown,
  PhoneCall, Headphones, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../locales';

export const Navbar = ({ currentRole, setCurrentRole, points = 320 }) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showHelpline, setShowHelpline] = useState(false);

  const roles = [
    { 
      id: 'vendor', 
      label: t('role_vendor'), 
      sublabel: 'மீனவர் / வியாபாரி', 
      icon: Anchor, 
      color: 'text-sky-400', 
      border: 'border-sky-500/40', 
      glow: 'shadow-cyan-glow',
      activeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/40' 
    },
    { 
      id: 'collector', 
      label: t('role_collector'), 
      sublabel: 'கழிவு சேகரிப்பாளர்', 
      icon: Truck, 
      color: 'text-emerald-400', 
      border: 'border-emerald-500/40', 
      glow: 'shadow-emerald-glow',
      activeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' 
    },
    { 
      id: 'processor', 
      label: t('role_processor'), 
      sublabel: 'மறுசுழற்சி ஆலை', 
      icon: Factory, 
      color: 'text-amber-400', 
      border: 'border-amber-500/40', 
      glow: 'shadow-amber-glow',
      activeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/40' 
    },
    { 
      id: 'resident', 
      label: t('role_resident'), 
      sublabel: 'கடற்கரை புகார் பிரிவு', 
      icon: MapPin, 
      color: 'text-rose-400', 
      border: 'border-rose-500/40', 
      glow: 'shadow-rose-500/20',
      activeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/40' 
    },
    { 
      id: 'admin', 
      label: t('role_admin'), 
      sublabel: 'நிர்வாக மையம்', 
      icon: Compass, 
      color: 'text-purple-400', 
      border: 'border-purple-500/40', 
      glow: 'shadow-purple-500/20',
      activeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/40' 
    }
  ];

  const currentRoleObj = roles.find(r => r.id === currentRole) || roles[0];
  const CurrentIcon = currentRoleObj.icon;

  const playVoicePrompt = () => {
    if ('speechSynthesis' in window) {
      const text = lang === 'ta' 
        ? `கடல் சுழற்சி தளத்திற்கு வரவேற்கிறோம். நீங்கள் இப்போது ${currentRoleObj.label} பகுதியில் உள்ளீர்கள்.`
        : `Welcome to KadalCycle. You are currently viewing the ${currentRoleObj.label} portal.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 shadow-2xl backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3.5">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
              <Waves className="w-6 h-6 text-slate-950 stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-sans">
                  Kadal<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">Cycle</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/60 hidden sm:inline-block">
                  {lang === 'ta' ? 'கடல் சுழற்சி' : 'TRACE v2.0'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs font-medium tracking-wide">
                {t('app_tagline')}
              </p>
            </div>
          </div>

          {/* Desktop Role Navigation Pills */}
          <nav className="hidden lg:flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-white/5 shadow-inner">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setCurrentRole(r.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 touch-btn ${
                    isActive 
                      ? `${r.activeBg} ${r.glow} border shadow-md font-bold` 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? r.color : 'text-slate-400'}`} />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Current Role Dropdown Toggle */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${currentRoleObj.activeBg}`}
            >
              <CurrentIcon className={`w-4 h-4 ${currentRoleObj.color}`} />
              <span className="max-w-[120px] truncate">{currentRoleObj.label}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-2 left-0 w-64 glass-panel rounded-2xl p-2 shadow-2xl border border-slate-700 z-50 animate-in fade-in slide-in-from-top-2">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isActive = currentRole === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setCurrentRole(r.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
                        isActive ? r.activeBg : 'text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${r.color}`} />
                      <div>
                        <div className="font-bold">{r.label}</div>
                        <div className="text-[10px] text-slate-400">{r.sublabel}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Audio Voice Guidance */}
            <button
              onClick={playVoicePrompt}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-sky-400 border border-sky-500/20 hover:border-sky-500/40 shadow-sm transition touch-btn group"
              title="Tamil / English Voice Guidance (ஒலி வழிகாட்டி)"
            >
              <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>

            {/* Helpline Modal Trigger Button */}
            <button
              onClick={() => setShowHelpline(true)}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm transition touch-btn flex items-center space-x-1.5 cursor-pointer"
              title="Harbour Support & Helpline"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold hidden xl:inline">
                {lang === 'ta' ? 'உதவி எண்' : 'Helpline'}
              </span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-sky-500/30 text-xs font-bold text-slate-200 transition touch-btn"
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === 'ta' ? 'ENG' : 'தமிழ்'}</span>
            </button>

            {/* Green Rewards Wallet Points Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-amber-glow text-amber-300 text-xs font-black">
              <Coins className="w-4 h-4 text-amber-400 animate-bounce" style={{ animationDuration: '3s' }} />
              <span className="font-mono">{points}</span>
              <span className="text-[10px] text-amber-400/80 uppercase tracking-wider">{t('points')}</span>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 space-y-3 bg-slate-950/95 border-t border-slate-800 backdrop-blur-2xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 pt-2">
            {t('switch_role')}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentRole(r.id);
                    setMenuOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition ${
                    isActive ? r.activeBg : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${r.color}`} />
                    <div className="text-left">
                      <div>{r.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{r.sublabel}</div>
                    </div>
                  </div>
                  {isActive && <Sparkles className="w-4 h-4 text-sky-400" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between px-2 text-xs text-slate-400">
            <span>{t('wallet_balance')}: <strong className="text-amber-400 font-mono">{points} {t('points')}</strong></span>
            <button onClick={toggleLanguage} className="text-sky-400 underline font-bold">
              {lang === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
            </button>
          </div>
        </div>
      )}

      {/* HELPLINE MODAL POPUP (RENDERED VIA PORTAL TO BODY) */}
      {showHelpline && createPortal(
        <div 
          onClick={() => setShowHelpline(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 left-0 top-0 w-screen h-screen m-0"
        >
          {/* Modal Card (e.stopPropagation prevents closing when clicking inside card content) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {lang === 'ta' ? 'கடல் சுழற்சி உதவி மையம்' : 'KadalCycle Support'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'ta' ? '24/7 துறைமுக உதவி மற்றும் தகவல்கள்' : '24/7 Harbour Assistance & Queries'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpline(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Support Numbers Grid */}
            <div className="space-y-3">
              
              {/* Vendor Line */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {lang === 'ta' ? 'மீனவர்கள் & வியாபாரிகள்' : 'Fishermen & Vendors Line'}
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-0.5">
                    {lang === 'ta' ? 'கழிவு சேகரிப்பு & புள்ளி சந்தேகங்கள்' : 'Pickup requests & credit queries'}
                  </div>
                </div>
                <a 
                  href="tel:18004250001" 
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition"
                >
                  1800-425-0001
                </a>
              </div>

              {/* Collector Line */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                    {lang === 'ta' ? 'சேகரிப்பாளர்கள் & ஓட்டுநர்கள்' : 'Collectors & Drivers Line'}
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-0.5">
                    {lang === 'ta' ? 'வழித்தடம் & QR சரிபார்ப்பு' : 'GPS route & QR verification'}
                  </div>
                </div>
                <a 
                  href="tel:18004250002" 
                  className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-xs font-bold hover:bg-sky-500 hover:text-slate-950 transition"
                >
                  1800-425-0002
                </a>
              </div>

              {/* Local Port Authority */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    {lang === 'ta' ? 'காசிமேடு கட்டுப்பாட்டு அறை' : 'Port Control Room (Local)'}
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-0.5">
                    Kasimedu Harbour Authority
                  </div>
                </div>
                <a 
                  href="tel:+914425980100" 
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition"
                >
                  +91 44 2598 0100
                </a>
              </div>

            </div>

            {/* Language Note */}
            <div className="flex items-start space-x-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                {lang === 'ta' ? (
                  <>உதவி மையம் <strong>தமிழ்</strong> மற்றும் <strong>ஆங்கிலத்தில்</strong> 24 மணி நேரமும் செயல்படும்.</>
                ) : (
                  <>Support available in <strong>Tamil (தமிழ்)</strong> and <strong>English</strong> 24/7.</>
                )}
              </span>
            </div>

          </div>
        </div>,
        document.body
      )}

    </header>
  );
};