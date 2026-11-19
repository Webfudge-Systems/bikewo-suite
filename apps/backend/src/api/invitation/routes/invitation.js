'use strict';

/**
 * invitation router
 *
 * The generic REST endpoints are disabled: invitation rows hold secret tokens. Invitations are
 * managed through /organizations/:id/invitations (admins) and /invitations/validate|accept (public).
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::invitation.invitation', { only: [] });
