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
        setErrorMsg('Ukuran berkas melebihi batas maksimal 25 MB.');
        return;
      }
      setFile(selected);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Silakan pilih berkas PDF atau foto yang ingin dicetak.');
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
          ? 'Dokumen rahasia dikunci! Tekan tombol "Rilis Sekarang" saat Bapak/Ibu sudah berdiri di depan printer TU.'
          : 'Dokumen berhasil dikirim ke antrean printer TU!'
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
      className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5">
        <h2 className="text-xl font-extrabold text-slate-900">Cetak Dokumen Baru</h2>
        <span className="text-sm font-semibold text-slate-500">PDF / Foto • Maksimal 25 MB</span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-2xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold rounded-2xl flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Large File Dropzone */}
      <div className="mb-6">
        <label className="sr-only" htmlFor="file-upload-input">
          Pilih Berkas (PDF / Gambar)
        </label>
        <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/30 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all relative bg-slate-50/60">
          <input
            id="file-upload-input"
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-emerald-800 font-bold text-base py-2">
              <FileText className="w-7 h-7 text-emerald-600 flex-shrink-0" aria-hidden="true" />
              <span className="truncate max-w-xs sm:max-w-md">{file.name}</span>
              <span className="text-sm font-mono text-slate-500">
                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
          ) : (
            <div className="py-2">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <Upload className="w-7 h-7" aria-hidden="true" />
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-800">
                Ketuk di sini untuk memilih file PDF atau Foto
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Jumlah halaman fisik kertas akan dihitung otomatis oleh sistem
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Large Touch Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Stepper Jumlah Rangkap */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Jumlah Rangkap
          </span>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCopies(Math.max(1, copies - 1))}
              disabled={copies <= 1}
              className="w-10 h-10 rounded-xl bg-white border border-slate-300 disabled:opacity-40 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors shadow-xs"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xl font-bold font-mono text-slate-900">{copies}x</span>
            <button
              type="button"
              onClick={() => setCopies(Math.min(10, copies + 1))}
              disabled={copies >= 10}
              className="w-10 h-10 rounded-xl bg-white border border-slate-300 disabled:opacity-40 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warna / Hitam Putih */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Tipe Warna
          </span>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsColor(false)}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isColor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hitam Putih
            </button>
            <button
              type="button"
              onClick={() => setIsColor(true)}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isColor ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Warna
            </button>
          </div>
        </div>

        {/* Sisi Cetak (1 Sisi / Bolak-balik Duplex) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Sisi Kertas
          </span>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsDuplex(false)}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isDuplex ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1 Sisi
            </button>
            <button
              type="button"
              onClick={() => setIsDuplex(true)}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isDuplex ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bolak-balik
            </button>
          </div>
        </div>
      </div>

      {/* Dokumen Rahasia (Kunci Antrean) */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Kunci Dokumen Rahasia</p>
            <p className="text-xs sm:text-sm text-slate-500">
              Dokumen baru dicetak saat Bapak/Ibu menekan tombol rilis di depan printer TU.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* Tombol Kirim Cetak */}
      <button
        type="submit"
        disabled={!file || isUploading || remainingQuota <= 0}
        className="w-full h-14 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-base font-bold rounded-2xl transition-all shadow-md hover:shadow-lg hover:shadow-emerald-950/20 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
      >
        <Upload className="w-5 h-5" />
        <span>
          {isUploading
            ? 'Mengunggah & Memproses Dokumen...'
            : remainingQuota <= 0
            ? 'Jatah Kuota Hari Ini Telah Habis'
            : 'Kirim Dokumen ke Printer TU'}
        </span>
      </button>
    </form>
  );
}
