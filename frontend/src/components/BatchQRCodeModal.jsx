import React, { useEffect } from 'react';
import { QrCode, Download, Printer, X, ShieldCheck, Waves } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useLanguage } from '../locales';
import { supabase } from '../utils/supabaseClient';

export const BatchQRCodeModal = ({ isOpen = true, onClose, pickup }) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (pickup) {
      const saveBatchToSupabase = async () => {
        try {
          const { error } = await supabase
            .from('pickups')
            .upsert([
              {
                qr_code_hash: pickup.qr_code_hash || 'KC-KAS-2026-001',
                vendor_name: pickup.vendor_name || 'Murugan Fishery',
                estimated_weight_kg: pickup.estimated_weight_kg || 25,
                harbour_name: pickup.harbour_name || 'Kasimedu Harbour',
                status: pickup.status || 'Requested'
              }
            ], { onConflict: 'qr_code_hash' });

          if (error) throw error;
          console.log("Batch successfully saved to Supabase!");
        } catch (err) {
          console.error("Error saving batch to Supabase:", err.message);
        }
      };

      saveBatchToSupabase();
    }
  }, [pickup]);

  if (!pickup) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (pickup.qr_image_base64) {
      const link = document.createElement('a');
      link.href = pickup.qr_image_base64;
      link.download = `kadalcycle_batch_${pickup.qr_code_hash || 'batch'}.png`;
      link.click();
    }
  };

  const qrPayload = {
    batchId: pickup.qr_code_hash || 'KC-KAS-2026-001',
    vendor: pickup.vendor_name || 'Murugan Fishery',
    weight: pickup.estimated_weight_kg || 25,
    harbour: pickup.harbour_name || 'Kasimedu Harbour',
    status: pickup.status || 'Requested'
  };

  const qrValueString = JSON.stringify(qrPayload);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="glass-panel-glow border border-sky-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">{t('qr_badge_modal_title')}</h3>
              <p className="text-xs text-sky-400 font-mono font-bold">{pickup.qr_code_hash || 'KC-KAS-2026-001'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Physical Badge Container */}
        <div className="p-5 bg-white rounded-2xl shadow-xl text-slate-900 text-center border-2 border-sky-500/40">
          
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <div className="font-extrabold text-base text-slate-900 tracking-tight flex items-center space-x-1">
              <Waves className="w-4 h-4 text-sky-600 inline" />
              <span>Kadal<span className="text-sky-600">Cycle</span></span>
            </div>
            <div className="text-[10px] font-mono font-bold bg-sky-100 text-sky-900 px-2 py-0.5 rounded-full uppercase">
              {pickup.status || 'Requested'}
            </div>
          </div>

          {/* QR Code Graphic with JSON Payload */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 inline-block mb-3">
            <QRCodeCanvas 
              value={qrValueString}
              size={176}
              fgColor="#000000"
              bgColor="#FFFFFF"
              level="H"
              className="mx-auto"
            />
          </div>

          <div className="font-mono text-xs font-black tracking-widest text-slate-900 bg-slate-100 py-1.5 rounded border border-slate-200">
            {pickup.qr_code_hash || 'KC-KAS-2026-001'}
          </div>

          {/* Batch Metadata */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 text-left text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-sans">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Harbour Node</span>
              <span className="font-bold text-slate-900 truncate block">{pickup.harbour_name || 'Kasimedu Harbour'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Est. Weight</span>
              <span className="font-bold text-sky-700 block font-mono">{pickup.estimated_weight_kg || 25} kg</span>
            </div>
            <div className="col-span-2 border-t pt-1.5 mt-0.5">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Traceability Stream</span>
              <span className="font-bold text-slate-900 block truncate">
                {pickup.ai_classification_tag || pickup.waste_type || 'Fish Marine Debris'}
              </span>
            </div>
          </div>

          <div className="mt-2.5 text-[9px] text-slate-500 flex items-center justify-center space-x-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Official Marine Traceability Ledger • Tamil Nadu Coast</span>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handlePrint}
            className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>{t('print_badge')}</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>{t('download_badge')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};