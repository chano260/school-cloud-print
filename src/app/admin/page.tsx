'use client';

import React, { useState, useEffect } from 'react';
import PrinterStatusCard from '@/components/admin/PrinterStatusCard';
import WhitelistManager from '@/components/admin/WhitelistManager';
import QueueList from '@/components/QueueList';
import { InkLevels, PrinterStatus } from '@/types';
import {
  ArrowLeft,
  RefreshCw,
  Shield,
  Lock,
  LogOut,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [submittingPin, setSubmittingPin] = useState(false);

  const [status, setStatus] = useState<PrinterStatus>('READY');
  const [ink, setInk] = useState<InkLevels>({
    black: 90,
    cyan: 65,
    magenta: 70,
    yellow: 40,
    wasteBox: 15,
  });
  const [jobs, setJobs] = useState<any[]>([]);

  // Check admin auth state on load
  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(Boolean(data.isAdmin));
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [telRes, jobsRes] = await Promise.all([
        fetch('/api/printer/status'),
        fetch('/api/jobs/my'),
      ]);
      if (telRes.ok) {
        const data = await telRes.json();
        if (data.status) setStatus(data.status);
        if (data.ink) setInk(data.ink);
      }
      if (jobsRes.ok) {
        setJobs(await jobsRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
      const interval = setInterval(fetchAdminData, 8000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Silakan masukkan PIN Admin TU.');
      return;
    }

    setSubmittingPin(true);
    setPinError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN Admin TU salah.');
      }

      setIsAdmin(true);
      setPinInput('');
    } catch (err: any) {
      setPinError(err.message || 'Gagal masuk sebagai admin.');
    } finally {
      setSubmittingPin(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      setIsAdmin(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (isAdmin === null) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center animate-spin">
            <Shield className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500">Memverifikasi hak akses Admin TU...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 1: ADMIN LOGIN SCREEN (PROTECTION)
  // ==========================================
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-md mx-auto w-full pt-10 sm:pt-16">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center mb-4 shadow-md">
                <Lock className="w-6 h-6 text-teal-400" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Akses Terbatas: Admin TU
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Panel pengelolaan kuota guru dan status printer SMAN 3 Buru.
              </p>
            </div>

            {pinError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Masukkan PIN / Kata Sandi Admin TU:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    placeholder="PIN Admin (default: 123456)"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white tracking-widest font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  PIN standar: <span className="font-mono font-semibold">123456</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={submittingPin || !pinInput}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingPin ? 'Memverifikasi...' : 'Buka Panel Admin TU'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Portal Cetak Guru</span>
              </Link>
            </div>
          </div>
        </div>

        <footer className="text-center text-[11px] text-slate-400 py-4">
          SMAN 3 Buru • Ruang Tata Usaha (TU)
        </footer>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: FULL ADMIN TU DASHBOARD
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-700 transition-colors cursor-pointer border border-slate-200/80"
              aria-label="Kembali ke Portal Guru"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="font-bold text-xs sm:text-base text-slate-900 leading-tight">
                Panel Admin TU • SMAN 3 Buru
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Kelola Jatah Kuota Guru & Pantau Sensor Tinta Epson L6460
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAdminData}
              className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-600 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="h-8 px-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar TU</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-5">
        <PrinterStatusCard status={status} ink={ink} />
        <WhitelistManager />
        <QueueList jobs={jobs} currentUserId="" onRefresh={fetchAdminData} />
      </div>
    </main>
  );
}
