'use client';

import React from 'react';
import { InkLevels, PrinterStatus } from '@/types';
import { AlertTriangle, CheckCircle, WifiOff, FileWarning, Layers } from 'lucide-react';

interface PrinterStatusCardProps {
  status: PrinterStatus;
  ink: InkLevels;
}

export default function PrinterStatusCard({ status, ink }: PrinterStatusCardProps) {
  const getLowInkWarn = () => {
    const warnings: string[] = [];
    if (ink.black < 15) warnings.push('Tinta Hitam');
    if (ink.cyan < 15) warnings.push('Tinta Biru (Cyan)');
    if (ink.magenta < 15) warnings.push('Tinta Merah (Magenta)');
    if (ink.yellow < 15) warnings.push('Tinta Kuning');
    if (ink.wasteBox > 85) warnings.push('Kotak Pembuangan (Maintenance Box) Hampir Penuh');
    return warnings;
  };

  const warnings = getLowInkWarn();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Perangkat Keras</span>
          <h2 className="text-xl font-bold text-slate-800">Epson EcoTank L6460 (Ruang TU)</h2>
        </div>

        {/* Status Badge */}
        <div>
          {status === 'READY' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-4 h-4" /> Siap Mencetak
            </span>
          )}
          {status === 'PRINTING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
              <Layers className="w-4 h-4" /> Sedang Mencetak...
            </span>
          )}
          {status === 'OUT_OF_PAPER' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 animate-bounce">
              <FileWarning className="w-4 h-4" /> Kertas Habis!
            </span>
          )}
          {status === 'OFFLINE' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <WifiOff className="w-4 h-4" /> Agent Offline
            </span>
          )}
        </div>
      </div>

      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Peringatan Suplai:</span> Segera siapkan isi ulang untuk {warnings.join(', ')}.
          </div>
        </div>
      )}

      {/* Ink Progress Bars (CMYK + Maintenance Box) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Black */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-700">
            <span>Hitam (BK)</span>
            <span>{ink.black}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-slate-900 h-2 rounded-full" style={{ width: `${ink.black}%` }} />
          </div>
        </div>

        {/* Cyan */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-700">
            <span>Cyan (C)</span>
            <span>{ink.cyan}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${ink.cyan}%` }} />
          </div>
        </div>

        {/* Magenta */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-700">
            <span>Magenta (M)</span>
            <span>{ink.magenta}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${ink.magenta}%` }} />
          </div>
        </div>

        {/* Yellow */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-700">
            <span>Yellow (Y)</span>
            <span>{ink.yellow}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${ink.yellow}%` }} />
          </div>
        </div>

        {/* Maintenance Box */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
          <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-700">
            <span>Waste Box</span>
            <span>{ink.wasteBox}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${ink.wasteBox > 80 ? 'bg-red-500' : 'bg-slate-500'}`}
              style={{ width: `${ink.wasteBox}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
