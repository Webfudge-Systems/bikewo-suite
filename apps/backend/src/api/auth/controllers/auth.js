'use strict';

const jwt = require('jsonwebtoken');
const { createOrganizationOwnerMembership } = require('../../../utils/organization-role');
const { membershipSummary } = require('../../../utils/rbac');
const { normalizeUserUsername, uniqueUsernameFromEmail } = require('../../../utils/user-username');
const {
  authenticateClientCredentials,
  resolveClientSession,
  verifyClientToken,
  emailHasPortalAccess,
  loadClientAccount,
  serializeDedicatedPocUser,
  mapPortalSignupBody,
  buildSettingsProfile,
  validatePortalPassword,
  JWT_SECRET,
  CLIENT_ACCOUNT_UID,
  PORTAL_ACCESS_UID,
} = require('../../../utils/client-auth');
const {
  verifyLandingSignupSecret,
  ensureWebsiteClientAccount,
} = require('../../../utils/website-signup');
const { handleSimilarCompaniesRequest } = require('../../../utils/similar-companies-handler');
const {
  resolveClientPortalSession,
  clientAccountIdFromSession,
} = require('../../../utils/client-portal-request');
const {
  canManageMembers,
  listCompanyMembers,
  getCompanyMember,
  addCompanyMember,
  updateCompanyMember,
  deleteCompanyMember,
  setCompanyMemberSuspended,
  registerCompanyRole,
} = require('../../../utils/company-members');

const QRCode = require('qrcode');
const {
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
} = require('../../../utils/mfa');

const ORG_MEMBERSHIP_UID = 'api::organization-user.organization-user';
const CONTACT_UID = 'api::contact.contact';
const USER_UID = 'plugin::users-permissions.user';

