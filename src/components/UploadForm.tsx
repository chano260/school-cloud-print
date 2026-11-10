'use client';

import React, { useState } from 'react';
import { Upload, Lock, ShieldCheck, Printer, AlertCircle } from 'lucide-react';

interface UploadFormProps {
  remainingQuota: number;
  onUploadSuccess: () => void;
}

export default function UploadForm({ remainingQuota, onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [copies, setCopies] = useState<number>(1);
  const [isColor, setIsColor] = useState<boolean>(false);
  const [isDuplex, setIsDuplex] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 25 * 1024 * 1024) {
        setErrorMsg('Ukuran file maksimal 25 MB.');
        return;
      }
      setFile(selected);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Silakan pilih file PDF atau gambar yang ingin dicetak.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

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
      onUploadSuccess();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Printer className="w-5 h-5 text-indigo-600" />
        Kirim Dokumen Cetak
      </h2>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* File Dropzone */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Berkas (PDF / Gambar)</label>
        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
          <input
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          {file ? (
            <p className="text-sm font-medium text-indigo-600 truncate">{file.name}</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-700">Tarik berkas ke sini atau klik untuk memilih</p>
              <p className="text-xs text-slate-400 mt-1">Format: PDF, JPG, PNG (Maks 25 MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jumlah Rangkap</label>
          <input
            type="number"
            min="1"
            max="10"
            value={copies}
            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mode Warna</label>
          <select
            value={isColor ? 'color' : 'bw'}
            onChange={(e) => setIsColor(e.target.value === 'color')}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="bw">Hitam-Putih (Grayscale)</option>
            <option value="color">Berwarna (Color)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sisi Cetak</label>
          <select
            value={isDuplex ? 'duplex' : 'single'}
            onChange={(e) => setIsDuplex(e.target.value === 'duplex')}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="single">1 Sisi (Single)</option>
            <option value="duplex">Bolak-balik (Duplex)</option>
          </select>
        </div>
      </div>

      {/* Confidential Hold-and-Release Checkbox */}
      <div className="mb-6 bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
            className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <div>
            <span className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-700" />
              Kunci Dokumen (Berkas Rahasia / Soal Ujian)
            </span>
            <p className="text-xs text-amber-800/80 mt-0.5">
              Dokumen tidak akan langsung keluar di printer TU. Dokumen baru dicetak saat Anda menekan tombol rilis dari HP di depan printer.
            </p>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading || remainingQuota <= 0}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition shadow-sm text-sm"
      >
        {isUploading ? 'Sedang Mengunggah & Memproses...' : 'Kirim ke Antrean Cetak'}
      </button>
    </form>
  );
}
