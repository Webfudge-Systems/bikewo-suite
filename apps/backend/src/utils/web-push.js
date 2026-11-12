'use strict';

/**
 * Web Push (Chrome / desktop notifications) for team users.
 *
 * Needs VAPID keys in env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT (mailto: or https: URL).
 * Generate once per environment with `npx web-push generate-vapid-keys`. Without keys, push is skipped.
 */

const webpush = require('web-push');

const UID = 'api::push-subscription.push-subscription';

// Which app a notification belongs to (matches SUBJECT_PATHS in notification-emitter.js).
const APP_BY_SUBJECT = {
  task: 'pm',
  project: 'pm',
  deal: 'crm',
  lead_company: 'crm',
  contact: 'crm',
  client_account: 'crm',
};

let configured = null;

function isPushConfigured() {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return configured;
  }
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@bikewo.in', publicKey, privateKey);
    configured = true;
  } catch (err) {
    console.warn('[web-push] invalid VAPID keys:', err?.message || err);
    configured = false;
  }
  return configured;
}

function appBaseUrl(app) {
  const raw = app === 'crm' ? process.env.CRM_APP_URL : app === 'pm' ? process.env.PM_APP_URL : '';
  return String(raw || '').replace(/\/$/, '');
}

/**
 * Push one in-app notification to the user's browsers. Prefers browsers subscribed from the app the
 * notification belongs to (so a task only pops from PM); falls back to any of their subscriptions.
 */
async function sendPushForNotification(strapi, { userId, title, message, data = {}, notificationId }) {
  if (!userId || !isPushConfigured()) return;

  const subs = await strapi.db.query(UID).findMany({ where: { user: { id: userId } } });
  if (!subs.length) return;

  const app = data.app || APP_BY_SUBJECT[data.subjectType] || null;
  const matching = app ? subs.filter((s) => s.app === app) : subs;
  const targets = matching.length ? matching : subs;

  const href = data.href || '/';
  const payload = JSON.stringify({
    title: title || 'BikeWo',
    body: message || '',
    tag: notificationId ? `bikewo-notification-${notificationId}` : undefined,
    url: href,
    // Absolute link for when the push lands in the other app's browser subscription.
    absoluteUrl: app && appBaseUrl(app) ? `${appBaseUrl(app)}${href}` : null,
    app,
  });

  await Promise.all(
    targets.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 60 * 60 * 24 }
        );
      } catch (err) {
        // 404/410: the browser dropped the subscription (uninstalled, cleared data) — forget it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await strapi.db.query(UID).delete({ where: { id: sub.id } });
        } else {
          console.warn('[web-push] send failed:', err?.statusCode || '', err?.body || err?.message || err);
        }
      }
    })
  );
}

module.exports = { isPushConfigured, sendPushForNotification, APP_BY_SUBJECT };
