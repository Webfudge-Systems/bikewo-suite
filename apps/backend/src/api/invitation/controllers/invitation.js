'use strict';

/**
 * invitation controller — public endpoints used by the Accounts "/invite/[token]" page.
 */

const { createCoreController } = require('@strapi/strapi').factories;

function sendError(ctx, error, fallback) {
  const status = Number(error?.status) || 400;
  const message = error?.status ? error.message : fallback;
  if (!error?.status) console.error(fallback, error);
  ctx.status = status;
  ctx.body = { data: null, error: { status, name: 'InvitationError', message, details: {} } };
}

module.exports = createCoreController('api::invitation.invitation', ({ strapi }) => ({
  /** Accept: returns the /auth/login response shape (session, or the 2FA step). */
  async accept(ctx) {
    const { token, password, firstName, lastName } = ctx.request.body || {};
    try {
      const result = await strapi
        .service('api::invitation.invitation')
        .acceptInvitation({ token, password, firstName, lastName });
      return ctx.send(result);
    } catch (error) {
      return sendError(ctx, error, 'Could not accept the invitation. Please try again.');
    }
  },

  /** What the accept page shows before the person signs up (email, org name, role, min length). */
  async validate(ctx) {
    try {
      const info = await strapi.service('api::invitation.invitation').describe(ctx.params.token);
      return ctx.send(info);
    } catch (error) {
      return sendError(ctx, error, 'Could not check the invitation. Please try again.');
    }
  },
}));