function readBearerToken(ctx) {
  const authHeader = ctx.request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '');
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function listActiveMemberships(userId, withModules = false) {
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

async function ensureActiveOrganizationMembership(user) {
  let memberships = await listActiveMemberships(user.id, true);
  if (memberships.length > 0) return memberships;

  // Single-organization deployment: only bootstrap the BikeWo org when none exists yet.
  // Every later user must be invited into it via Accounts.
  const existingOrgs = await strapi.entityService.findMany('api::organization.organization', {
    fields: ['id'],
    limit: 1,
  });
  if (existingOrgs.length > 0) return [];

  const organization = await strapi.entityService.create('api::organization.organization', {
    data: {
      name: 'BikeWo',
      slug: 'bikewo',
      owner: user.id,
      status: 'active',
      onboardingCompleted: false,
    },
  });

  await createOrganizationOwnerMembership(strapi, {
    userId: user.id,
    organizationId: organization.id,
  });

  memberships = await listActiveMemberships(user.id, true);
  return memberships;
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

function sendError(ctx, status, message) {
  ctx.status = status;
  ctx.body = { data: null, error: { status, name: 'MfaError', message, details: {} } };
}

const TOO_MANY_ATTEMPTS = 'Too many incorrect codes. Please wait 10 minutes and try again.';

/**
 * Resolve the user for 2FA setup: either a signed-in user (Bearer session) enabling it from
 * their profile, or a user mid-login whose organization requires 2FA (mfaToken from /auth/login).
 */
async function resolveMfaSetupUser(ctx) {
  const pendingToken = ctx.request.body?.mfaToken;
  if (pendingToken) {
    const userId = verifyPendingToken(pendingToken, 'mfa-setup');
    if (!userId) return { error: 'Your sign-in session expired. Please sign in again.' };
    const user = await strapi.query(USER_UID).findOne({ where: { id: userId } });
    if (!user || user.blocked) return { error: 'User not found or blocked' };
    return { user, viaLogin: true };
  }
  if (!ctx.state.user?.id) return { error: 'Missing or invalid credentials' };
  const user = await strapi.query(USER_UID).findOne({ where: { id: ctx.state.user.id } });
  if (!user || user.blocked) return { error: 'User not found or blocked' };
  return { user, viaLogin: false };
}

/** Checks a 6-digit authenticator code, falling back to a one-time recovery code. */
async function checkUserCode(user, code) {
  if (verifyTotp(decryptSecret(user.mfaSecret), code)) return true;
  const remaining = consumeRecoveryCode(user.mfaRecoveryCodes, code);
  if (!remaining) return false;
  await strapi.query(USER_UID).update({ where: { id: user.id }, data: { mfaRecoveryCodes: remaining } });
  return true;
}

module.exports = {
  async signup(ctx) {
    const { email, password, firstName, lastName } = ctx.request.body;

    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }

    try {
      // Check if user exists
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return ctx.badRequest('Email already exists');
      }

      // Create user
      const normalizedEmail = email.toLowerCase();
      const user = await strapi.plugins['users-permissions'].services.user.add({
        username: await uniqueUsernameFromEmail(strapi, normalizedEmail),
        email: normalizedEmail,
        password,
        firstName,
        lastName,
        confirmed: true,
        blocked: false,
        provider: 'local'
      });

      // Generate JWT manually
      const token = jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const organizations = await ensureActiveOrganizationMembership(user);

      ctx.send({
        jwt: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        },
        organizations: organizations.map(organizationPayload)
      });
    } catch (error) {
      console.error('Signup error:', error);
      ctx.badRequest(error.message);
    }
  },

  async login(ctx) {
    const { identifier, password } = ctx.request.body;

    if (!identifier || !password) {
      return ctx.badRequest('Identifier and password are required');
    }

    try {
      // Validate credentials
      let user = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
          ]
        }
      });

      if (!user) {
        return ctx.badRequest('Invalid credentials');
      }

      // Validate password
      const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
        password,
        user.password
      );

      if (!validPassword) {
        return ctx.badRequest('Invalid credentials');
      }

      if (user.blocked) {
        return ctx.badRequest('Your account has been blocked');
      }
      user = await normalizeUserUsername(strapi, user);

      const memberships = await ensureActiveOrganizationMembership(user);

      // Password is correct; a second factor is still needed before a session is issued.
      if (user.mfaEnabled) {
        return ctx.send({ mfaRequired: true, mfaToken: signPendingToken(user.id, 'mfa-verify') });
      }
      if (membershipsRequireMfa(memberships)) {
        return ctx.send({ mfaSetupRequired: true, mfaToken: signPendingToken(user.id, 'mfa-setup') });
      }

      ctx.send(sessionPayload(user, memberships));
    } catch (error) {
      console.error('Login error:', error);
      ctx.badRequest(error.message);
    }
  },

  async clientLogin(ctx) {
    const { email, password } = ctx.request.body || {};

    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }

    try {
      const result = await authenticateClientCredentials(strapi, email, password);
      if (!result.ok) {
        return ctx.send({ error: { message: result.message } }, result.status);
      }

      ctx.send({
        jwt: result.jwt,
        token: result.token,
        account: result.account,
        contacts: result.contacts,
        contact: result.contact,
        type: 'client',
      });
    } catch (error) {
      console.error('Client login error:', error);
      ctx.badRequest(error.message);
    }
  },

  async clientSignup(ctx) {
    const body = ctx.request.body || {};
    const email = normalizeString(body.email);
    const password = normalizeString(body.password);

    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }
    if (password.length < 6) {
      return ctx.badRequest('Password must be at least 6 characters');
    }

    try {
      const mapped = mapPortalSignupBody(body);
      const provision = await ensureWebsiteClientAccount(strapi, mapped);
      if (!provision.ok) {
        return ctx.send(
          { error: { message: provision.error || 'Signup failed' } },
          provision.status || 400
        );
      }

      const loginResult = await authenticateClientCredentials(strapi, email, password);
      if (!loginResult.ok) {
        return ctx.send(
          { error: { message: loginResult.message || 'Account created but login failed' } },
          loginResult.status || 401
        );
      }

      ctx.send({
        success: true,
        jwt: loginResult.jwt,
        token: loginResult.token,
        account: loginResult.account,
        contacts: loginResult.contacts,
        contact: loginResult.contact,
        type: 'client',
      });
    } catch (error) {
      console.error('Client signup error:', error);
      ctx.badRequest(error.message);
    }
  },

  async clientVerifyOtp(ctx) {
    const { email, password } = ctx.request.body || {};
    if (!email) {
      return ctx.badRequest('Email is required');
    }

    try {
      const hasAccess = await emailHasPortalAccess(strapi, String(email));
      if (!hasAccess) {
        return ctx.send({ error: { message: 'Account not found' } }, 404);
      }

      if (password) {
        const loginResult = await authenticateClientCredentials(strapi, email, password);
        if (loginResult.ok) {
          return ctx.send({
            success: true,
            jwt: loginResult.jwt,
            token: loginResult.token,
            account: loginResult.account,
            contacts: loginResult.contacts,
            contact: loginResult.contact,
            type: 'client',
          });
        }
      }

      ctx.send({ success: true, message: 'Account verified' });
    } catch (error) {
      console.error('Client verify-otp error:', error);
      ctx.badRequest(error.message);
    }
  },

  async clientCheckEmail(ctx) {
    const email = ctx.query?.email || ctx.request.query?.email;
    if (!email || !String(email).includes('@')) {
      return ctx.badRequest('Valid email is required');
    }

    try {
      const exists = await emailHasPortalAccess(strapi, String(email));
      ctx.send({ exists });
    } catch (error) {
      console.error('Client check-email error:', error);
      ctx.send({ exists: false });
    }
  },

  async clientDedicatedPoc(ctx) {
    const token = readBearerToken(ctx);
    if (!token) {
      return ctx.unauthorized('Missing or invalid authorization header');
    }

    try {
      let decoded;
      try {
        decoded = verifyClientToken(token);
      } catch (err) {
        return ctx.unauthorized('Invalid or expired token');
      }

      const account = await loadClientAccount(strapi, decoded.clientAccountId);
      if (!account) {
        return ctx.notFound('Client account not found');
      }

      const dedicatedPoc = serializeDedicatedPocUser(account.assignedTo);
      const pocAssigned = Boolean(dedicatedPoc);

      ctx.send({
        pocAssigned,
        dedicatedPoc,
        pocAssignmentStatus: pocAssigned ? 'ASSIGNED' : 'UNASSIGNED',
        pocAssignedAt: pocAssigned ? account.updatedAt || null : null,
      });
    } catch (error) {
      console.error('Client dedicated-poc error:', error);
      ctx.badRequest(error.message);
    }
  },

  async websiteSignup(ctx) {
    if (!verifyLandingSignupSecret(ctx)) {
      return ctx.forbidden('Invalid or missing website signup secret.');
    }

    try {
      const result = await ensureWebsiteClientAccount(strapi, ctx.request.body || {});
      if (!result.ok) {
        return ctx.send(
          {
            error: result.error,
            primaryContactSync: result.primaryContactSync || null,
            defaultProjectSync: result.defaultProjectSync || null,
            clientPasswordSync: result.clientPasswordSync || null,
            companyNameSync: result.companyNameSync || null,
          },
          result.status || 400
        );
      }

      ctx.send(
        {
          clientAccount: result.data,
          data: result.data,
          primaryContactSync: result.primaryContactSync || null,
          defaultProjectSync: result.defaultProjectSync || null,
          clientPasswordSync: result.clientPasswordSync || null,
          companyNameSync: result.companyNameSync || null,
        },
        result.status || 200
      );
    } catch (error) {
      console.error('Website signup error:', error);
      ctx.badRequest(error.message);
    }
  },

  async websiteSimilarCompanies(ctx) {
    return handleSimilarCompaniesRequest(strapi, ctx);
  },

  async companyMembersList(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) {
      return ctx.badRequest('Client account not found in session');
    }

    try {
      const result = await listCompanyMembers(strapi, accountId);
      ctx.send(result);
    } catch (error) {
      console.error('Company members list error:', error);
      ctx.badRequest(error.message);
    }
  },

  async companyMemberFindOne(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) {
      return ctx.badRequest('Client account not found in session');
    }

    try {
      const member = await getCompanyMember(strapi, accountId, ctx.params.id);
      if (!member) {
        return ctx.notFound('Member not found');
      }
      ctx.send({ data: member });
    } catch (error) {
      console.error('Company member find error:', error);
      ctx.badRequest(error.message);
    }
  },

  async companyMembersCreate(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }
    if (!canManageMembers(session)) {
      return ctx.forbidden('You do not have permission to manage company members');
    }

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) {
      return ctx.badRequest('Client account not found in session');
    }

    try {
      const result = await addCompanyMember(strapi, accountId, ctx.request.body || {});
      if (!result.ok) {
        return ctx.send({ error: { message: result.message } }, result.status || 400);
      }
      ctx.send({ member: result.member });
    } catch (error) {
      console.error('Company member create error:', error);
      ctx.badRequest(error.message);
    }
  },

  async companyMembersUpdate(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }
    if (!canManageMembers(session)) {
      return ctx.forbidden('You do not have permission to manage company members');
    }

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) {
      return ctx.badRequest('Client account not found in session');
    }

    try {
      const result = await updateCompanyMember(
        strapi,
        accountId,
        ctx.params.id,
        ctx.request.body || {}
      );
      if (!result.ok) {
        return ctx.send({ error: { message: result.message } }, result.status || 400);
      }
      ctx.send({ member: result.member });
    } catch (error) {
      console.error('Company member update error:', error);
      ctx.badRequest(error.message);
    }
  },

  async companyMembersDelete(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }
    if (!canManageMembers(session)) {
      return ctx.forbidden('You do not have permission to manage company members');
    }

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) {
      return ctx.badRequest('Client account not found in session');
    }

    try {
      const result = await deleteCompanyMember(strapi, accountId, ctx.params.id);
      if (!result.ok) {
        return ctx.send({ error: { message: result.message } }, result.status || 400);
      }
      ctx.send({ success: true });
    } catch (error) {
      console.error('Company member delete error:', error);
      ctx.badRequest(error.message);
    }
  },

  async companyMemberSuspend(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }
    if (!canManageMembers(session)) {
      return ctx.forbidden('You do not have permission to manage company members');
    }

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) {
      return ctx.badRequest('Client account not found in session');
    }

    const body = ctx.request.body || {};
    const suspend = body.suspend !== false;

    try {
      const result = await setCompanyMemberSuspended(
        strapi,
        accountId,
        ctx.params.id,
        suspend
      );
      if (!result.ok) {
        return ctx.send({ error: { message: result.message } }, result.status || 400);
      }
      ctx.send({ member: result.member });
    } catch (error) {
      console.error('Company member suspend error:', error);
      ctx.badRequest(error.message);
    }
  },

  async companyRolesCreate(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }
    if (!canManageMembers(session)) {
      return ctx.forbidden('You do not have permission to manage company members');
    }

    const body = ctx.request.body || {};
    const result = registerCompanyRole(body.name);
    if (!result.ok) {
      return ctx.send({ error: { message: result.message } }, result.status || 400);
    }
    ctx.send({ role: result.role });
  },

  async updateProfile(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) {
      return ctx.badRequest('Client account not found');
    }

    try {
      const account = await loadClientAccount(strapi, accountId);
      if (!account) {
        return ctx.notFound('Client account not found');
      }

      const body = ctx.request.body || {};
      const incomingOnboardingData =
        body.onboardingData && typeof body.onboardingData === 'object'
          ? body.onboardingData
          : {};
      const incomingContact =
        body.contact && typeof body.contact === 'object' ? body.contact : {};

      const onboardingData =
        account.onboardingData && typeof account.onboardingData === 'object'
          ? { ...account.onboardingData }
          : {};
      const mergedOnboardingData = {
        ...onboardingData,
        ...incomingOnboardingData,
      };

      const preferences =
        mergedOnboardingData.preferences &&
        typeof mergedOnboardingData.preferences === 'object'
          ? { ...mergedOnboardingData.preferences }
          : {};

      if (body.notifications && typeof body.notifications === 'object') {
        preferences.notifications = {
          email: body.notifications.email !== false,
          projectUpdates: body.notifications.projectUpdates !== false,
          messages: body.notifications.messages !== false,
        };
      }

      mergedOnboardingData.preferences = preferences;

      await strapi.entityService.update(CLIENT_ACCOUNT_UID, accountId, {
        data: { onboardingData: mergedOnboardingData },
      });

      const portalAccessId = session.portalAccessId || session.contact?.portalAccess?.id;
      const access = portalAccessId
        ? await strapi.entityService.findOne(PORTAL_ACCESS_UID, portalAccessId, {
            populate: ['contact'],
          })
        : null;
      const contactId =
        session.contact?.id ?? access?.contact?.id ?? access?.contact;

      if (incomingContact && contactId) {
        const contactData = {};
        if (incomingContact.firstName !== undefined)
          contactData.firstName = incomingContact.firstName;
        if (incomingContact.lastName !== undefined)
          contactData.lastName = incomingContact.lastName;
        if (incomingContact.phone !== undefined)
          contactData.phone = incomingContact.phone;
        if (incomingContact.jobTitle !== undefined)
          contactData.jobTitle = incomingContact.jobTitle;

        if (Object.keys(contactData).length > 0) {
          await strapi.entityService.update(CONTACT_UID, contactId, {
            data: contactData,
          });
        }
      }

      const contact = contactId
        ? await strapi.entityService.findOne(CONTACT_UID, contactId, {
            populate: ['clientAccount'],
          })
        : null;
      const updatedAccount = await loadClientAccount(strapi, accountId);

      ctx.send({
        success: true,
        profile: buildSettingsProfile(contact, access, updatedAccount),
        account: session.account,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      ctx.badRequest(error.message || 'Failed to update profile');
    }
  },

  async changePassword(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) {
      return ctx.unauthorized('Client authentication required');
    }

    const { currentPassword, newPassword } = ctx.request.body || {};
    if (!currentPassword || !newPassword) {
      return ctx.badRequest('Current and new password are required');
    }
    if (String(newPassword).length < 8) {
      return ctx.badRequest('New password must be at least 8 characters');
    }

    const portalAccessId = session.portalAccessId || session.contact?.portalAccess?.id;
    if (!portalAccessId) {
      return ctx.badRequest('Portal access not found');
    }

    try {
      const access = await strapi.entityService.findOne(PORTAL_ACCESS_UID, portalAccessId);
      if (!access) {
        return ctx.notFound('Portal access not found');
      }

      const valid = await validatePortalPassword(
        strapi,
        currentPassword,
        access.password
      );
      if (!valid) {
        return ctx.badRequest('Current password is incorrect');
      }

      await strapi.entityService.update(PORTAL_ACCESS_UID, portalAccessId, {
        data: {
          password: newPassword,
          forcePasswordReset: false,
        },
      });

      ctx.send({ success: true });
    } catch (error) {
      console.error('Change password error:', error);
      ctx.badRequest(error.message || 'Failed to change password');
    }
  },

  async me(ctx) {
    try {
      const token = readBearerToken(ctx);
      if (!token) {
        return ctx.unauthorized('Missing or invalid authorization header');
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return ctx.unauthorized('Invalid or expired token');
      }

      if (typeof decoded === 'string' || !decoded) {
        return ctx.unauthorized('Invalid token format');
      }

      if (decoded.type === 'client' && decoded.portalAccessId) {
        const session = await resolveClientSession(strapi, decoded.portalAccessId);
        if (!session) {
          return ctx.unauthorized('Client session not found');
        }
        return ctx.send(session);
      }

      if (!decoded.id) {
        return ctx.unauthorized('Invalid token format');
      }

      let user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: decoded.id },
      });

      if (!user || user.blocked) {
        return ctx.unauthorized('User not found or blocked');
      }
      user = await normalizeUserUsername(strapi, user);

      const organizations = await ensureActiveOrganizationMembership(user);

      ctx.send({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          mfaEnabled: !!user.mfaEnabled,
          mfaRequiredByOrg: membershipsRequireMfa(organizations),
        },
        organizations: organizations.map(organizationPayload),
      });
    } catch (error) {
      console.error('Me error:', error);
      ctx.badRequest(error.message);
    }
  },

  /** Second login step: exchange the pending token + authenticator (or recovery) code for a session. */
  async mfaVerify(ctx) {
    const { mfaToken, code } = ctx.request.body || {};
    const userId = verifyPendingToken(mfaToken, 'mfa-verify');
    if (!userId) return sendError(ctx, 401, 'Your sign-in session expired. Please sign in again.');
    if (isLocked(userId)) return sendError(ctx, 429, TOO_MANY_ATTEMPTS);

    try {
      let user = await strapi.query(USER_UID).findOne({ where: { id: userId } });
      if (!user || user.blocked || !user.mfaEnabled) {
        return sendError(ctx, 401, 'Your sign-in session expired. Please sign in again.');
      }
      if (!(await checkUserCode(user, code))) {
        recordFailure(userId);
        return sendError(ctx, 400, 'That code is not valid. Check your authenticator app and try again.');
      }
      clearFailures(userId);
      user = await normalizeUserUsername(strapi, user);
      const memberships = await ensureActiveOrganizationMembership(user);
      ctx.send(sessionPayload(user, memberships));
    } catch (error) {
      console.error('MFA verify error:', error);
      ctx.badRequest(error.message);
    }
  },

  /** Start enrolment: generate a secret and return it with a QR code for the authenticator app. */
  async mfaSetup(ctx) {
    try {
      const { user, error } = await resolveMfaSetupUser(ctx);
      if (error) return sendError(ctx, 401, error);
      if (user.mfaEnabled) return sendError(ctx, 400, 'Two-factor authentication is already turned on.');

      const secret = generateSecret();
      await strapi.query(USER_UID).update({
        where: { id: user.id },
        data: { mfaPendingSecret: encryptSecret(secret) },
      });
      const url = otpauthUrl(secret, user.email);
      ctx.send({ secret, otpauthUrl: url, qrDataUrl: await QRCode.toDataURL(url, { margin: 1, width: 220 }) });
    } catch (error) {
      console.error('MFA setup error:', error);
      ctx.badRequest(error.message);
    }
  },

  /** Finish enrolment by confirming a code from the app; returns one-time recovery codes. */
  async mfaEnable(ctx) {
    try {
      const { user, viaLogin, error } = await resolveMfaSetupUser(ctx);
      if (error) return sendError(ctx, 401, error);
      if (user.mfaEnabled) return sendError(ctx, 400, 'Two-factor authentication is already turned on.');
      if (isLocked(user.id)) return sendError(ctx, 429, TOO_MANY_ATTEMPTS);

      const pending = decryptSecret(user.mfaPendingSecret);
      if (!pending) return sendError(ctx, 400, 'Setup expired. Please start again.');
      if (!verifyTotp(pending, ctx.request.body?.code)) {
        recordFailure(user.id);
        return sendError(ctx, 400, 'That code is not valid. Check your authenticator app and try again.');
      }
      clearFailures(user.id);

      const { codes, hashes } = generateRecoveryCodes();
      await strapi.query(USER_UID).update({
        where: { id: user.id },
        data: {
          mfaEnabled: true,
          mfaSecret: user.mfaPendingSecret,
          mfaPendingSecret: null,
          mfaRecoveryCodes: hashes,
        },
      });

      const response = { recoveryCodes: codes };
      if (viaLogin) {
        const fresh = await normalizeUserUsername(strapi, user);
        Object.assign(response, sessionPayload(fresh, await ensureActiveOrganizationMembership(fresh)));
      }
      ctx.send(response);
    } catch (error) {
      console.error('MFA enable error:', error);
      ctx.badRequest(error.message);
    }
  },

  /** Turn 2FA off (signed-in user, confirmed with a current code). Blocked while the org requires it. */
  async mfaDisable(ctx) {
    if (!ctx.state.user?.id) return sendError(ctx, 401, 'Missing or invalid credentials');
    try {
      const user = await strapi.query(USER_UID).findOne({ where: { id: ctx.state.user.id } });
      if (!user?.mfaEnabled) return sendError(ctx, 400, 'Two-factor authentication is not turned on.');
      const memberships = await listActiveMemberships(user.id);
      if (membershipsRequireMfa(memberships)) {
        return sendError(ctx, 403, 'Your organization requires two-factor authentication, so it cannot be turned off.');
      }
      if (isLocked(user.id)) return sendError(ctx, 429, TOO_MANY_ATTEMPTS);
      if (!(await checkUserCode(user, ctx.request.body?.code))) {
        recordFailure(user.id);
        return sendError(ctx, 400, 'That code is not valid. Check your authenticator app and try again.');
      }
      clearFailures(user.id);
      await strapi.query(USER_UID).update({
        where: { id: user.id },
        data: { mfaEnabled: false, mfaSecret: null, mfaPendingSecret: null, mfaRecoveryCodes: null },
      });
      ctx.send({ mfaEnabled: false });
    } catch (error) {
      console.error('MFA disable error:', error);
      ctx.badRequest(error.message);
    }
  },
};
