import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
      <p className="text-sm text-slate-500 mb-6">Halaman tidak ditemukan.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
