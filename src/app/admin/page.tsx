'use client';

import React, { useState, useEffect } from 'react';
import PrinterStatusCard from '@/components/admin/PrinterStatusCard';
import WhitelistManager from '@/components/admin/WhitelistManager';
import QueueList from '@/components/QueueList';
import { InkLevels, PrinterStatus } from '@/types';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
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
    <main className="min-h-screen bg-background text-card-foreground pb-16">
      <header className="bg-card/95 backdrop-blur border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center hover:bg-primary-soft rounded-xl text-foreground transition-colors cursor-pointer"
              aria-label="Kembali ke Portal Guru"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-foreground text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-bold text-base text-foreground leading-tight">
                Panel Administrasi TU
              </h1>
              <p className="text-xs text-muted-foreground">
                Manajemen Whitelist Pegawai & Telemetri Epson L6460
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAdminData}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-border hover:bg-background text-xs font-semibold text-primary inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Segarkan
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <PrinterStatusCard status={status} ink={ink} />
        <WhitelistManager />
        <QueueList jobs={jobs} currentUserId="" onRefresh={fetchAdminData} />
      </div>
    </main>
  );
}
