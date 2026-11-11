'use strict';

/**
 * Turn off two-factor authentication for one user (lost phone and recovery codes).
 * They can sign in with their password and set 2FA up again (immediately, if the org requires it).
 *
 * Usage:
 *   node scripts/reset-user-mfa.js person@example.com
 *
 * Uses the database configured in apps/backend/.env (point it at the right environment first).
 */

const { createStrapi } = require('@strapi/strapi');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: node scripts/reset-user-mfa.js <email>');
    process.exit(1);
  }

  const strapi = await createStrapi().load();
  try {
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exitCode = 1;
      return;
    }
    await strapi.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { mfaEnabled: false, mfaSecret: null, mfaPendingSecret: null, mfaRecoveryCodes: null },
    });
    console.log(`Two-factor authentication reset for ${email} (user id ${user.id}).`);
  } finally {
    await strapi.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
