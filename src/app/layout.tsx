import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Fira_Code } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

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
    <html lang="id" className={`${jakarta.variable} ${firaCode.variable}`}>
      <body className="min-h-screen bg-background text-card-foreground font-sans selection:bg-primary/15 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
