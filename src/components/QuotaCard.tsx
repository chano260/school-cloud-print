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
  let badgeColor = 'bg-teal-50 border-teal-200 text-teal-800';
  if (percentage >= 90) {
    barColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 border-rose-200 text-rose-800';
  } else if (percentage >= 70) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-50 border-amber-200 text-amber-800';
  }

  return (
    <section
      aria-label="Status Kuota Cetak Harian"
      className="bg-white rounded-3xl border border-slate-200 shadow-md p-6"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
            Jatah Kuota Hari Ini
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono tabular-nums">
              {remaining}
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-600">lembar tersisa</span>
          </div>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center px-3.5 py-1.5 rounded-xl border text-sm font-extrabold font-mono tabular-nums ${badgeColor}`}>
            {usedToday} / {dailyLimit} Lembar
          </span>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">Reset otomatis 00:00 WIT</p>
        </div>
      </div>

      {/* Progress Bar Kuota */}
      <div
        className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"
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
