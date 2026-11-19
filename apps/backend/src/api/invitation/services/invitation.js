'use strict';

/**
 * invitation service — email invitations (Resend) and the "Add directly" fallback.
 */

const { createCoreService } = require('@strapi/strapi').factories;
const crypto = require('crypto');
const { uniqueUsernameFromEmail } = require('../../../utils/user-username');
const { ORG_ROLE_UID, resolveOrganizationRoleIdForOrg } = require('../../../utils/organization-role');
const { logAccountsActivity, actorDisplayName } = require('../../../utils/crm-activity-log');
const { applyMembershipDepartments, normalizeIdList } = require('../../../utils/department-membership');
const { sendEmail, layoutHtml, escapeHtml } = require('../../../utils/email');
const {
  ORG_MEMBERSHIP_UID,
  listActiveMemberships,
  loginResponse,
  passwordMinLength,
  validateNewPassword,
} = require('../../../utils/login-session');

const INVITATION_UID = 'api::invitation.invitation';
const ORGANIZATION_UID = 'api::organization.organization';
const USER_UID = 'plugin::users-permissions.user';
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function accountsAppUrl() {
  return String(process.env.ACCOUNTS_APP_URL || 'http://localhost:3003').replace(/\/+$/, '');
}

function inviteUrlFor(token) {
  return `${accountsAppUrl()}/invite/${token}`;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function relationIdOf(value) {
  if (value == null) return null;
  return typeof value === 'object' ? value.id ?? null : value;
}

function personName(user) {
  if (!user) return '';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return full || user.username || user.email || '';
}

class InvitationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

module.exports = createCoreService(INVITATION_UID, ({ strapi }) => ({
  async roleInfo(organizationId, role) {
    const roleId = await resolveOrganizationRoleIdForOrg(strapi, role || 'Member', organizationId);
    /** @type {any} */
    const roleDoc = await strapi.entityService.findOne(ORG_ROLE_UID, roleId, { fields: ['name', 'code'] });
    return {
      roleId,
      roleLabel: roleDoc?.name || String(role || 'Member'),
      roleCode: roleDoc?.code || String(role || 'member'),
    };
  },

  async sendInvitationEmail({ email, token, organizationName, roleLabel, invitedByName }) {
    const inviteLink = inviteUrlFor(token);
    const subject = `You're invited to join ${organizationName} on BikeWo Suite`;
    const inviter = invitedByName ? `${invitedByName} has invited you` : 'You have been invited';
    const text = [
      `${inviter} to join ${organizationName} as ${roleLabel}.`,
      '',
      `Accept the invitation and create your password: ${inviteLink}`,
      '',
      'This invitation expires in 7 days. If you were not expecting it, you can ignore this email.',
    ].join('\n');
    const html = layoutHtml({
      heading: `Join ${organizationName}`,
      paragraphs: [
        `${escapeHtml(inviter)} to join <strong>${escapeHtml(organizationName)}</strong> as <strong>${escapeHtml(roleLabel)}</strong>.`,
        'Accept the invitation to create your password and get access to CRM, Project Management and Accounts.',
      ],
      button: { href: inviteLink, label: 'Accept invitation' },
      footer: 'This invitation expires in 7 days. If you were not expecting it, you can ignore this email.',
    });
    return sendEmail({ to: email, subject, text, html });
  },

  async addUserDirectly({
    organizationId,
    email,
    addedById,
    role = 'Member',
    customPermissions = {},
    password,
    sendWelcomeEmail = true,
    departmentIds = [],
    primaryDepartmentId = null,
  }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    const roleId = await resolveOrganizationRoleIdForOrg(strapi, role || 'Member', organizationId);
    const generatedPassword = password || crypto.randomBytes(8).toString('hex');

    let user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: normalizedEmail },
    });

    let createdUser = false;
    if (!user) {
      user = await strapi.plugins['users-permissions'].services.user.add({
        username: await uniqueUsernameFromEmail(strapi, normalizedEmail),
        email: normalizedEmail,
        password: generatedPassword,
        confirmed: true,
        blocked: false,
      });
      createdUser = true;
    }

    const existingMembership = await strapi.entityService.findMany('api::organization-user.organization-user', {
      filters: {
        user: user.id,
        organization: organizationId,
      },
      limit: 1,
    });

    let membership;
    if (existingMembership.length > 0) {
      membership = await strapi.entityService.update(
        'api::organization-user.organization-user',
        existingMembership[0].id,
        {
          data: {
            role: roleId,
            customPermissions: customPermissions || {},
            isActive: true,
          },
        }
      );
    } else {
      membership = await strapi.entityService.create('api::organization-user.organization-user', {
        data: {
          user: user.id,
          organization: organizationId,
          role: roleId,
          customPermissions: customPermissions || {},
          isActive: true,
          joinedAt: new Date(),
          publishedAt: new Date(),
        },
      });
    }

    if (departmentIds?.length) {
      membership = await applyMembershipDepartments(strapi, membership.id, organizationId, {
        departmentIds,
        primaryDepartmentId,
      });
    }

    /** @type {any} */
    const roleDoc = await strapi.entityService.findOne(ORG_ROLE_UID, roleId, { fields: ['name'] });
    const roleLabel = roleDoc?.name || String(role || 'Member');

    try {
      const actorName = await actorDisplayName(strapi, addedById);
      const reactivated = existingMembership.length > 0;
      const summary = createdUser
        ? `${actorName} added ${normalizedEmail} to the organization as ${roleLabel} (new account)`
        : reactivated
          ? `${actorName} reactivated ${normalizedEmail} in the organization as ${roleLabel}`
          : `${actorName} added ${normalizedEmail} to the organization as ${roleLabel}`;
      await logAccountsActivity(strapi, {
        organizationId,
        actorUserId: addedById,
        action: reactivated ? 'update' : 'create',
        subjectType: 'organization_user',
        subjectId: membership.id,
        summary,
        meta: {
          email: normalizedEmail,
          role: roleLabel,
          createdUser,
          module: 'accounts',
        },
      });
    } catch (_) {
      /* logging is best-effort */
    }

    if (sendWelcomeEmail) {
      const organization = await strapi.entityService.findOne('api::organization.organization', organizationId, {
        fields: ['name'],
      });
      const subject = `You've been added to ${organization?.name || 'an organization'}`;
      const text = createdUser
        ? [
            `You were added directly to ${organization?.name || 'an organization'} as ${roleLabel}.`,
            `Login email: ${normalizedEmail}`,
            `Temporary password: ${generatedPassword}`,
            '',
            'Please login and change your password.',
          ].join('\n')
        : `You were added directly to ${organization?.name || 'an organization'} as ${roleLabel}.`;

      await sendEmail({
        to: normalizedEmail,
        subject,
        text,
        html: layoutHtml({
          heading: subject,
          paragraphs: text.split('\n').filter(Boolean).map(escapeHtml),
          button: { href: accountsAppUrl(), label: 'Sign in' },
        }),
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      membership,
      createdUser,
    };
  },

  /**
   * Invite people by email. Returns one entry per email with whether the email went out and the
   * link (so the admin can share it by hand when email is not configured).
   */
  async createInvitations(organizationId, emails, invitedById, role = 'Member', permissions = {}, departmentIds = []) {
    const list = [...new Set((Array.isArray(emails) ? emails : [emails]).map(normalizeEmail).filter(Boolean))];
    if (!list.length) throw new InvitationError('Enter at least one email address');
    const invalid = list.find((e) => !isValidEmail(e));
    if (invalid) throw new InvitationError(`"${invalid}" is not a valid email address`);

    const organization = await strapi.entityService.findOne(ORGANIZATION_UID, organizationId, { fields: ['name'] });
    const organizationName = organization?.name || 'BikeWo';
    const { roleLabel, roleCode } = await this.roleInfo(organizationId, role);
    const inviter = invitedById ? await strapi.query(USER_UID).findOne({ where: { id: invitedById } }) : null;
    const invitedByName = personName(inviter);
    const deptIds = normalizeIdList(departmentIds);

    const results = [];
    for (const email of list) {
      const existingUser = await strapi.query(USER_UID).findOne({ where: { email } });
      if (existingUser) {
        const active = await strapi.entityService.findMany(ORG_MEMBERSHIP_UID, {
          filters: { user: existingUser.id, organization: organizationId, isActive: true },
          limit: 1,
        });
        if (active.length) {
          results.push({ email, skipped: true, reason: 'Already a member of this organization' });
          continue;
        }
      }

      // Only the newest invitation for an email stays usable.
      await this.expirePending(organizationId, email);

      const token = crypto.randomBytes(32).toString('hex');
      const invitation = await strapi.entityService.create(INVITATION_UID, {
        data: {
          email,
          organization: organizationId,
          invitedBy: invitedById,
          role: roleCode,
          permissions: permissions || {},
          departmentIds: deptIds,
          token,
          status: 'pending',
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          publishedAt: new Date(),
        },
      });

      const mail = await this.sendInvitationEmail({ email, token, organizationName, roleLabel, invitedByName });

      try {
        await logAccountsActivity(strapi, {
          organizationId,
          actorUserId: invitedById,
          action: 'create',
          subjectType: 'invitation',
          subjectId: invitation.id,
          summary: `${invitedByName || 'An admin'} invited ${email} as ${roleLabel}`,
          meta: { email, role: roleLabel, emailSent: mail.sent, module: 'accounts' },
        });
      } catch (_) {
        /* logging is best-effort */
      }

      results.push({
        id: invitation.id,
        email,
        role: roleLabel,
        expiresAt: invitation.expiresAt,
        emailSent: mail.sent,
        inviteUrl: inviteUrlFor(token),
      });
    }
    return results;
  },

  async expirePending(organizationId, email) {
    const pending = await strapi.entityService.findMany(INVITATION_UID, {
      filters: { organization: organizationId, email, status: 'pending' },
      fields: ['id'],
    });
    for (const inv of pending) {
      await strapi.entityService.update(INVITATION_UID, inv.id, { data: { status: 'expired' } });
    }
  },

  /** Pending (not yet accepted or revoked) invitations for the Accounts users page. */
  async listPending(organizationId) {
    const rows = await strapi.entityService.findMany(INVITATION_UID, {
      filters: { organization: organizationId, status: 'pending' },
      sort: { createdAt: 'DESC' },
      populate: { invitedBy: { fields: ['id', 'email', 'username', 'firstName', 'lastName'] } },
    });
    const now = Date.now();
    const roleNames = new Map();
    const out = [];
    for (const inv of /** @type {any[]} */ (rows)) {
      if (!roleNames.has(inv.role)) {
        try {
          roleNames.set(inv.role, (await this.roleInfo(organizationId, inv.role)).roleLabel);
        } catch (_) {
          roleNames.set(inv.role, inv.role);
        }
      }
      out.push({
        id: inv.id,
        email: inv.email,
        role: roleNames.get(inv.role),
        invitedBy: personName(inv.invitedBy) || null,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        expired: new Date(inv.expiresAt).getTime() < now,
      });
    }
    return out;
  },

  async findForOrg(organizationId, invitationId) {
    const rows = await strapi.entityService.findMany(INVITATION_UID, {
      filters: { id: invitationId, organization: organizationId },
      limit: 1,
    });
    return rows[0] || null;
  },

  /** New token + 7 more days, then email it again. */
  async resend(organizationId, invitationId, actorUserId) {
    const inv = await this.findForOrg(organizationId, invitationId);
    if (!inv || inv.status !== 'pending') throw new InvitationError('Invitation not found or already used', 404);

    const token = crypto.randomBytes(32).toString('hex');
    const updated = await strapi.entityService.update(INVITATION_UID, inv.id, {
      data: { token, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
    });
    const organization = await strapi.entityService.findOne(ORGANIZATION_UID, organizationId, { fields: ['name'] });
    const { roleLabel } = await this.roleInfo(organizationId, inv.role);
    const actor = actorUserId ? await strapi.query(USER_UID).findOne({ where: { id: actorUserId } }) : null;
    const mail = await this.sendInvitationEmail({
      email: inv.email,
      token,
      organizationName: organization?.name || 'BikeWo',
      roleLabel,
      invitedByName: personName(actor),
    });

    try {
      await logAccountsActivity(strapi, {
        organizationId,
        actorUserId,
        action: 'update',
        subjectType: 'invitation',
        subjectId: inv.id,
        summary: `${personName(actor) || 'An admin'} resent the invitation to ${inv.email}`,
        meta: { email: inv.email, emailSent: mail.sent, module: 'accounts' },
      });
    } catch (_) {
      /* logging is best-effort */
    }

    return {
      id: inv.id,
      email: inv.email,
      expiresAt: updated.expiresAt,
      emailSent: mail.sent,
      inviteUrl: inviteUrlFor(token),
    };
  },

  async revoke(organizationId, invitationId, actorUserId) {
    const inv = await this.findForOrg(organizationId, invitationId);
    if (!inv || inv.status !== 'pending') throw new InvitationError('Invitation not found or already used', 404);
    await strapi.entityService.update(INVITATION_UID, inv.id, { data: { status: 'expired' } });
    try {
      const actorName = await actorDisplayName(strapi, actorUserId);
      await logAccountsActivity(strapi, {
        organizationId,
        actorUserId,
        action: 'delete',
        subjectType: 'invitation',
        subjectId: inv.id,
        summary: `${actorName} revoked the invitation to ${inv.email}`,
        meta: { email: inv.email, status: 'revoked', module: 'accounts' },
      });
    } catch (_) {
      /* logging is best-effort */
    }
    return { id: inv.id, email: inv.email };
  },

  /** Usable pending invitation by token (with its organization), `{ expired: true }`, or null. */
  async findUsable(token) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
    const rows = await strapi.entityService.findMany(INVITATION_UID, {
      filters: { token, status: 'pending' },
      populate: {
        organization: { fields: ['id', 'name', 'securitySettings'] },
        invitedBy: { fields: ['id', 'email', 'username', 'firstName', 'lastName'] },
      },
      limit: 1,
    });
    /** @type {any} */
    const inv = rows[0];
    if (!inv) return null;
    if (new Date(inv.expiresAt).getTime() < Date.now()) return { expired: true };
    return inv;
  },

  /** Safe summary for the public accept page (no ids, no settings). */
  async describe(token) {
    const inv = await this.findUsable(token);
    if (!inv) return { valid: false, message: 'This invitation link is invalid or has already been used.' };
    if (inv.expired) return { valid: false, message: 'This invitation has expired. Ask your admin to send a new one.' };
    const organizationId = relationIdOf(inv.organization);
    const { roleLabel } = await this.roleInfo(organizationId, inv.role);
    const existingUser = await strapi.query(USER_UID).findOne({ where: { email: normalizeEmail(inv.email) } });
    return {
      valid: true,
      email: inv.email,
      organizationName: inv.organization?.name || 'BikeWo',
      roleLabel,
      invitedByName: personName(inv.invitedBy) || null,
      existingUser: Boolean(existingUser),
      passwordMinLength: passwordMinLength([inv.organization]),
    };
  },

  /**
   * Accept an invitation.
   * - New person: creates the account with the password they chose (org minimum length applies).
   * - Existing account: they must confirm it with their current password.
   * Returns the same response as /auth/login, so 2FA (and "Require MFA" setup) still applies.
   */
  async acceptInvitation({ token, password, firstName, lastName }) {
    const inv = await this.findUsable(token);
    if (!inv) throw new InvitationError('This invitation link is invalid or has already been used.');
    if (inv.expired) throw new InvitationError('This invitation has expired. Ask your admin to send a new one.');

    const organizationId = relationIdOf(inv.organization);
    const email = normalizeEmail(inv.email);
    const userService = strapi.plugins['users-permissions'].services.user;

    let user = await strapi.query(USER_UID).findOne({ where: { email } });
    let createdUser = false;

    if (user) {
      if (user.blocked) throw new InvitationError('This account is suspended. Contact your admin.', 403);
      const ok = password && user.password ? await userService.validatePassword(password, user.password) : false;
      if (!ok) throw new InvitationError('That password is not correct for this account.');
    } else {
      const minLength = passwordMinLength([inv.organization]);
      const problem = validateNewPassword(password, minLength);
      if (problem) throw new InvitationError(problem);
      const first = String(firstName || '').trim().slice(0, 80);
      const last = String(lastName || '').trim().slice(0, 80);
      if (!first) throw new InvitationError('Enter your first name');
      user = await userService.add({
        username: await uniqueUsernameFromEmail(strapi, email),
        email,
        password,
        firstName: first,
        lastName: last || null,
        confirmed: true,
        blocked: false,
        provider: 'local',
      });
      createdUser = true;
    }

    const { roleId, roleLabel } = await this.roleInfo(organizationId, inv.role);
    const existing = await strapi.entityService.findMany(ORG_MEMBERSHIP_UID, {
      filters: { user: user.id, organization: organizationId },
      limit: 1,
    });
    let membership;
    if (existing.length) {
      membership = await strapi.entityService.update(ORG_MEMBERSHIP_UID, existing[0].id, {
        data: { role: roleId, customPermissions: inv.permissions || {}, isActive: true },
      });
    } else {
      membership = await strapi.entityService.create(ORG_MEMBERSHIP_UID, {
        data: {
          user: user.id,
          organization: organizationId,
          role: roleId,
          customPermissions: inv.permissions || {},
          isActive: true,
          joinedAt: new Date(),
          publishedAt: new Date(),
        },
      });
    }

    const deptIds = normalizeIdList(inv.departmentIds);
    if (deptIds.length) {
      try {
        await applyMembershipDepartments(strapi, membership.id, organizationId, { departmentIds: deptIds });
      } catch (err) {
        console.warn('[invitation] could not apply departments:', err?.message || err);
      }
    }

    await strapi.entityService.update(INVITATION_UID, inv.id, {
      data: { status: 'accepted', acceptedAt: new Date() },
    });

    try {
      await logAccountsActivity(strapi, {
        organizationId,
        actorUserId: user.id,
        action: existing.length ? 'update' : 'create',
        subjectType: 'organization_user',
        subjectId: membership.id,
        summary: `${email} accepted an invitation and joined as ${roleLabel}${createdUser ? ' (new account)' : ''}`,
        meta: { email, role: roleLabel, invitationId: inv.id, createdUser, module: 'accounts' },
      });
      await logAccountsActivity(strapi, {
        organizationId,
        actorUserId: user.id,
        action: 'update',
        subjectType: 'invitation',
        subjectId: inv.id,
        summary: `Invitation for ${email} was accepted`,
        meta: { email, status: 'accepted', module: 'accounts' },
      });
    } catch (_) {
      /* logging is best-effort */
    }

    const fresh = await strapi.query(USER_UID).findOne({ where: { id: user.id } });
    const memberships = await listActiveMemberships(strapi, user.id, true);
    return loginResponse(fresh, memberships);
  },
}));

module.exports.InvitationError = InvitationError;
