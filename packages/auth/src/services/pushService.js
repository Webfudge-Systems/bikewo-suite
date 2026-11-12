// Web Push (Chrome / desktop notifications) for CRM and PM.
// The service worker (apps/*/app/sw.ts) shows the notifications; this file manages the subscription.
import authService from './authService';

const SW_READY_TIMEOUT_MS = 4000;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function api(path, { method = 'GET', body, token = authService.getToken() } = {}) {
  const response = await fetch(`${authService.baseURL}/api/push/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || 'Could not update notification settings.');
  return data;
}

/** The app's service worker registration, or null (e.g. local dev, where it is disabled). */
async function getRegistration() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS)),
  ]);
}

const pushService = {
  isSupported() {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  /** @returns {Promise<'unsupported' | 'denied' | 'on' | 'off'>} */
  async getStatus() {
    if (!this.isSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    const registration = await getRegistration();
    const subscription = registration ? await registration.pushManager.getSubscription() : null;
    return subscription && Notification.permission === 'granted' ? 'on' : 'off';
  },

  /**
   * Ask for permission (must run from a click) and subscribe this browser for the given app.
   * @param {'crm' | 'pm'} app
   */
  async enable(app) {
    if (!this.isSupported()) throw new Error('This browser does not support desktop notifications.');
    const { enabled, publicKey } = await api('public-key');
    if (!enabled || !publicKey) throw new Error('Desktop notifications are not set up on the server yet.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notifications are blocked. Allow them for this site in Chrome settings and try again.');
    }

    const registration = await getRegistration();
    if (!registration) throw new Error('Desktop notifications only work on the deployed app (not local dev).');

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    await api('subscribe', { method: 'POST', body: { subscription: subscription.toJSON(), app } });
    return 'on';
  },

  /** Stop notifications in this browser. The session token is read up front so this also works on logout. */
  async disable() {
    const token = authService.getToken();
    const registration = await getRegistration();
    const subscription = registration ? await registration.pushManager.getSubscription() : null;
    if (!subscription) return 'off';
    try {
      await api('unsubscribe', { method: 'POST', body: { endpoint: subscription.endpoint }, token });
    } finally {
      await subscription.unsubscribe();
    }
    return 'off';
  },

  /** Re-link an existing subscription to whoever is signed in now (call on app load). */
  async resync(app) {
    if (!this.isSupported() || Notification.permission !== 'granted' || !authService.getToken()) return;
    const registration = await getRegistration();
    const subscription = registration ? await registration.pushManager.getSubscription() : null;
    if (subscription) {
      await api('subscribe', { method: 'POST', body: { subscription: subscription.toJSON(), app } }).catch(() => {});
    }
  },
};

export default pushService;
