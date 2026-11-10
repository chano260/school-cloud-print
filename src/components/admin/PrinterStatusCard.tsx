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
    if (normalizedInk.wasteBox > 85) warnings.push('Kotak Pembuangan (Maintenance Box) Hampir Penuh');
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
      barClass: normalizedInk.wasteBox > 80 ? 'bg-destructive' : 'bg-primary',
    },
  ];

  return (
    <section
      aria-label="Status Perangkat Keras Printer"
      className="bg-card rounded-2xl shadow-card border border-border p-5 sm:p-6 mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Telemetri Perangkat Keras SNMP
          </span>
          <h2 className="text-xl font-bold text-foreground mt-0.5">
            Epson EcoTank L6460 • Ruang TU
          </h2>
        </div>

        {/* Status Badge */}
        <div>
          {status === 'READY' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary-soft text-foreground border border-teal-300">
              <CheckCircle className="w-4 h-4 text-primary" aria-hidden="true" /> Siap Mencetak
            </span>
          )}
          {status === 'PRINTING' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300 animate-pulse">
              <Layers className="w-4 h-4 text-primary" aria-hidden="true" /> Sedang Mencetak...
            </span>
          )}
          {status === 'OUT_OF_PAPER' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-destructive border border-red-300 animate-bounce">
              <FileWarning className="w-4 h-4" aria-hidden="true" /> Kertas Habis!
            </span>
          )}
          {status === 'OFFLINE' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <WifiOff className="w-4 h-4" aria-hidden="true" /> Agent Lokal Offline
            </span>
          )}
        </div>
      </div>

      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div
          role="alert"
          className="mb-5 p-3.5 bg-accent-soft border border-orange-200 rounded-xl text-orange-950 text-xs flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold">Peringatan Suplai Printer:</span> {warnings.join(', ')}.
          </div>
        </div>
      )}

      {/* Ink Progress Bars (CMYK + Maintenance Box) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {gauges.map((g) => (
          <div
            key={g.label}
            className="bg-muted/60 p-3.5 rounded-xl border border-slate-200/80 last:col-span-2 sm:last:col-span-1"
          >
            <div className="flex justify-between items-center text-xs font-semibold mb-2 text-card-foreground">
              <span>{g.label}</span>
              <span className="font-mono tabular-nums font-bold">{g.value}%</span>
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
