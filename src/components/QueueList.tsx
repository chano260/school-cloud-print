'use client';

import React, { useState } from 'react';
import { PrintJob } from '@prisma/client';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  FileText,
  RefreshCw,
  RotateCcw,
  Download,
} from 'lucide-react';

interface QueueListProps {
  jobs: (PrintJob & { user?: { name?: string | null; email?: string | null } })[];
  currentUserId: string;
  onRefresh: () => void;
}

export default function QueueList({ jobs, currentUserId, onRefresh }: QueueListProps) {
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [reprintingId, setReprintingId] = useState<string | null>(null);

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

  const handleReprint = async (jobId: string) => {
    if (!confirm('Kirim ulang dokumen ini ke antrean printer TU untuk dicetak kembali?')) {
      return;
    }

    setReprintingId(jobId);
    try {
      const res = await fetch('/api/jobs/reprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal mengirim ulang dokumen.');
      } else {
        onRefresh();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReprintingId(null);
    }
  };

  const getStatusBadge = (job: PrintJob) => {
    switch (job.status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Antre
          </span>
        );
      case 'PRINTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse">
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> Mencetak...
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Terkunci
          </span>
        );
      case 'RELEASED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> Prioritas Rilis
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> {job.status}
          </span>
        );
    }
  };

  return (
    <section
      aria-label="Daftar Antrean Cetak"
      className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-extrabold text-slate-900">Antrean Cetak Hari Ini</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="h-10 px-3.5 rounded-xl hover:bg-slate-100 text-sm text-slate-600 hover:text-slate-900 font-bold inline-flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Segarkan</span>
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" aria-hidden="true" />
          <p className="text-base font-semibold text-slate-600">Belum ada dokumen dalam antrean hari ini.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {jobs.map((job, idx) => (
            <div
              key={job.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-extrabold font-mono tabular-nums flex-shrink-0 mt-0.5 border border-slate-200">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {job.fileName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    {job.user?.name && (
                      <>
                        <span className="font-bold text-slate-700">{job.user.name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="font-mono font-bold text-slate-800">{job.physicalSheets} lbr</span>
                    <span>•</span>
                    <span>{job.copies}x rangkap</span>
                    <span>•</span>
                    <span>{job.isColor ? 'Warna' : 'B&W'}</span>
                    <span>•</span>
                    <span>{job.isDuplex ? 'Bolak-balik' : '1 Sisi'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                {getStatusBadge(job)}

                {/* Buka/Unduh Berkas */}
                <a
                  href={`/api/agent/files/${job.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-sm font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  title="Lihat / Unduh Dokumen Asli"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">File</span>
                </a>

                {/* Tombol Rilis Jika Terkunci */}
                {job.status === 'LOCKED' &&
                  (!currentUserId || job.userId === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => handleRelease(job.id)}
                      disabled={releasingId === job.id}
                      className="h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>{releasingId === job.id ? 'Merilis...' : 'Rilis Sekarang'}</span>
                    </button>
                  )}

                {/* Tombol Cetak Ulang untuk Dokumen Selesai / Gagal */}
                {(job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'EXPIRED') &&
                  (!currentUserId || job.userId === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => handleReprint(job.id)}
                      disabled={reprintingId === job.id}
                      className="h-10 px-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Kirim ulang dokumen ini ke antrean printer TU"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{reprintingId === job.id ? 'Mengirim...' : 'Cetak Ulang'}</span>
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
