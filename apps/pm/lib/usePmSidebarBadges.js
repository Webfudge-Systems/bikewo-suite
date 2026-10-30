'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@webfudge/auth'
import notificationService from './api/notificationService'

function getCurrentUserId(user) {
  if (!user) return null
  const u = user.attributes || user
  return u.id ?? user.id ?? u.documentId ?? user.documentId ?? null
}

function isUnread(n) {
  const attrs = n?.attributes || n
  return !(attrs?.isRead || attrs?.read || n?.isRead)
}

/**
 * Polls unread notification count for the Inbox sidebar badge.
 */
export function usePmSidebarBadges(pollMs = 30000) {
  const { user } = useAuth()
  const [inboxCount, setInboxCount] = useState(0)

  const refresh = useCallback(async () => {
    const userId = getCurrentUserId(user)
    if (!userId) {
      setInboxCount(0)
      return
    }
    try {
      const list = await notificationService.getNotifications(userId, { pageSize: 100 })
      const rows = Array.isArray(list) ? list : []
      setInboxCount(rows.filter(isUnread).length)
    } catch {
      setInboxCount(0)
    }
  }, [user])

  useEffect(() => {
    void refresh()
    const id = setInterval(refresh, pollMs)
    return () => clearInterval(id)
  }, [refresh, pollMs])

  return { inboxCount, refresh }
}
