'use strict';

/**
 * Team-app sign-in helpers shared by /auth/login, the 2FA endpoints and invitation acceptance,
 * so every path issues sessions the same way and respects 2FA / "Require MFA".
 */

const jwt = require('jsonwebtoken');
const { membershipSummary } = require('./rbac');
const { JWT_SECRET } = require('./client-auth');
const { signPendingToken, membershipsRequireMfa } = require('./mfa');

const ORG_MEMBERSHIP_UID = 'api::organization-user.organization-user';
const DEFAULT_PASSWORD_MIN_LENGTH = 8;

async function listActiveMemberships(strapi, userId, withModules = false) {
  return strapi.entityService.findMany(ORG_MEMBERSHIP_UID, {
    filters: { user: userId, isActive: true },
    sort: { joinedAt: 'ASC' },
    populate: {
      role: true,
      organization: {
        populate: {
          subscriptions: {
            populate: withModules ? { app: true, selectedModules: true } : { app: true },
          },
        },
      },
    },
  });
}

function organizationPayload(membership) {
  const summary = membershipSummary(membership);
  return {
    ...membership.organization,
    role: summary.role,
    roleCode: summary.roleCode,
    roleId: summary.roleId,
    accessLevel: summary.accessLevel,
    permissions: summary.permissions,
    customPermissions: summary.customPermissions,
    joinedAt: summary.joinedAt,
  };
}

/** Full team-app session: 7-day JWT + profile + organizations. */
function sessionPayload(user, memberships) {
  return {
    jwt: jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' }),
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    organizations: memberships.map(organizationPayload),
  };
}

/**
 * After a correct password (or an accepted invitation): a session, or the pending 2FA step
 * (enter code / first-time setup when the organization requires it).
 */
function loginResponse(user, memberships) {
  if (user.mfaEnabled) {
    return { mfaRequired: true, mfaToken: signPendingToken(user.id, 'mfa-verify') };
  }
  if (membershipsRequireMfa(memberships)) {
    return { mfaSetupRequired: true, mfaToken: signPendingToken(user.id, 'mfa-setup') };
  }
  return sessionPayload(user, memberships);
}

/** Strictest "Minimum password length" (Accounts → Security) across the given organizations. */
function passwordMinLength(organizations) {
  const values = (organizations || [])
    .map((o) => Number(o?.securitySettings?.passwordMinLength))
    .filter((n) => Number.isFinite(n) && n > 0);
  return Math.min(128, Math.max(6, values.length ? Math.max(...values) : DEFAULT_PASSWORD_MIN_LENGTH));
}

/** @returns {string|null} error message, or null when the password is acceptable */
function validateNewPassword(password, minLength) {
  const value = typeof password === 'string' ? password : '';
  if (value.length < minLength) return `Password must be at least ${minLength} characters`;
  if (value.length > 128) return 'Password must be at most 128 characters';
  if (!value.trim()) return 'Password cannot be blank';
  return null;
}

/**
 * Sessions issued before the user's last password change are no longer valid
 * ("sign out other devices"). `decoded` is the verified JWT payload (iat in seconds).
 */
function isSessionRevoked(user, decoded) {
  if (!user?.passwordChangedAt || !decoded?.iat) return false;
  const changedAtSec = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
  return decoded.iat < changedAtSec;
}

module.exports = {
  ORG_MEMBERSHIP_UID,
  listActiveMemberships,
  organizationPayload,
  sessionPayload,
  loginResponse,
  passwordMinLength,
  validateNewPassword,
  isSessionRevoked,
};
