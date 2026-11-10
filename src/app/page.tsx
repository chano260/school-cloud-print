'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QuotaCard from '@/components/QuotaCard';
import UploadForm from '@/components/UploadForm';
import QueueList from '@/components/QueueList';
import {
  Printer,
  AlertOctagon,
  Shield,
  Search,
  Check,
  User,
  LogOut,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface TeacherOption {
  id: string;
  name: string;
  email: string;
  dailyQuotaOverride: number | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function TeacherHomePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [quota, setQuota] = useState({ dailyLimit: 20, usedToday: 0, remaining: 20 });
  const [jobs, setJobs] = useState<any[]>([]);
  const [printerStatus, setPrinterStatus] = useState<string>('READY');

  const fetchSessionAndTeachers = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
        if (data.teachers) {
          setTeachers(data.teachers);
        }
      }
    } catch (e) {
      console.error('Failed to load session/teachers', e);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [quotaRes, jobsRes, telemetryRes] = await Promise.all([
        fetch('/api/user/quota'),
        fetch('/api/jobs/my'),
        fetch('/api/printer/status'),
      ]);

      if (quotaRes.ok) {
        const qData = await quotaRes.json();
        if (qData.authenticated && qData.user) {
          setCurrentUser(qData.user);
          setQuota({
            dailyLimit: qData.dailyLimit ?? 20,
            usedToday: qData.usedToday ?? 0,
            remaining: qData.remaining ?? 20,
          });
        } else {
          setCurrentUser(null);
        }
      }

      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (telemetryRes.ok) {
        const tel = await telemetryRes.json();
        setPrinterStatus(tel.status || 'READY');
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  useEffect(() => {
    fetchSessionAndTeachers();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => t.name.toLowerCase().includes(q));
  }, [teachers, searchQuery]);

  const handleLoginAsTeacher = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTeacherId) {
      setLoginError('Silakan ketuk salah satu nama guru di bawah terlebih dahulu.');
      return;
    }

    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedTeacherId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk akun guru.');
      }

      setCurrentUser(data.user);
      fetchDashboardData();
    } catch (err: any) {
      setLoginError(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setCurrentUser(null);
      setSelectedTeacherId('');
      fetchSessionAndTeachers();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const PrinterBadge = () => (
    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200">
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          printerStatus === 'READY'
            ? 'bg-emerald-500 shadow-sm'
            : printerStatus === 'PRINTING'
            ? 'bg-teal-600 animate-pulse'
            : printerStatus === 'OUT_OF_PAPER'
            ? 'bg-rose-500 animate-ping'
            : 'bg-slate-400'
        }`}
      />
      <span className="text-sm font-semibold text-slate-700">
        {printerStatus === 'READY'
          ? 'Printer Siap'
          : printerStatus === 'PRINTING'
          ? 'Sedang Mencetak'
          : printerStatus === 'OUT_OF_PAPER'
          ? 'Kertas Habis'
          : 'Printer Offline'}
      </span>
    </div>
  );

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center animate-spin shadow-md">
            <Printer className="w-6 h-6" />
          </div>
          <p className="text-base font-medium text-slate-600">Memuat Portal Cloud Print SMAN 3 Buru...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 1: DEDICATED TEACHER LOGIN VIEW
  // ==========================================
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100 text-slate-900 pb-16 flex flex-col justify-between">
        {/* Top Navbar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-10 shadow-xs">
          <div className="max-w-xl mx-auto px-5 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center shadow-md">
                <Printer className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                  Cloud Print SMAN 3 Buru
                </h1>
                <p className="text-xs sm:text-sm text-emerald-700 font-medium">Epson EcoTank L6460 • Ruang TU</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <PrinterBadge />
              <Link
                href="/admin"
                className="h-10 px-3.5 rounded-xl border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-200 text-sm font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Shield className="w-4 h-4 text-emerald-700" />
                <span className="hidden sm:inline">Admin TU</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Center Login Box */}
        <div className="max-w-xl mx-auto px-4 pt-6 sm:pt-10 w-full">
          <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-xl shadow-emerald-950/5 p-6 sm:p-9">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center mb-4 shadow-xs">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pilih Nama Guru
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Cari dan klik nama Bapak/Ibu guru di bawah untuk langsung membuka dashboard cetak mandiri.
              </p>
            </div>

            {loginError && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Pencarian Nama Guru */}
            <div className="relative mb-4">
              <Search className="w-5 h-5 text-emerald-600/60 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik nama Anda di sini..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-emerald-50/30 border border-slate-300 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* List Pilihan Guru */}
            <div className="max-h-72 overflow-y-auto divide-y divide-emerald-100/60 rounded-2xl border border-slate-200 bg-emerald-50/20 mb-6">
              {filteredTeachers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-base font-bold text-slate-700 mb-1">Nama Tidak Ditemukan</p>
                  <p className="text-sm">Silakan hubungi staf Tata Usaha (TU) untuk mendaftarkan nama Anda.</p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isSelected = selectedTeacherId === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => setSelectedTeacherId(teacher.id)}
                      className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-100/70 text-emerald-950 font-bold ring-2 ring-inset ring-emerald-600'
                          : 'hover:bg-white text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base font-extrabold shadow-xs ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-100/70 text-emerald-800'
                          }`}
                        >
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-base sm:text-lg">{teacher.name}</span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-semibold px-3 py-1 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-mono">
                          {teacher.dailyQuotaOverride || 20} lbr / hari
                        </span>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Tombol Masuk */}
            <button
              type="button"
              onClick={handleLoginAsTeacher}
              disabled={!selectedTeacherId || loggingIn}
              className="w-full h-14 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold rounded-2xl transition-all shadow-md hover:shadow-lg hover:shadow-emerald-900/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{loggingIn ? 'Sedang Membuka Dashboard...' : 'Masuk ke Dashboard Cetak'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Info Kemudahan untuk Guru */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-sm text-amber-900 leading-relaxed">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Petunjuk:</strong> Bapak/Ibu Guru tidak perlu mengingat email atau password. Cukup pilih nama di atas, lalu dokumen siap dikirim ke printer Epson TU.
              </p>
            </div>
          </div>

          {/* Link ke Admin TU */}
          <div className="text-center mt-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-4 rounded-xl hover:bg-white border border-transparent hover:border-slate-200"
            >
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Login sebagai Petugas / Admin Tata Usaha (TU)</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs sm:text-sm text-slate-500 py-6 mt-10 border-t border-slate-200">
          SMAN 3 Buru • Sistem Cetak Cloud Mandiri Ruang TU
        </footer>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED DASHBOARD VIEW
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-20 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center shadow-md">
              <Printer className="w-5 h-5 text-emerald-300" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Cloud Print SMAN 3 Buru
              </h1>
              <p className="text-xs sm:text-sm text-emerald-700 font-medium">Epson EcoTank L6460 • Ruang TU</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <PrinterBadge />

            {/* Logout / Switch Account Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar / Ganti Akun Guru"
              className="h-10 px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-sm font-bold text-rose-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Out of paper emergency banner */}
      {printerStatus === 'OUT_OF_PAPER' && (
        <div role="alert" className="bg-rose-600 text-white py-3.5 px-4 shadow-md">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm sm:text-base font-bold">
              Kertas printer di ruang TU sedang habis. Antrean dijeda otomatis sampai kertas diisi oleh staf TU.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Guru Banner Card */}
        <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-md shadow-emerald-950/5 p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-extrabold text-xl flex-shrink-0 shadow-sm">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                Akun Guru Aktif
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                {currentUser.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="h-11 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-sm font-bold text-emerald-800 border border-emerald-200 inline-flex items-center gap-2 transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Ganti Guru</span>
          </button>
        </div>

        <QuotaCard
          dailyLimit={quota.dailyLimit}
          usedToday={quota.usedToday}
          remaining={quota.remaining}
        />

        <UploadForm
          remainingQuota={quota.remaining}
          onUploadSuccess={fetchDashboardData}
        />

        <QueueList
          jobs={jobs}
          currentUserId={currentUser.id}
          onRefresh={fetchDashboardData}
        />
      </div>
    </main>
  );
}
