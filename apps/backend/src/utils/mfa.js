'use strict';

/**
 * Two-factor authentication (authenticator app / TOTP, RFC 6238) for team logins.
 *
 * - Secrets are stored AES-256-GCM encrypted (key from ENCRYPTION_KEY, falling back to JWT_SECRET).
 * - Recovery codes are stored as SHA-256 hashes and are single-use.
 * - The password step issues a short-lived "pending" token signed with a *different* secret than
 *   session JWTs, so it can never be used as a session by jwt-auth or users-permissions.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./client-auth');

const ISSUER = 'BikeWo';
const STEP_SECONDS = 30;
const DIGITS = 6;
const PENDING_TOKEN_TTL = '10m';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 10 * 60 * 1000;
const RECOVERY_CODE_COUNT = 8;

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  const clean = String(str || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    value = (value << 5) | BASE32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secret, counter) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS;
  return String(bin).padStart(DIGITS, '0');
}

/** Accepts the current code plus one step either side for clock drift. */
function verifyTotp(secret, code, now = Date.now()) {
  const clean = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean) || !secret) return false;
  const counter = Math.floor(now / 1000 / STEP_SECONDS);
  for (let drift = -1; drift <= 1; drift += 1) {
    const expected = hotp(secret, counter + drift);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return true;
  }
  return false;
}

function otpauthUrl(secret, accountName) {
  const label = encodeURIComponent(`${ISSUER}:${accountName}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

function encryptionKey() {
  const raw = process.env.ENCRYPTION_KEY || JWT_SECRET;
  return crypto.createHash('sha256').update(String(raw)).digest();
}

function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

function decryptSecret(stored) {
  if (!stored) return null;
  try {
    const [iv, tag, enc] = String(stored).split('.').map((p) => Buffer.from(p, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch (_) {
    return null;
  }
}

function hashRecoveryCode(code) {
  return crypto
    .createHash('sha256')
    .update(String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .digest('hex');
}

/** @returns {{ codes: string[], hashes: string[] }} codes like "K7QD-9XMP" */
function generateRecoveryCodes() {
  const codes = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
    const raw = base32Encode(crypto.randomBytes(5)).slice(0, 8);
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return { codes, hashes: codes.map(hashRecoveryCode) };
}

/** Returns the remaining hashes if `code` matched one, otherwise null. */
function consumeRecoveryCode(hashes, code) {
  const list = Array.isArray(hashes) ? hashes : [];
  const target = hashRecoveryCode(code);
  const idx = list.indexOf(target);
  if (idx === -1) return null;
  return list.filter((_, i) => i !== idx);
}

const PENDING_SECRET = `${JWT_SECRET}:mfa-pending`;

/** purpose: 'mfa-verify' (enter code) | 'mfa-setup' (org requires 2FA, user not enrolled yet) */
function signPendingToken(userId, purpose) {
  return jwt.sign({ sub: String(userId), purpose }, PENDING_SECRET, { expiresIn: PENDING_TOKEN_TTL });
}

/** @returns {number|null} user id */
function verifyPendingToken(token, purpose) {
  try {
    const decoded = jwt.verify(String(token || ''), PENDING_SECRET);
    if (!decoded || decoded.purpose !== purpose) return null;
    const id = Number(decoded.sub);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch (_) {
    return null;
  }
}

// In-memory throttle for code guesses (per user). Resets on a correct code or after the lock window.
const failures = new Map();

function isLocked(userId) {
  const entry = failures.get(String(userId));
  if (!entry) return false;
  if (entry.lockedUntil && entry.lockedUntil > Date.now()) return true;
  if (entry.lockedUntil) failures.delete(String(userId));
  return false;
}

function recordFailure(userId) {
  const key = String(userId);
  const entry = failures.get(key) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_MS;
    entry.count = 0;
  }
  failures.set(key, entry);
}

function clearFailures(userId) {
  failures.delete(String(userId));
}

/** True when any organization the user belongs to requires 2FA (Accounts → Security). */
function membershipsRequireMfa(memberships) {
  return (memberships || []).some((m) => m?.organization?.securitySettings?.requireMfa === true);
}

module.exports = {
  generateSecret,
  verifyTotp,
  otpauthUrl,
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  consumeRecoveryCode,
  signPendingToken,
  verifyPendingToken,
  isLocked,
  recordFailure,
  clearFailures,
  membershipsRequireMfa,
};
