'use client';

import React, { useState } from 'react';
import { Upload, Lock, AlertCircle, FileText, CheckCircle2, Minus, Plus } from 'lucide-react';

interface UploadFormProps {
  remainingQuota: number;
  onUploadSuccess?: () => void;
}

export default function UploadForm({ remainingQuota, onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [copies, setCopies] = useState<number>(1);
  const [isColor, setIsColor] = useState<boolean>(false);
  const [isDuplex, setIsDuplex] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 25 * 1024 * 1024) {
        setErrorMsg('Ukuran berkas maksimal 25 MB.');
        return;
      }
      setFile(selected);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Silakan pilih berkas PDF atau gambar yang ingin dicetak.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('copies', String(copies));
    formData.append('isColor', String(isColor));
    formData.append('isDuplex', String(isDuplex));
    formData.append('isLocked', String(isLocked));

    try {
      const res = await fetch('/api/jobs/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengunggah dokumen.');
      }

      setFile(null);
      setIsLocked(false);
      setSuccessMsg(
        isLocked
          ? 'Dokumen dikunci! Tekan "Rilis Sekarang" saat Anda sudah di depan printer TU.'
          : 'Dokumen berhasil dikirim ke antrean cetak!'
      );
      onUploadSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 mb-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">Cetak Dokumen Baru</h2>
        <span className="text-xs text-slate-400">PDF / Gambar • Maks 25 MB</span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Clean File Dropzone */}
      <div className="mb-5">
        <label className="sr-only" htmlFor="file-upload-input">
          Pilih Berkas (PDF / Gambar)
        </label>
        <div className="border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-slate-50/70 rounded-xl p-5 text-center cursor-pointer transition-all relative bg-slate-50/40">
          <input
            id="file-upload-input"
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-teal-700 font-semibold text-sm py-1">
              <FileText className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate max-w-xs sm:max-w-md">{file.name}</span>
              <span className="text-xs font-mono text-slate-400">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          ) : (
            <div className="py-1">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-2 text-slate-600">
                <Upload className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Ketuk untuk pilih file PDF atau Foto
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Jumlah halaman dihitung otomatis oleh sistem
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Touch-Friendly Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Stepper Jumlah Rangkap */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Jumlah Rangkap
          </span>
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setCopies(Math.max(1, copies - 1))}
              className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
              aria-label="Kurangi rangkap"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
              {copies}x
            </span>
            <button
              type="button"
              onClick={() => setCopies(Math.min(10, copies + 1))}
              className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
              aria-label="Tambah rangkap"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mode Warna */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between">
          <label htmlFor="color-select" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Mode Warna
          </label>
          <select
            id="color-select"
            value={isColor ? 'color' : 'bw'}
            onChange={(e) => setIsColor(e.target.value === 'color')}
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="bw">Hitam-Putih (B&W)</option>
            <option value="color">Berwarna (Color)</option>
          </select>
        </div>

        {/* Sisi Cetak */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between">
          <label htmlFor="duplex-select" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Sisi Kertas
          </label>
          <select
            id="duplex-select"
            value={isDuplex ? 'duplex' : 'single'}
            onChange={(e) => setIsDuplex(e.target.value === 'duplex')}
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="single">1 Sisi (Biasa)</option>
            <option value="duplex">Bolak-balik (Hemat 50%)</option>
          </select>
        </div>
      </div>

      {/* Simple Confidential Toggle */}
      <label className="flex items-start gap-3 p-3.5 mb-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={isLocked}
          onChange={(e) => setIsLocked(e.target.checked)}
          className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
        />
        <div className="text-xs">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            Kunci Dokumen (Khusus Soal Ujian / Rahasia)
          </span>
          <p className="text-slate-500 mt-0.5 leading-relaxed">
            Kertas baru akan keluar saat Anda menekan tombol <strong>Rilis Sekarang</strong> di depan printer TU.
          </p>
        </div>
      </label>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading || remainingQuota <= 0}
        className="w-full h-11 px-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all text-sm cursor-pointer shadow-sm"
      >
        {isUploading
          ? 'Memproses Dokumen...'
          : remainingQuota <= 0
          ? 'Kuota Harian Sudah Habis'
          : 'Kirim ke Antrean Cetak'}
      </button>
    </form>
  );
}
