import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { NavLinks } from '@/components/NavLinks';
import './globals.css';

export const metadata: Metadata = {
  title: 'Placement Stats — SNU Chennai · Batch of 2026',
  description: 'Placement statistics reports for the Shiv Nadar University Chennai graduating batch of 2022–2026',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav
          style={{
            background: 'var(--nav-bg)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              padding: '0 24px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
              }}
            >
              <Image
                src="/snu-logo.png"
                alt="Shiv Nadar University Chennai"
                width={80}
                height={32}
                style={{ objectFit: 'contain', objectPosition: 'left center' }}
              />
              <div
                style={{
                  width: '1px',
                  height: '20px',
                  background: 'rgba(255,255,255,0.15)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '13px',
                  fontWeight: '400',
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                }}
              >
                Placement Stats
              </span>
            </Link>

            <NavLinks />
          </div>
        </nav>

        <main
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '40px 24px 80px',
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
