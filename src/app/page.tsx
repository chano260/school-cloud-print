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
  Sparkles,
  Info,
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

  // Poll printer telemetry & queue when dashboard is active
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
      setLoginError('Silakan pilih salah satu nama guru di bawah terlebih dahulu.');
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

  // Status Indicator Badge Component
  const PrinterBadge = () => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80">
      <span
        className={`w-2 h-2 rounded-full ${
          printerStatus === 'READY'
            ? 'bg-emerald-500'
            : printerStatus === 'PRINTING'
            ? 'bg-teal-600 animate-pulse'
            : printerStatus === 'OUT_OF_PAPER'
            ? 'bg-rose-500 animate-ping'
            : 'bg-slate-400'
        }`}
      />
      <span className="text-xs font-medium text-slate-700">
        {printerStatus === 'READY'
          ? 'Siap'
          : printerStatus === 'PRINTING'
          ? 'Mencetak'
          : printerStatus === 'OUT_OF_PAPER'
          ? 'Kertas Habis'
          : 'Offline'}
      </span>
    </div>
  );

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center animate-spin">
            <Printer className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">Memuat Cloud Print SMAN 3 Buru...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 1: DEDICATED TEACHER LOGIN VIEW
  // ==========================================
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100/80 to-slate-50 text-slate-900 pb-12 flex flex-col justify-between">
        {/* Simple Navbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-10">
          <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  Cloud Print SMAN 3 Buru
                </h1>
                <p className="text-[11px] text-slate-400">Epson EcoTank L6460 • Ruang TU</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PrinterBadge />
              <Link
                href="/admin"
                className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-600 inline-flex items-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Admin TU</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Center Login Box */}
        <div className="max-w-xl mx-auto px-4 pt-6 sm:pt-8 w-full">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 sm:p-7">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 mx-auto flex items-center justify-center mb-3 shadow-inner">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Pilih Nama Guru untuk Masuk
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Cari nama Anda yang telah terdaftar di bawah untuk membuka dashboard cetak dokumen mandiri.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Pencarian Nama Guru */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik nama Anda untuk mencari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            {/* List Pilihan Guru */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/50 mb-5">
              {filteredTeachers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <p className="font-medium text-slate-600 mb-1">Nama tidak ditemukan</p>
                  <p>Minta petugas Tata Usaha (TU) untuk menambahkan nama Anda ke daftar guru.</p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isSelected = selectedTeacherId === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => setSelectedTeacherId(teacher.id)}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 text-teal-900 font-semibold ring-1 ring-inset ring-teal-500'
                          : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{teacher.name}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/70 text-slate-500">
                          Kuota {teacher.dailyQuotaOverride || 20} lbr
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
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
              className="w-full h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loggingIn ? 'Sedang Masuk...' : 'Masuk ke Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Info Bantuan untuk Guru */}
            <div className="mt-5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                Bapak/Ibu Guru tidak perlu memasukkan email atau kata sandi. Cukup pilih nama Bapak/Ibu pada daftar di atas untuk langsung mencetak dokumen.
              </p>
            </div>
          </div>

          {/* Link ke Admin TU */}
          <div className="text-center mt-5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Login sebagai Petugas / Admin Tata Usaha (TU)</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-400 py-4 mt-8 border-t border-slate-200/60">
          SMAN 3 Buru • Sistem Cetak Cloud Mandiri Ruang TU
        </footer>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED DASHBOARD VIEW
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Printer className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-bold text-xs sm:text-base text-slate-900 leading-tight">
                Cloud Print SMAN 3 Buru
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400">Epson EcoTank L6460 • Ruang TU</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PrinterBadge />

            {/* Logout / Switch Account Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar / Ganti Akun Guru"
              className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-medium text-slate-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Out of paper emergency banner */}
      {printerStatus === 'OUT_OF_PAPER' && (
        <div role="alert" className="bg-rose-600 text-white py-2.5 px-4 shadow-sm">
          <div className="max-w-2xl mx-auto flex items-center gap-2.5">
            <AlertOctagon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs sm:text-sm font-medium">
              Kertas printer di ruang TU sedang habis. Antrean dijeda otomatis sampai kertas diisi.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Guru Banner Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Masuk sebagai Guru
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {currentUser.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Ganti Akun</span>
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
