import nodemailer from 'nodemailer';
import path from 'path';
import 'dotenv/config';
import type { PlacementStats, CtcStats } from './types.js';

type Provider = 'gmail' | 'college';

const SMTP: Record<Provider, { host: string; user_env: string; pass_env: string }> = {
  gmail:   { host: 'smtp.gmail.com',      user_env: 'GMAIL_USER',   pass_env: 'GMAIL_PASS'   },
  college: { host: 'smtp.office365.com',  user_env: 'OUTLOOK_USER', pass_env: 'OUTLOOK_PASS' },
};

function buildSubject(): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year  = now.getFullYear();
  return `Placement Statistics Report — ${month} ${year}`;
}

function buildBody(stats: PlacementStats, ctcStats: CtcStats): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year  = now.getFullYear();
  const medianL = (ctcStats.median / 100000).toFixed(2);

  return [
    'Hi,',
    '',
    `Please find attached the placement statistics report for ${month} ${year}.`,
    '',
    'Quick summary:',
    `  • Students opted:    ${stats.optPlacement}`,
    `  • Placed:            ${stats.placed} (${stats.overallPlacementPercent}%)`,
    `  • Median CTC:        ₹${medianL} L`,
    `  • Companies visited: ${stats.totalCompanies}`,
    '',
    'Full report attached.',
  ].join('\n');
}

export async function sendReport(
  pdfPath: string,
  stats: PlacementStats,
  ctcStats: CtcStats,
  provider: Provider,
  toOverride?: string,
): Promise<string[]> {
  const cfg = SMTP[provider];

  const user = process.env[cfg.user_env];
  const pass = process.env[cfg.pass_env];
  if (!user || !pass) {
    throw new Error(
      `Missing credentials for provider "${provider}". ` +
      `Set ${cfg.user_env} and ${cfg.pass_env} in your .env file.`
    );
  }

  const recipientEnv = process.env['EMAIL_RECIPIENTS'] ?? '';
  const recipientStr = toOverride ?? recipientEnv;
  const recipients   = recipientStr.split(',').map(r => r.trim()).filter(Boolean);
  if (recipients.length === 0) {
    throw new Error(
      'No recipients specified. Use --to or set EMAIL_RECIPIENTS in your .env file.'
    );
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: 587,
    secure: false, // STARTTLS
    auth: { user, pass },
  });

  await transporter.sendMail({
    from:        user,
    to:          recipients.join(', '),
    subject:     buildSubject(),
    text:        buildBody(stats, ctcStats),
    attachments: [{
      filename: path.basename(pdfPath),
      path:     pdfPath,
    }],
  });

  return recipients;
}
