'use strict';

/**
 * Transactional email via Resend (https://resend.com) — invitations, password-change notices.
 *
 * Env: RESEND_API_KEY, EMAIL_FROM (e.g. "BikeWo <no-reply@bikewo.in>"; the domain must be verified in Resend).
 * Without RESEND_API_KEY nothing is sent: the email is logged and callers fall back (e.g. the admin
 * gets the invite link to share by hand).
 */

const RESEND_URL = 'https://api.resend.com/emails';

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** @returns {Promise<{ sent: boolean, reason?: string }>} never throws */
async function sendEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    console.warn(`[email] RESEND_API_KEY not set — not sending "${subject}" to ${to}`);
    return { sent: false, reason: 'not_configured' };
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'BikeWo <no-reply@bikewo.in>',
        to: [to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[email] Resend rejected "${subject}" to ${to}: ${res.status} ${body.slice(0, 300)}`);
      return { sent: false, reason: `resend_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[email] sending "${subject}" to ${to} failed:`, err?.message || err);
    return { sent: false, reason: 'network' };
  }
}

/** Simple branded layout: heading, paragraphs (already-escaped HTML), optional button. */
function layoutHtml({ heading, paragraphs = [], button, footer }) {
  const btn = button
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(button.href)}" style="background:#21C26B;color:#1E1B4B;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">${escapeHtml(button.label)}</a></p>
       <p style="font-size:13px;color:#6b7280;">If the button doesn't work, copy this link into your browser:<br/><a href="${escapeHtml(button.href)}" style="color:#1E1B4B;word-break:break-all;">${escapeHtml(button.href)}</a></p>`
    : '';
  return `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#1f2937;max-width:560px;margin:0 auto;padding:24px;">
  <h2 style="color:#1E1B4B;margin:0 0 12px;">${escapeHtml(heading)}</h2>
  ${paragraphs.map((p) => `<p style="margin:0 0 12px;">${p}</p>`).join('\n  ')}
  ${btn}
  <p style="font-size:12px;color:#9ca3af;margin-top:28px;">${footer ? escapeHtml(footer) : 'BikeWo Suite'}</p>
</div>`;
}

module.exports = { sendEmail, isEmailConfigured, escapeHtml, layoutHtml };
