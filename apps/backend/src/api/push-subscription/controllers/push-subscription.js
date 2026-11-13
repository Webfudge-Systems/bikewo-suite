'use strict';

/**
 * Browser push subscriptions for the signed-in user (Chrome notifications in CRM / PM).
 * A subscription is identified by its endpoint; subscribing again re-links it to the current user.
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { isPushConfigured } = require('../../../utils/web-push');

const UID = 'api::push-subscription.push-subscription';
const APPS = ['crm', 'pm'];

module.exports = createCoreController(UID, ({ strapi }) => ({
  // GET /push/public-key — VAPID public key the browser needs to subscribe.
  async publicKey(ctx) {
    if (!isPushConfigured()) {
      return ctx.send({ enabled: false, publicKey: null });
    }
    return ctx.send({ enabled: true, publicKey: process.env.VAPID_PUBLIC_KEY });
  },

  // POST /push/subscribe — { subscription: PushSubscriptionJSON, app: 'crm' | 'pm' }
  async subscribe(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!isPushConfigured()) return ctx.badRequest('Push notifications are not configured on this server');

    const { subscription, app } = ctx.request.body || {};
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;
    if (!endpoint || !p256dh || !auth) return ctx.badRequest('Invalid push subscription');
    if (!/^https:\/\//.test(endpoint)) return ctx.badRequest('Invalid push endpoint');
    if (!APPS.includes(app)) return ctx.badRequest('app must be crm or pm');

    const data = {
      endpoint,
      p256dh,
      auth,
      app,
      userAgent: String(ctx.request.headers['user-agent'] || '').slice(0, 250),
      user: ctx.state.user.id,
    };

    const existing = await strapi.db.query(UID).findOne({ where: { endpoint } });
    if (existing) {
      await strapi.db.query(UID).update({ where: { id: existing.id }, data });
    } else {
      await strapi.db.query(UID).create({ data });
    }
    return ctx.send({ subscribed: true });
  },

  // POST /push/unsubscribe — { endpoint } (only removes the caller's own subscription)
  async unsubscribe(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    const endpoint = ctx.request.body?.endpoint;
    if (!endpoint) return ctx.badRequest('endpoint is required');
    await strapi.db.query(UID).delete({ where: { endpoint, user: { id: ctx.state.user.id } } });
    return ctx.send({ subscribed: false });
  },
}));
