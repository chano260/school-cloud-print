'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RotateCcw,
  Play,
  CheckCircle2,
  Clock,
  Lock,
  AlertTriangle,
  RefreshCw,
  User,
  Layers,
  Calendar,
} from 'lucide-react';

interface PrintJobRecord {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  pageCount: number;
  physicalSheets: number;
  copies: number;
  isColor: boolean;
  isDuplex: boolean;
  isLocked: boolean;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  _count: {
    printJobs: number;
  };
}

export default function AdminFileList() {
  const [jobs, setJobs] = useState<PrintJobRecord[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setUsers(data.usersWithJobs || []);
      }
    } catch (e) {
      console.error('Failed to load admin jobs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminJobs();
  }, []);

  // Filter jobs by user, status, and search query
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // User filter
      if (selectedUser !== 'ALL' && job.userId !== selectedUser) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && job.status !== selectedStatus) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFile = job.fileName.toLowerCase().includes(q);
        const matchName = job.user?.name?.toLowerCase().includes(q);
        if (!matchFile && !matchName) return false;
      }
      return true;
    });
  }, [jobs, selectedUser, selectedStatus, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const totalSheets = jobs.reduce((acc, j) => acc + (j.physicalSheets || 0), 0);
    const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length;
    const pendingJobs = jobs.filter((j) => j.status === 'QUEUED' || j.status === 'LOCKED').length;
    return { totalJobs, totalSheets, completedJobs, pendingJobs };
  }, [jobs]);

  // Handle Reprint
  const handleReprint = async (jobId: string, fileName: string) => {
    if (!confirm(`Kirim ulang dokumen "${fileName}" ke antrean printer TU?`)) {
      return;
    }

    setActionLoadingId(jobId);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/jobs/reprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim ulang dokumen.');

      setFeedbackMsg({
        type: 'success',
        text: `Dokumen "${fileName}" berhasil dimasukkan kembali ke antrean cetak!`,
      });
      fetchAdminJobs();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Manual Release for Locked Job
  const handleAdminRelease = async (jobId: string, fileName: string) => {
    if (!confirm(`Rilis dokumen rahasia "${fileName}" sekarang agar langsung dicetak di printer TU?`)) {
      return;
    }

    setActionLoadingId(jobId);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/jobs/reprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal merilis dokumen.');

      setFeedbackMsg({
        type: 'success',
        text: `Dokumen "${fileName}" berhasil dirilis ke antrean printer!`,
      });
      fetchAdminJobs();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" /> Antre
          </span>
        );
      case 'PRINTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 animate-pulse">
            <Play className="w-3.5 h-3.5 fill-current" /> Mencetak...
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <Lock className="w-3.5 h-3.5" /> Terkunci
          </span>
        );
      case 'RELEASED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <Play className="w-3.5 h-3.5 fill-current" /> Prioritas
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 mb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-6 h-6 text-emerald-700" />
            <span>Semua Berkas Cetak Guru</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pantau seluruh file yang dikirim setiap guru, buka/unduh berkas fisik, dan kirim cetak ulang.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminJobs}
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-sm font-bold text-slate-700 inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          role="status"
          className={`mb-5 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Berkas</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
            {stats.totalJobs}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Lembar Fisik</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
            {stats.totalSheets} <span className="text-sm font-normal text-slate-500">lbr</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tercetak Sukses</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1 font-mono">
            {stats.completedJobs}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Antre / Kunci</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-1 font-mono">
            {stats.pendingJobs}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        {/* Filter Guru */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span>Pilih Nama Guru:</span>
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Guru ({jobs.length} berkas)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email} ({u._count.printJobs} berkas)
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="w-full sm:w-48">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span>Status:</span>
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="QUEUED">Antre (QUEUED)</option>
            <option value="COMPLETED">Selesai (COMPLETED)</option>
            <option value="LOCKED">Terkunci (LOCKED)</option>
            <option value="PRINTING">Sedang Cetak (PRINTING)</option>
            <option value="FAILED">Gagal (FAILED)</option>
          </select>
        </div>

        {/* Pencarian Nama File / Guru */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cari Dokumen / Nama:</span>
          </label>
          <input
            type="text"
            placeholder="Ketik nama file atau nama guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Files Table List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-700" />
          <p className="text-base font-bold text-slate-600">Tidak ada berkas yang sesuai filter.</p>
          <p className="text-sm mt-1">Coba ubah pilihan guru atau kata kunci pencarian di atas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Guru</th>
                <th className="py-3.5 px-4">Nama Dokumen</th>
                <th className="py-3.5 px-4">Detail Kertas</th>
                <th className="py-3.5 px-4">Waktu Kirim</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => {
                const date = new Date(job.createdAt);
                const formattedTime = date.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const isActing = actionLoadingId === job.id;

                return (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nama Guru */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {job.user?.name ? job.user.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {job.user?.name || 'Guru'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{job.user?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Nama Dokumen & Ukuran */}
                    <td className="py-3.5 px-4">
                      <a
                        href={`/api/agent/files/${job.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline inline-flex items-center gap-1.5 max-w-xs truncate"
                        title="Klik untuk membuka / mengunduh file ini"
                      >
                        <FileText className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span className="truncate">{job.fileName}</span>
                      </a>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(job.fileSize / (1024 * 1024)).toFixed(2)} MB • {job.pageCount} Hal Asli
                      </p>
                    </td>

                    {/* Detail Cetak */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800">
                        {job.physicalSheets} Lembar
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>{job.copies}x rangkap</span>
                        <span>•</span>
                        <span>{job.isColor ? 'Warna' : 'B&W'}</span>
                        <span>•</span>
                        <span>{job.isDuplex ? '2 Sisi' : '1 Sisi'}</span>
                      </div>
                    </td>

                    {/* Waktu Kirim */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {formattedTime} WIT
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(job.status)}
                    </td>

                    {/* Aksi Admin: Unduh, Cetak Ulang, Rilis */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Tombol Unduh / Buka File */}
                        <a
                          href={`/api/agent/files/${job.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-xs"
                          title="Buka / Unduh Berkas Asli"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </a>

                        {/* Tombol Rilis Jika Dokumen Terkunci */}
                        {job.status === 'LOCKED' && (
                          <button
                            type="button"
                            onClick={() => handleAdminRelease(job.id, job.fileName)}
                            disabled={isActing}
                            className="h-9 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                            title="Rilis dokumen rahasia ini agar langsung dicetak"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isActing ? 'Memproses...' : 'Rilis TU'}</span>
                          </button>
                        )}

                        {/* Tombol Cetak Ulang */}
                        <button
                          type="button"
                          onClick={() => handleReprint(job.id, job.fileName)}
                          disabled={isActing}
                          className="h-9 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          title="Kirim ulang dokumen ini ke antrean printer TU"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isActing ? 'Mengirim...' : 'Cetak Ulang'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
