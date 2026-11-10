'use client';

import React from 'react';
import { InkLevels, PrinterStatus } from '@/types';
import { AlertTriangle, CheckCircle, WifiOff, FileWarning, Layers } from 'lucide-react';

interface PrinterStatusCardProps {
  status: PrinterStatus;
  ink: any;
}

export default function PrinterStatusCard({ status, ink }: PrinterStatusCardProps) {
  const normalizedInk: InkLevels = {
    black: ink?.black ?? ink?.k ?? 90,
    cyan: ink?.cyan ?? ink?.c ?? 65,
    magenta: ink?.magenta ?? ink?.m ?? 70,
    yellow: ink?.yellow ?? ink?.y ?? 40,
    wasteBox: ink?.wasteBox ?? ink?.waste ?? 15,
  };

  const getLowInkWarn = () => {
    const warnings: string[] = [];
    if (normalizedInk.black < 15) warnings.push('Tinta Hitam Menipis');
    if (normalizedInk.cyan < 15) warnings.push('Tinta Biru (Cyan) Menipis');
    if (normalizedInk.magenta < 15) warnings.push('Tinta Merah (Magenta) Menipis');
    if (normalizedInk.yellow < 15) warnings.push('Tinta Kuning Menipis');
    if (normalizedInk.wasteBox > 85) warnings.push('Kotak Pembuangan (Waste Box) Hampir Penuh');
    return warnings;
  };

  const warnings = getLowInkWarn();

  const gauges = [
    { label: 'Hitam (BK)', value: normalizedInk.black, barClass: 'bg-slate-900' },
    { label: 'Cyan (C)', value: normalizedInk.cyan, barClass: 'bg-sky-500' },
    { label: 'Magenta (M)', value: normalizedInk.magenta, barClass: 'bg-pink-500' },
    { label: 'Yellow (Y)', value: normalizedInk.yellow, barClass: 'bg-amber-400' },
    {
      label: 'Waste Box',
      value: normalizedInk.wasteBox,
      barClass: normalizedInk.wasteBox > 80 ? 'bg-rose-500' : 'bg-teal-600',
    },
  ];

  return (
    <section
      aria-label="Status Perangkat Keras Printer"
      className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            Status Perangkat Keras
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Epson EcoTank L6460 • Ruang TU
          </h2>
        </div>

        <div>
          {status === 'READY' && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" /> Siap Mencetak
            </span>
          )}
          {status === 'PRINTING' && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-teal-50 text-teal-800 border border-teal-200 animate-pulse shadow-xs">
              <Layers className="w-4 h-4 text-teal-600" aria-hidden="true" /> Sedang Mencetak
            </span>
          )}
          {status === 'OUT_OF_PAPER' && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-xs">
              <FileWarning className="w-4 h-4 text-rose-600" aria-hidden="true" /> Kertas Habis
            </span>
          )}
          {status === 'OFFLINE' && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
              <WifiOff className="w-4 h-4 text-slate-500" aria-hidden="true" /> Agent Offline
            </span>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div
          role="alert"
          className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <span className="font-bold">Perhatian:</span> {warnings.join(', ')}.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {gauges.map((g) => (
          <div
            key={g.label}
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 last:col-span-2 sm:last:col-span-1 shadow-xs"
          >
            <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2 text-slate-700">
              <span>{g.label}</span>
              <span className="font-mono tabular-nums font-black text-slate-900 text-sm sm:text-base">{g.value}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`${g.barClass} h-full rounded-full transition-all duration-300`}
                style={{ width: `${g.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
