'use client';

import React, { useState } from 'react';
import { Upload, Lock, Printer, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

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
          ? 'Dokumen rahasia berhasil dikunci! Silakan tekan "Rilis Sekarang" saat berada di depan printer TU.'
          : 'Dokumen berhasil masuk antrean cetak!'
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
      className="bg-card rounded-2xl shadow-card border border-border p-5 sm:p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
            <Printer className="w-4 h-4" aria-hidden="true" />
          </span>
          Kirim Dokumen Cetak
        </h2>
        <span className="text-xs font-medium text-muted-foreground">PDF, JPG, PNG • Maks 25 MB</span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-4 p-3.5 bg-red-50 border border-red-200 text-destructive text-sm rounded-xl flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="mb-4 p-3.5 bg-primary-soft/60 border border-border text-foreground text-sm rounded-xl flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* File Dropzone */}
      <div className="mb-5">
        <label htmlFor="file-upload-input" className="block text-sm font-semibold text-foreground mb-2">
          Pilih Berkas (PDF / Gambar)
        </label>
        <div className="border-2 border-dashed border-teal-200 hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-background/60 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
          <input
            id="file-upload-input"
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm">
              <FileText className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate max-w-md">{file.name}</span>
              <span className="text-xs font-mono text-muted-foreground">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-primary/70 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">
                Ketuk untuk memilih berkas atau tarik ke kotak ini
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Jumlah halaman dihitung otomatis sebelum kuota dipotong
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label htmlFor="copies-input" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Jumlah Rangkap
          </label>
          <input
            id="copies-input"
            type="number"
            min="1"
            max="10"
            value={copies}
            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm font-mono tabular-nums"
          />
        </div>

        <div>
          <label htmlFor="color-select" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Mode Warna
          </label>
          <select
            id="color-select"
            value={isColor ? 'color' : 'bw'}
            onChange={(e) => setIsColor(e.target.value === 'color')}
            className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm cursor-pointer"
          >
            <option value="bw">Hitam-Putih (Grayscale)</option>
            <option value="color">Berwarna (Color)</option>
          </select>
        </div>

        <div>
          <label htmlFor="duplex-select" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Sisi Cetak
          </label>
          <select
            id="duplex-select"
            value={isDuplex ? 'duplex' : 'single'}
            onChange={(e) => setIsDuplex(e.target.value === 'duplex')}
            className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm cursor-pointer"
          >
            <option value="single">1 Sisi (Single)</option>
            <option value="duplex">Bolak-balik (Hemat Kuota 50%)</option>
          </select>
        </div>
      </div>

      {/* Confidential Hold-and-Release Checkbox */}
      <div className="mb-6 bg-accent-soft/70 border border-orange-200 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
            className="mt-0.5 w-5 h-5 text-accent rounded border-orange-300 focus:ring-accent cursor-pointer"
          />
          <div>
            <span className="text-sm font-bold text-orange-950 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-accent" aria-hidden="true" />
              Kunci Dokumen (Berkas Rahasia / Soal Ujian)
            </span>
            <p className="text-xs text-orange-900/80 mt-1 leading-relaxed">
              Dokumen ditahan di server dan tidak langsung keluar di printer TU. Dokumen baru dicetak dengan prioritas utama saat Anda menekan tombol <strong>&ldquo;Rilis Sekarang&rdquo;</strong> di depan printer.
            </p>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isUploading || remainingQuota <= 0}
        className="w-full min-h-[48px] py-3 px-5 bg-primary hover:bg-primary-hover disabled:bg-slate-300 text-primary-foreground font-semibold rounded-xl transition-colors duration-200 shadow-sm text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {isUploading
          ? 'Sedang Mengunggah & Menghitung Lembar...'
          : remainingQuota <= 0
          ? 'Kuota Harian Anda Sudah Habis'
          : 'Kirim ke Antrean Cetak'}
      </button>
    </form>
  );
}
