'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Users, Plus, Check, AlertCircle, Trash2 } from 'lucide-react';

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
        text: `Berhasil mengimpor! ${data.imported} guru ditambahkan, ${data.updated} diperbarui.`,
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
    if (!nameInput.trim()) return;

    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          dailyQuota: quotaInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan guru.');

      setNameInput('');
      setQuotaInput(20);
      setStatusMsg({ type: 'success', text: 'Nama guru berhasil ditambahkan ke daftar.' });
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
      aria-label="Manajemen Daftar Guru"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 mb-5"
    >
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-600" aria-hidden="true" />
          Daftar Nama Guru (Whitelist Pencetak)
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Guru cukup mencari dan memilih namanya sendiri di halaman depan tanpa perlu menghafal email.
        </p>
      </div>

      {statusMsg && (
        <div
          role="status"
          className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Tambah Guru Manual (Cukup Nama & Kuota) */}
      <form
        onSubmit={handleAddSingle}
        className="flex flex-col sm:flex-row gap-2.5 mb-4"
      >
        <input
          type="text"
          placeholder="Ketik Nama Lengkap Guru (contoh: Budi Santoso, S.Pd)"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10">
            <span className="text-xs text-slate-400">Kuota:</span>
            <input
              type="number"
              min="1"
              max="500"
              value={quotaInput}
              onChange={(e) => setQuotaInput(parseInt(e.target.value, 10) || 20)}
              className="w-12 bg-transparent text-sm font-mono font-bold text-slate-800 text-center focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tambah Guru
          </button>
        </div>
      </form>

      {/* Upload Excel Box */}
      <form onSubmit={handleUploadExcel} className="flex flex-col sm:flex-row items-center gap-2.5 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
        <label className="w-full sm:flex-1 cursor-pointer">
          <div className="h-9 flex items-center gap-2 px-3 rounded-lg bg-white border border-slate-200 hover:border-teal-500 transition-colors text-xs text-slate-600">
            <Upload className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
            <span className="truncate">
              {file ? file.name : 'Atau impor banyak sekaligus dari Excel (.xlsx / .csv)'}
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
          className="w-full sm:w-auto h-9 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {uploading ? 'Mengimpor...' : 'Impor Excel'}
        </button>
      </form>

      {/* Tabel Daftar Guru */}
      {employees.length > 0 && (
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-3.5">Nama Guru</th>
                <th className="py-2.5 px-3.5">Jatah Harian</th>
                <th className="py-2.5 px-3.5 text-right">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3.5 font-medium text-slate-800">{emp.name}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-600">
                    {emp.dailyQuotaOverride || 20} lembar
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(emp.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                      aria-label={`Hapus ${emp.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
