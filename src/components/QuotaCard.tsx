'use client';

import React from 'react';

interface QuotaCardProps {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
}

export default function QuotaCard({ dailyLimit, usedToday, remaining }: QuotaCardProps) {
  const percentage = Math.min(100, Math.round((usedToday / (dailyLimit || 1)) * 100));

  let barColor = 'bg-teal-600';
  if (percentage >= 90) barColor = 'bg-rose-500';
  else if (percentage >= 70) barColor = 'bg-amber-500';

  return (
    <section
      aria-label="Status Kuota Cetak Harian"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-5"
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <p className="text-xs font-medium text-slate-500">Jatah Kuota Hari Ini</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {remaining}
            </span>
            <span className="text-sm text-slate-500">lembar tersisa</span>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold font-mono tabular-nums">
            {usedToday} / {dailyLimit} Lembar
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Reset otomatis 00:00 WIT</p>
        </div>
      </div>

      <div
        className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={usedToday}
        aria-valuemin={0}
        aria-valuemax={dailyLimit}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}
