'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QuotaCard from '@/components/QuotaCard';
import UploadForm from '@/components/UploadForm';
import QueueList from '@/components/QueueList';
import { Printer, AlertOctagon, Shield, Search, ChevronDown, Check, User } from 'lucide-react';
import Link from 'next/link';

interface TeacherOption {
  id: string;
  name: string;
  email: string;
  dailyQuotaOverride: number | null;
}

export default function TeacherHomePage() {
  const [quota, setQuota] = useState({ dailyLimit: 20, usedToday: 0, remaining: 20 });
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string }>({
    id: '',
    name: 'Pilih Nama Guru',
    email: '',
  });
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [printerStatus, setPrinterStatus] = useState<string>('READY');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [quotaRes, jobsRes, telemetryRes, authRes] = await Promise.all([
        fetch('/api/user/quota'),
        fetch('/api/jobs/my'),
        fetch('/api/printer/status'),
        fetch('/api/auth/session'),
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
      if (authRes.ok) {
        const aData = await authRes.json();
        if (aData.teachers) {
          setTeachers(aData.teachers);
        }
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

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => t.name.toLowerCase().includes(q));
  }, [teachers, searchQuery]);

  const handleSelectTeacher = async (teacher: TeacherOption) => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: teacher.id }),
      });
      if (res.ok) {
        setPickerOpen(false);
        setSearchQuery('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Minimalist Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Printer className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                Cloud Print SMAN 3 Buru
              </h1>
              <p className="text-xs text-slate-400">Epson EcoTank L6460 • Ruang TU</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/70">
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

            <Link
              href="/admin"
              className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Admin TU</span>
            </Link>
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
        {/* Searchable Teacher Name Selector Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Nama Guru Pencetak
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {currentUser.name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPickerOpen(!pickerOpen)}
              className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors flex-shrink-0"
            >
              <span>{pickerOpen ? 'Tutup' : 'Ganti Nama Guru'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Dropdown Cari Nama Guru */}
          {pickerOpen && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="relative mb-2.5">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Ketik nama Anda untuk mencari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
                {filteredTeachers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Nama tidak ditemukan. Minta Admin TU menambahkan nama Anda di menu Admin TU.
                  </p>
                ) : (
                  filteredTeachers.map((t) => {
                    const isSelected = t.email === currentUser.email;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTeacher(t)}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-sm transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/80 text-teal-900 font-semibold'
                            : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] font-mono text-slate-400">
                            Kuota {t.dailyQuotaOverride || 20} lbr
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
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
