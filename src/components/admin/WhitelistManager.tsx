'use client';

import React, { useState } from 'react';
import { Upload, Users, Plus, Check, AlertCircle } from 'lucide-react';

export default function WhitelistManager() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor file Excel.');

      setStatusMsg({
        type: 'success',
        text: `Berhasil mengimpor! ${data.imported} pegawai ditambahkan, ${data.updated} pegawai diperbarui.`,
      });
      setFile(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Daftar Putih Pegawai (Whitelist Guru)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hanya pegawai di daftar ini yang dapat login dengan akun Belajar.id dan mencetak dokumen.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`mb-4 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Upload Excel Box */}
      <form onSubmit={handleUploadExcel} className="flex flex-col sm:flex-row items-center gap-3">
        <label className="w-full sm:flex-1 cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm text-slate-600">
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="truncate">{file ? file.name : 'Pilih Berkas Excel (.xlsx, .csv) Daftar Guru'}</span>
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
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          {uploading ? 'Mengimpor...' : 'Impor Pegawai'}
        </button>
      </form>

      <p className="text-[11px] text-slate-400 mt-2">
        Format kolom Excel: <code>Nama</code>, <code>Email</code> (contoh: <code>budi@guru.smp.belajar.id</code>), <code>Kuota</code> (opsional, misal 20).
      </p>
    </div>
  );
}
