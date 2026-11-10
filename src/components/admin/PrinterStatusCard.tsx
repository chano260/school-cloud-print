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
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 mb-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-medium text-slate-400">Status Perangkat Keras</p>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Epson EcoTank L6460 • Ruang TU
          </h2>
        </div>

        <div>
          {status === 'READY' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Siap Mencetak
            </span>
          )}
          {status === 'PRINTING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 animate-pulse">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" /> Sedang Mencetak
            </span>
          )}
          {status === 'OUT_OF_PAPER' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <FileWarning className="w-3.5 h-3.5" aria-hidden="true" /> Kertas Habis
            </span>
          )}
          {status === 'OFFLINE' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              <WifiOff className="w-3.5 h-3.5" aria-hidden="true" /> Agent Offline
            </span>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div
          role="alert"
          className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold">Perhatian:</span> {warnings.join(', ')}.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {gauges.map((g) => (
          <div
            key={g.label}
            className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 last:col-span-2 sm:last:col-span-1"
          >
            <div className="flex justify-between items-center text-xs font-medium mb-1.5 text-slate-700">
              <span>{g.label}</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">{g.value}%</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
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
