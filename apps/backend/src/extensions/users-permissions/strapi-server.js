'use strict';

/**
 * Add profile fields to users-permissions user.
 * Do not use schema.json here: Strapi shallow-merges extension schemas and would
 * replace the entire `attributes` object, dropping email/username/password.
 */
module.exports = (plugin) => {
  const user = plugin.contentTypes?.user;
  if (!user?.schema?.attributes) return plugin;

  Object.assign(user.schema.attributes, {
    firstName: { type: 'string', maxLength: 80 },
    lastName: { type: 'string', maxLength: 80 },
    // Two-factor authentication (see src/utils/mfa.js). Private: never returned by the REST API.
    mfaEnabled: { type: 'boolean', default: false, private: true },
    mfaSecret: { type: 'text', private: true },
    mfaPendingSecret: { type: 'text', private: true },
    mfaRecoveryCodes: { type: 'json', private: true },
  });

  return plugin;
};
