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
        'Apakah Anda sudah berada di depan printer ruang TU? Dokumen akan langsung dicetak.'
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
            <Clock className="w-3 h-3" aria-hidden="true" /> Antre
          </span>
        );
      case 'PRINTING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 animate-pulse">
            <Play className="w-3 h-3" aria-hidden="true" /> Mencetak...
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Lock className="w-3 h-3" aria-hidden="true" /> Terkunci
          </span>
        );
      case 'RELEASED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Play className="w-3 h-3" aria-hidden="true" /> Prioritas
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" /> {job.status}
          </span>
        );
    }
  };

  return (
    <section
      aria-label="Daftar Antrean Cetak"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">Antrean Cetak Hari Ini</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="h-8 px-2.5 rounded-lg hover:bg-slate-100 text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Segarkan
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
          <p className="text-xs">Belum ada dokumen di antrean.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {jobs.map((job, idx) => (
            <div
              key={job.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold font-mono tabular-nums flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                    {job.fileName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    {job.user?.name && (
                      <>
                        <span className="font-medium text-slate-600">{job.user.name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="font-mono text-slate-600">{job.physicalSheets} lbr</span>
                    <span>•</span>
                    <span>{job.copies}x</span>
                    <span>•</span>
                    <span>{job.isColor ? 'Warna' : 'B&W'}</span>
                    <span>•</span>
                    <span>{job.isDuplex ? 'Bolak-balik' : '1 Sisi'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {getStatusBadge(job)}

                {job.status === 'LOCKED' &&
                  (!currentUserId || job.userId === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => handleRelease(job.id)}
                      disabled={releasingId === job.id}
                      className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" aria-hidden="true" />
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
