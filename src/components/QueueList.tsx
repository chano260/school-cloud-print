'use client';

import React, { useState } from 'react';
import { PrintJob } from '@prisma/client';
import { Clock, Play, CheckCircle2, AlertTriangle, Lock, FileText, RefreshCw } from 'lucide-react';

interface QueueListProps {
  jobs: (PrintJob & { user?: { name?: string | null; email?: string | null } })[];
  currentUserId: string;
  onRefresh: () => void;
}

export default function QueueList({ jobs, currentUserId, onRefresh }: QueueListProps) {
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const handleRelease = async (jobId: string) => {
    if (
      !confirm(
        'Apakah Anda sudah berada di depan printer Epson L6460 di ruang TU? Dokumen akan langsung melompat ke urutan terdepan dan dicetak.'
      )
    ) {
      return;
    }

    setReleasingId(jobId);
    try {
      const res = await fetch('/api/jobs/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal merilis dokumen.');
      } else {
        onRefresh();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReleasingId(null);
    }
  };

  const getStatusBadge = (job: PrintJob) => {
    switch (job.status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Antre
          </span>
        );
      case 'PRINTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-soft text-foreground border border-teal-300 animate-pulse">
            <Play className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> Sedang Dicetak
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-soft text-orange-900 border border-orange-200">
            <Lock className="w-3.5 h-3.5 text-accent" aria-hidden="true" /> Terkunci (Rahasia)
          </span>
        );
      case 'RELEASED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-900 border border-teal-300">
            <Play className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> Prioritas Utama
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-destructive border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> {job.status}
          </span>
        );
    }
  };

  return (
    <section
      aria-label="Daftar Antrean Cetak"
      className="bg-card rounded-2xl shadow-card border border-border p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Antrean Berkas Cetak</h2>
          <p className="text-xs text-muted-foreground">
            Urutan cetak otomatis FIFO • Dokumen rahasia yang dirilis otomatis mendapat prioritas
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-border hover:bg-background text-xs text-primary font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Muat Ulang
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-muted/40 rounded-xl border border-dashed border-slate-200">
          <FileText className="w-10 h-10 mx-auto mb-2 text-primary/40" aria-hidden="true" />
          <p className="text-sm font-medium">Belum ada antrean cetak hari ini.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {jobs.map((job, idx) => (
            <div
              key={job.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-soft text-foreground flex items-center justify-center text-xs font-bold font-mono tabular-nums flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-card-foreground truncate max-w-xs sm:max-w-md">
                    {job.fileName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="font-mono font-semibold text-foreground tabular-nums">
                      {job.physicalSheets} lembar
                    </span>
                    <span>•</span>
                    <span>{job.copies}x rangkap</span>
                    <span>•</span>
                    <span>{job.isColor ? 'Warna' : 'Hitam-Putih'}</span>
                    <span>•</span>
                    <span>{job.isDuplex ? 'Bolak-balik' : '1 Sisi'}</span>
                    {job.user?.name && (
                      <>
                        <span>•</span>
                        <span className="text-primary font-medium">{job.user.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center">
                {getStatusBadge(job)}

                {job.status === 'LOCKED' &&
                  (!currentUserId || job.userId === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => handleRelease(job.id)}
                      disabled={releasingId === job.id}
                      className="min-h-[40px] px-3.5 py-2 bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      {releasingId === job.id ? 'Merilis...' : 'Rilis Sekarang'}
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
