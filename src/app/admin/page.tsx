'use client';

import React, { useState, useEffect } from 'react';
import PrinterStatusCard from '@/components/admin/PrinterStatusCard';
import WhitelistManager from '@/components/admin/WhitelistManager';
import AdminFileList from '@/components/admin/AdminFileList';
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
  FileText,
  Users,
  Printer,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [submittingPin, setSubmittingPin] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'whitelist' | 'printer'>('files');

  const [status, setStatus] = useState<PrinterStatus>('READY');
  const [ink, setInk] = useState<InkLevels>({
    black: 90,
    cyan: 65,
    magenta: 70,
    yellow: 40,
    wasteBox: 15,
  });
  const [jobs, setJobs] = useState<any[]>([]);

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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center animate-spin">
            <Shield className="w-5 h-5 text-emerald-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Memverifikasi hak akses Admin TU...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 1: ADMIN LOGIN SCREEN (PROTECTED)
  // ==========================================
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-md mx-auto w-full pt-10 sm:pt-20">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-7 sm:p-9">
            <div className="text-center mb-7">
              <div className="w-16 h-16 rounded-3xl bg-emerald-900 text-white mx-auto flex items-center justify-center mb-4 shadow-lg">
                <Lock className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Akses Terbatas: Admin TU
              </h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Panel khusus petugas Tata Usaha untuk mengelola berkas cetak, kuota guru, dan sensor tinta printer.
              </p>
            </div>

            {pinError && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Masukkan PIN Admin TU:
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    placeholder="PIN Admin (default: 123456)"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-300 text-base focus:outline-none focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white tracking-widest font-mono font-bold"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  PIN standar bawaan: <span className="font-mono font-bold text-slate-600">123456</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={submittingPin || !pinInput}
                className="w-full h-14 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingPin ? 'Memverifikasi...' : 'Buka Panel Admin TU'}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-slate-100 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Portal Cetak Guru</span>
              </Link>
            </div>
          </div>
        </div>

        <footer className="text-center text-xs sm:text-sm text-slate-400 py-6">
          SMAN 3 Buru • Ruang Tata Usaha (TU)
        </footer>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: FULL ADMIN TU DASHBOARD
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white/95 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-700 transition-colors cursor-pointer border border-slate-200"
              aria-label="Kembali ke Portal Guru"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Panel Admin TU • SMAN 3 Buru
              </h1>
              <p className="text-xs sm:text-sm text-emerald-700 font-medium">
                Arsip Berkas Cetak, Pengaturan Kuota & Sensor Epson L6460
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchAdminData}
              className="h-10 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-sm font-bold text-slate-700 inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="h-10 px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-sm font-bold text-rose-700 inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar TU</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`h-11 px-5 rounded-2xl text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'files'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Semua Berkas Cetak Guru</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whitelist')}
            className={`h-11 px-5 rounded-2xl text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'whitelist'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Guru & Kuota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('printer')}
            className={`h-11 px-5 rounded-2xl text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'printer'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Status Printer & Tinta</span>
          </button>
        </div>

        {/* Tab 1: Berkas Cetak Guru */}
        {activeTab === 'files' && (
          <div>
            <AdminFileList />
          </div>
        )}

        {/* Tab 2: Daftar Guru & Kuota */}
        {activeTab === 'whitelist' && (
          <div>
            <WhitelistManager />
          </div>
        )}

        {/* Tab 3: Status Printer & Sensor Tinta */}
        {activeTab === 'printer' && (
          <div className="space-y-6">
            <PrinterStatusCard status={status} ink={ink} />
            <QueueList jobs={jobs} currentUserId="" onRefresh={fetchAdminData} />
          </div>
        )}
      </div>
    </main>
  );
}
