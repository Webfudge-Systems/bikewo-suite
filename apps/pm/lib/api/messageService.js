import strapiClient from '../strapiClient'

function flattenEntry(entry) {
  if (!entry) return null
  if (entry.attributes && typeof entry.attributes === 'object') {
    return { id: entry.id, documentId: entry.documentId, ...entry.attributes }
  }
  return entry
}

/**
 * Display name for org member / user object from API.
 */
export function memberDisplayName(u) {
  const x = flattenEntry(u) || {}
  const fn = (x.firstName || '').trim()
  const ln = (x.lastName || '').trim()
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ')
  if (x.username) return String(x.username)
  if (x.email) return x.email.split('@')[0]
  return 'User'
}

/**
 * GET /organizations/:id/users — active members (excludes current user in UI).
 */
export async function fetchOrganizationMembers() {
  const orgId = strapiClient.getCurrentOrgId()
  if (!orgId) {
    return { members: [], error: 'no_org' }
  }
  const res = await strapiClient.request(`/organizations/${orgId}/users`, { method: 'GET' })
  const rows = Array.isArray(res?.data) ? res.data : []
  const members = rows
    .map((ou) => {
      /** Backend returns flat user rows (`GET /organizations/:id/users`), not always `{ user }`. */
      const raw = ou?.user || ou?.attributes?.user || ou
      const u = flattenEntry(raw) || raw
      if (!u || u.id == null) return null
      return {
        id: u.id,
        documentId: u.documentId,
        email: u.email,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        name: memberDisplayName(u),
      }
    })
    .filter(Boolean)
  return { members, error: null }
}

/**
 * Users for PM assignee dropdowns: organization members when `current-org-id` is set.
 * Falls back to GET /users when org list is empty or the org request fails.
 */
/** Normalize Strapi user entry for assignee / mention lists. */
export function normalizeContactUser(entry) {
  if (!entry) return null
  const flat =
    entry.attributes && typeof entry.attributes === 'object'
      ? { id: entry.id, documentId: entry.documentId, ...entry.attributes }
      : entry
  if (flat.id == null) return null
  return {
    id: flat.id,
    documentId: flat.documentId,
    email: flat.email,
    username: flat.username,
    firstName: flat.firstName,
    lastName: flat.lastName,
    name: memberDisplayName(flat),
  }
}

/**
 * Full organization roster for project PM / assignee pickers.
 * Uses GET /organizations/:id/users first; falls back to assignable-users list.
 */
export async function fetchProjectDirectoryUsers() {
  try {
    const { members, error } = await fetchOrganizationMembers()
    if (error !== 'no_org' && members?.length) return members
  } catch (e) {
    console.warn('fetchProjectDirectoryUsers: organization members unavailable', e)
  }
  return fetchPmAssignableUsers()
}

export async function fetchPmAssignableUsers() {
  try {
    const { members } = await fetchOrganizationMembers()
    if (members?.length) return members
  } catch (e) {
    console.warn('fetchPmAssignableUsers: organization members unavailable', e)
  }
  try {
    const res = await strapiClient.get('/users', {
      'pagination[page]': 1,
      'pagination[pageSize]': 200,
    })
    const raw = Array.isArray(res) ? res : res?.data ?? []
    const list = Array.isArray(raw) ? raw : []
    return list.map(normalizeContactUser).filter(Boolean)
  } catch (e) {
    console.error('fetchPmAssignableUsers: GET /users failed', e)
    return []
  }
}

export default {
  fetchOrganizationMembers,
  fetchProjectDirectoryUsers,
  fetchPmAssignableUsers,
  memberDisplayName,
  normalizeContactUser,
}
