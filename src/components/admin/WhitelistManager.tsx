'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Users, Plus, Check, AlertCircle, Trash2, ShieldCheck } from 'lucide-react';

interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  dailyQuotaOverride: number | null;
  isAdmin: boolean;
  isActive: boolean;
}

export default function WhitelistManager() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [quotaInput, setQuotaInput] = useState(20);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/whitelist');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch {
      // Ignore during SSR/test
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleUploadExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/whitelist/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor berkas Excel.');

      setStatusMsg({
        type: 'success',
        text: `Berhasil mengimpor! ${data.imported} pegawai ditambahkan, ${data.updated} pegawai diperbarui.`,
      });
      setFile(null);
      fetchEmployees();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput || !emailInput) return;

    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          email: emailInput,
          dailyQuota: quotaInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan pegawai.');

      setNameInput('');
      setEmailInput('');
      setQuotaInput(20);
      setStatusMsg({ type: 'success', text: 'Pegawai berhasil disimpan ke daftar whitelist.' });
      fetchEmployees();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleRemove = async (id: string) => {
    await fetch('/api/admin/whitelist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchEmployees();
  };

  return (
    <section
      aria-label="Manajemen Whitelist Pegawai"
      className="bg-card rounded-2xl shadow-card border border-border p-5 sm:p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" aria-hidden="true" />
            Daftar Putih Pegawai (Whitelist Guru Belajar.id)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hanya pegawai di daftar ini yang dapat masuk dengan akun Belajar.id dan mencetak dokumen.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          role="status"
          className={`mb-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-primary-soft/70 border border-teal-300 text-foreground'
              : 'bg-red-50 border border-red-200 text-destructive'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Upload Excel Box */}
      <form onSubmit={handleUploadExcel} className="flex flex-col sm:flex-row items-center gap-3 mb-5">
        <label className="w-full sm:flex-1 cursor-pointer">
          <div className="min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 border border-slate-200 rounded-xl hover:border-primary bg-background/50 transition-colors text-sm text-card-foreground">
            <Upload className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="truncate">
              {file ? file.name : 'Pilih Berkas Excel (.xlsx, .csv) Daftar Guru'}
            </span>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-slate-200 text-primary-foreground text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          {uploading ? 'Mengimpor...' : 'Impor Excel Pegawai'}
        </button>
      </form>

      {/* Quick Manual Add Employee Form */}
      <form
        onSubmit={handleAddSingle}
        className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-xl bg-muted/60 border border-slate-200/80 mb-5"
      >
        <div className="sm:col-span-4">
          <input
            type="text"
            placeholder="Nama Lengkap Guru"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div className="sm:col-span-5">
          <input
            type="email"
            placeholder="budi@guru.smp.belajar.id"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div className="sm:col-span-1">
          <input
            type="number"
            min="1"
            max="500"
            title="Kuota Harian"
            value={quotaInput}
            onChange={(e) => setQuotaInput(parseInt(e.target.value, 10) || 20)}
            className="w-full min-h-[42px] px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-sm font-mono text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full min-h-[42px] px-3 py-2 bg-secondary hover:bg-primary text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tambah
          </button>
        </div>
      </form>

      {/* Registered Employees List */}
      {employees.length > 0 && (
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted text-muted-foreground uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3.5">Nama Pegawai</th>
                <th className="py-2.5 px-3.5">Email Belajar.id</th>
                <th className="py-2.5 px-3.5">Kuota Harian</th>
                <th className="py-2.5 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-background/40">
                  <td className="py-2.5 px-3.5 font-semibold text-card-foreground flex items-center gap-1.5">
                    {emp.name}
                    {emp.isAdmin && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary-soft text-primary rounded text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Admin
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-muted-foreground">{emp.email}</td>
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-foreground">
                    {emp.dailyQuotaOverride || 20} lembar
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(emp.id)}
                      className="p-1.5 text-slate-400 hover:text-destructive rounded-lg cursor-pointer"
                      aria-label={`Hapus ${emp.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-3">
        Format kolom Excel: <code className="font-mono">Nama</code>,{' '}
        <code className="font-mono">Email</code> (contoh:{' '}
        <code className="font-mono">budi@guru.smp.belajar.id</code>),{' '}
        <code className="font-mono">Kuota</code> (opsional, default 20).
      </p>
    </section>
  );
}
