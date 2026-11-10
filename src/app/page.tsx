'use client';

import React, { useState, useEffect } from 'react';
import QuotaCard from '@/components/QuotaCard';
import UploadForm from '@/components/UploadForm';
import QueueList from '@/components/QueueList';
import { Printer, AlertOctagon, Shield, UserCheck, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function TeacherHomePage() {
  const [quota, setQuota] = useState({ dailyLimit: 20, usedToday: 0, remaining: 20 });
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string }>({
    id: '',
    name: 'Guru Demo (Belajar.id)',
    email: 'guru.demo@guru.smp.belajar.id',
  });
  const [jobs, setJobs] = useState<any[]>([]);
  const [printerStatus, setPrinterStatus] = useState<string>('READY');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [quotaRes, jobsRes, telemetryRes] = await Promise.all([
        fetch('/api/user/quota'),
        fetch('/api/jobs/my'),
        fetch('/api/printer/status'),
      ]);

      if (quotaRes.ok) {
        const qData = await quotaRes.json();
        setQuota({
          dailyLimit: qData.dailyLimit ?? 20,
          usedToday: qData.usedToday ?? 0,
          remaining: qData.remaining ?? 20,
        });
        if (qData.user) {
          setCurrentUser(qData.user);
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
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Gagal masuk.');
        return;
      }
      setShowLoginModal(false);
      setEmailInput('');
      fetchDashboardData();
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-background text-card-foreground pb-16">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Printer className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-bold text-base text-foreground leading-tight">
                School Cloud Print
              </h1>
              <p className="text-xs text-muted-foreground">
                Epson EcoTank L6460 • Ruang TU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Printer Live Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  printerStatus === 'READY'
                    ? 'bg-emerald-500'
                    : printerStatus === 'PRINTING'
                    ? 'bg-primary animate-pulse'
                    : printerStatus === 'OUT_OF_PAPER'
                    ? 'bg-destructive animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-semibold text-foreground">
                {printerStatus === 'READY'
                  ? 'Printer Siap'
                  : printerStatus === 'PRINTING'
                  ? 'Sedang Mencetak'
                  : printerStatus === 'OUT_OF_PAPER'
                  ? 'Kertas Habis!'
                  : 'Offline'}
              </span>
            </div>

            <Link
              href="/admin"
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-muted hover:bg-primary-soft text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">Panel TU</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Out of paper emergency banner */}
      {printerStatus === 'OUT_OF_PAPER' && (
        <div role="alert" className="bg-destructive text-white py-3 px-4 shadow-sm animate-pulse">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-semibold">
              Peringatan Darurat: Kertas printer di ruang TU habis! Antrean cetak dijeda otomatis hingga kertas diisi ulang.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Active Teacher Identity Bar */}
        <div className="bg-card rounded-2xl border border-border px-4 py-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-card">
          <div className="flex items-center gap-2.5 text-xs">
            <UserCheck className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground">Masuk sebagai:</span>
            <span className="font-bold text-foreground">{currentUser.name}</span>
            <span className="font-mono text-muted-foreground">({currentUser.email})</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLoginModal(!showLoginModal)}
            className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 cursor-pointer self-end sm:self-auto"
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            Ganti Akun Belajar.id
          </button>
        </div>

        {showLoginModal && (
          <form
            onSubmit={handleLoginSubmit}
            className="bg-card rounded-2xl border border-primary/30 p-4 mb-5 shadow-elevated"
          >
            <label htmlFor="belajar-email" className="block text-xs font-bold text-foreground uppercase mb-2">
              Masukkan Email Resmi Guru (@guru.*.belajar.id)
            </label>
            {authError && (
              <p className="text-xs text-destructive font-medium mb-2">{authError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="belajar-email"
                type="email"
                required
                placeholder="nama.guru@guru.smp.belajar.id"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                type="submit"
                className="min-h-[42px] px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Verifikasi Whitelist
              </button>
            </div>
          </form>
        )}

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
