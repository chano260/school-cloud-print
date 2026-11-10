'use client';

import React from 'react';

interface QuotaCardProps {
  dailyLimit: number;
  usedToday: number; // committed + reserved
  remaining: number;
}

export default function QuotaCard({ dailyLimit, usedToday, remaining }: QuotaCardProps) {
  const percentage = Math.min(100, Math.round((usedToday / (dailyLimit || 1)) * 100));

  let progressColor = 'bg-emerald-500';
  if (percentage >= 90) progressColor = 'bg-red-500';
  else if (percentage >= 70) progressColor = 'bg-amber-500';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Jatah Kuota Hari Ini
          </span>
          <h3 className="text-2xl font-bold text-slate-800">
            {remaining} <span className="text-sm font-normal text-slate-500">lembar tersisa</span>
          </h3>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-slate-600">
            {usedToday} / {dailyLimit} Lembar
          </span>
          <p className="text-xs text-slate-400">Reset pukul 00:00 WIB</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
