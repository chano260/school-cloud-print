'use client';

import React, { useState, useEffect } from 'react';
import PrinterStatusCard from '@/components/admin/PrinterStatusCard';
import WhitelistManager from '@/components/admin/WhitelistManager';
import { InkLevels, PrinterStatus } from '@/types';
import { Printer, Shield, ArrowLeft } from 'lucide-react';
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

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/printer/status');
      if (res.ok) {
        const data = await res.json();
        if (data.status) setStatus(data.status);
        if (data.ink) setInk(data.ink);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-800 leading-tight">Panel Administrasi TU</h1>
              <p className="text-xs text-slate-400">Manajemen Kuota & Pemantau Printer Epson</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <PrinterStatusCard status={status} ink={ink} />
        <WhitelistManager />
      </div>
    </main>
  );
}
