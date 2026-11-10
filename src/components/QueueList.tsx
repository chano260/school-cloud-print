'use client';

import React, { useState } from 'react';
import { PrintJob } from '@prisma/client';
import { Clock, Play, CheckCircle2, AlertTriangle, Lock, FileText } from 'lucide-react';

interface QueueListProps {
  jobs: PrintJob[];
  currentUserId: string;
  onRefresh: () => void;
}

export default function QueueList({ jobs, currentUserId, onRefresh }: QueueListProps) {
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const handleRelease = async (jobId: string) => {
    if (!confirm('Apakah Anda sudah berada di depan printer Epson L6460 di ruang TU? Dokumen akan langsung dicetak.')) {
      return;
    }

    setReleasingId(jobId);
    try {
      const res = await fetch(`/api/jobs/release`, {
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Antre
          </span>
        );
      case 'PRINTING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Play className="w-3 h-3" /> Sedang Dicetak
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="w-3 h-3" /> Terkunci (Rahasia)
          </span>
        );
      case 'RELEASED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Play className="w-3 h-3" /> Siap Keluar (Prioritas)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3" /> Gagal
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center justify-between">
        <span>Antrean Berkas Anda</span>
        <button onClick={onRefresh} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
          Muat Ulang
        </button>
      </h2>

      {jobs.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada antrean cetak hari ini.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {jobs.map((job, idx) => (
            <div key={job.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                    {job.fileName}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>{job.physicalSheets} lembar</span>
                    <span>•</span>
                    <span>{job.isColor ? 'Warna' : 'Hitam-Putih'}</span>
                    <span>•</span>
                    <span>{job.isDuplex ? 'Bolak-balik' : '1 Sisi'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {getStatusBadge(job)}

                {job.status === 'LOCKED' && job.userId === currentUserId && (
                  <button
                    onClick={() => handleRelease(job.id)}
                    disabled={releasingId === job.id}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {releasingId === job.id ? 'Memproses...' : 'Rilis Sekarang'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
