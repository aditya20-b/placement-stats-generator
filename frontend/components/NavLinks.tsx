'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[
        { href: '/', label: 'Dashboard' },
        { href: '/history', label: 'History' },
      ].map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              color: active ? '#FAFAFA' : '#A1A1AA',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: active ? '500' : '400',
              padding: '5px 11px',
              borderRadius: '6px',
              background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.color = '#FAFAFA';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
