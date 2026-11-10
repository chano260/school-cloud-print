'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Users, Plus, Check, AlertCircle, Trash2, Edit2, X } from 'lucide-react';

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

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuotaVal, setEditQuotaVal] = useState<number>(20);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const startEditQuota = (emp: EmployeeRecord) => {
    setEditingId(emp.id);
    setEditQuotaVal(emp.dailyQuotaOverride || 20);
  };

  const saveEditQuota = async (emp: EmployeeRecord) => {
    if (!editQuotaVal || editQuotaVal <= 0) return;
    setSavingEdit(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emp.id,
          dailyQuota: editQuotaVal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui kuota.');

      setEditingId(null);
      setStatusMsg({
        type: 'success',
        text: `Jatah kuota untuk ${emp.name} berhasil diubah menjadi ${editQuotaVal} lembar.`,
      });
      fetchEmployees();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus guru ini dari daftar?')) return;
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
      className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 mb-6"
    >
      <div className="mb-5">
        <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <Users className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          <span>Daftar Guru & Edit Kuota Harian</span>
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Admin TU dapat mengubah jatah kuota per guru sewaktu-waktu dan langsung aktif hari ini.
        </p>
      </div>

      {statusMsg && (
        <div
          role="status"
          className={`mb-5 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" aria-hidden="true" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Tambah Guru Manual */}
      <form
        onSubmit={handleAddSingle}
        className="flex flex-col sm:flex-row gap-3 mb-5"
      >
        <input
          type="text"
          placeholder="Ketik Nama Lengkap Guru (contoh: Dra. Siti Rahma)"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="flex-1 h-12 px-4 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3.5 h-12">
            <span className="text-xs font-bold text-slate-500 uppercase">Kuota:</span>
            <input
              type="number"
              min="1"
              max="500"
              value={quotaInput}
              onChange={(e) => setQuotaInput(parseInt(e.target.value, 10) || 20)}
              className="w-14 bg-transparent text-base font-mono font-bold text-slate-900 text-center focus:outline-none"
            />
            <span className="text-xs font-medium text-slate-500">lbr</span>
          </div>
          <button
            type="submit"
            className="h-12 px-5 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer flex-shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Tambah</span>
          </button>
        </div>
      </form>

      {/* Upload Excel Box */}
      <form onSubmit={handleUploadExcel} className="flex flex-col sm:flex-row items-center gap-3 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <label className="w-full sm:flex-1 cursor-pointer">
          <div className="h-11 flex items-center gap-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 transition-colors text-sm text-slate-700">
            <Upload className="w-4 h-4 text-emerald-600" aria-hidden="true" />
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
          className="w-full sm:w-auto h-11 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
        >
          {uploading ? 'Mengimpor...' : 'Impor Excel'}
        </button>
      </form>

      {/* Tabel Daftar Guru */}
      {employees.length > 0 && (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Guru</th>
                <th className="py-3.5 px-4">Jatah Kuota Harian</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const isEditing = editingId === emp.id;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-base">
                      {emp.name}
                    </td>

                    {/* Kolom Jatah Kuota (dengan Edit Inline) */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            autoFocus
                            value={editQuotaVal}
                            onChange={(e) => setEditQuotaVal(parseInt(e.target.value, 10) || 1)}
                            className="w-20 h-10 px-3 border-2 border-emerald-600 rounded-xl text-base font-mono font-bold text-slate-900 bg-white focus:outline-none"
                          />
                          <span className="text-sm font-semibold text-slate-600">lembar</span>
                          <button
                            type="button"
                            onClick={() => saveEditQuota(emp)}
                            disabled={savingEdit}
                            title="Simpan Perubahan"
                            className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            title="Batal"
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <X className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-slate-800 text-base px-2.5 py-1 rounded-lg bg-slate-100">
                            {emp.dailyQuotaOverride || 20} lembar
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditQuota(emp)}
                            title="Edit Jatah Kuota Guru Ini"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(emp.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                        aria-label={`Hapus ${emp.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
