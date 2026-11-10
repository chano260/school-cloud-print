'use client';

import React, { useState, useEffect } from 'react';
import PrinterStatusCard from '@/components/admin/PrinterStatusCard';
import WhitelistManager from '@/components/admin/WhitelistManager';
import QueueList from '@/components/QueueList';
import { InkLevels, PrinterStatus } from '@/types';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<PrinterStatus>('READY');
  const [ink, setInk] = useState<InkLevels>({
    black: 90,
    cyan: 65,
    magenta: 70,
    yellow: 40,
    wasteBox: 15,
  });
  const [jobs, setJobs] = useState<any[]>([]);

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
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, []);

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
              <h1 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                Panel Admin TU • SMAN 3 Buru
              </h1>
              <p className="text-xs text-slate-400">
                Kelola Daftar Nama Guru & Pantau Tinta Printer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAdminData}
            className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-600 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Segarkan
          </button>
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
