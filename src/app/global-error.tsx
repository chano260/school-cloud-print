'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-sans">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kesalahan Sistem</h2>
        <p className="text-xs text-slate-500 mb-6">{error?.message || 'Gagal memuat aplikasi.'}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition cursor-pointer"
        >
          Muat Ulang
        </button>
      </body>
    </html>
  );
}
