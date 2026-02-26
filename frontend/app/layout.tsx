import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Placement Stats — Shiv Nadar University Chennai',
  description: 'Generate and browse placement statistics reports',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 text-zinc-900`}
      >
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                <svg
                  className="h-4 w-4 text-white"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-zinc-900">
                Placement Stats
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/"
                className="text-zinc-600 transition-colors hover:text-zinc-900"
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                className="text-zinc-600 transition-colors hover:text-zinc-900"
              >
                History
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
