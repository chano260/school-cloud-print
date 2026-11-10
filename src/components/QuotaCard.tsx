'use client';

import React from 'react';
import { FileCheck2, Sparkles } from 'lucide-react';

interface QuotaCardProps {
  dailyLimit: number;
  usedToday: number; // committed + reserved
  remaining: number;
}

export default function QuotaCard({ dailyLimit, usedToday, remaining }: QuotaCardProps) {
  const percentage = Math.min(100, Math.round((usedToday / (dailyLimit || 1)) * 100));

  let progressColor = 'bg-primary';
  let statusBadge = 'bg-primary-soft text-foreground border-border';
  if (percentage >= 90) {
    progressColor = 'bg-destructive';
    statusBadge = 'bg-red-50 text-destructive border-red-200';
  } else if (percentage >= 70) {
    progressColor = 'bg-accent';
    statusBadge = 'bg-accent-soft text-accent border-orange-200';
  }

  return (
    <section
      aria-label="Status Kuota Cetak Harian"
      className="bg-card rounded-2xl shadow-card border border-border p-5 sm:p-6 mb-6 transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            Jatah Kuota Harian Guru
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-3xl font-bold text-foreground font-mono tabular-nums">
              {remaining}
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              lembar tersisa hari ini
            </span>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border font-mono tabular-nums ${statusBadge}`}
          >
            <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
            {usedToday} / {dailyLimit} Lembar
          </span>
          <p className="text-xs text-muted-foreground">Reset otomatis pukul 00:00 WIB</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full bg-muted rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60"
        role="progressbar"
        aria-valuenow={usedToday}
        aria-valuemin={0}
        aria-valuemax={dailyLimit}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}
