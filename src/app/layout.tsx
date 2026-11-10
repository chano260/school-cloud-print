import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'School Cloud Print Station • Epson EcoTank L6460',
  description:
    'Portal cetak cloud guru & staf TU dengan kuota harian otomatis, rilis dokumen rahasia, dan pemantauan sensor tinta real-time.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F766E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/15 selection:text-teal-700 antialiased">
        {children}
      </body>
    </html>
  );
}
