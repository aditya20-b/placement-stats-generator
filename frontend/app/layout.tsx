import type { Metadata } from 'next';
import Link from 'next/link';
import { NavLinks } from '@/components/NavLinks';
import './globals.css';

export const metadata: Metadata = {
  title: 'Placement Stats — Shiv Nadar University Chennai',
  description: 'Generate and browse placement statistics reports',
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
            borderBottom: '1px solid rgba(255,255,255,0.06)',
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
              height: '52px',
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
                gap: '10px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/>
                  <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.6"/>
                  <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.6"/>
                  <rect x="8" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
              <span
                style={{
                  color: '#FAFAFA',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  letterSpacing: '0.01em',
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
