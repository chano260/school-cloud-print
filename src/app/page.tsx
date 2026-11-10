'use client';

import React, { useState, useEffect } from 'react';
import QuotaCard from '@/components/QuotaCard';
import UploadForm from '@/components/UploadForm';
import QueueList from '@/components/QueueList';
import { Printer, AlertOctagon, RefreshCw } from 'lucide-react';

export default function TeacherHomePage() {
  const [quota, setQuota] = useState({ dailyLimit: 20, usedToday: 0, remaining: 20 });
  const [jobs, setJobs] = useState<any[]>([]);
  const [printerStatus, setPrinterStatus] = useState<string>('READY');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [quotaRes, jobsRes, telemetryRes] = await Promise.all([
        fetch('/api/user/quota'),
        fetch('/api/jobs/my'),
        fetch('/api/printer/status'),
      ]);

      if (quotaRes.ok) setQuota(await quotaRes.json());
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (telemetryRes.ok) {
        const tel = await telemetryRes.json();
        setPrinterStatus(tel.status || 'READY');
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-800 leading-tight">School Cloud Print</h1>
              <p className="text-xs text-slate-400">Epson EcoTank L6460 • Ruang TU</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                printerStatus === 'READY'
                  ? 'bg-emerald-500'
                  : printerStatus === 'OUT_OF_PAPER'
                  ? 'bg-red-500 animate-ping'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-medium text-slate-600">
              {printerStatus === 'READY'
                ? 'Printer Siap'
                : printerStatus === 'OUT_OF_PAPER'
                ? 'Kertas Habis!'
                : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Out of paper banner */}
      {printerStatus === 'OUT_OF_PAPER' && (
        <div className="bg-red-600 text-white py-3 px-4 shadow-sm animate-pulse">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">
              Peringatan: Kertas printer di ruang TU habis! Antrean cetak dijeda sementara hingga kertas diisi ulang.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
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
          currentUserId="current-teacher-id"
          onRefresh={fetchDashboardData}
        />
      </div>
    </main>
  );
}
