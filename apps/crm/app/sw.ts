import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
})

serwist.addEventListeners()

// Web Push: Chrome / desktop notifications sent by the backend (src/utils/web-push.js).
self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; tag?: string; url?: string; absoluteUrl?: string | null } = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'BikeWo', {
      body: data.body || '',
      icon: '/favicon/web-app-manifest-192x192.png',
      badge: '/favicon/favicon-96x96.png',
      tag: data.tag,
      data: { url: data.absoluteUrl || data.url || '/' },
    })
  )
})

// Clicking a notification focuses an open tab of this app (navigating it) or opens a new one.
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const sameOrigin = new URL(target).origin === self.location.origin
      const existing = sameOrigin ? windows.find((w) => new URL(w.url).origin === self.location.origin) : undefined
      if (existing) {
        await existing.focus()
        await existing.navigate(target)
        return
      }
      await self.clients.openWindow(target)
    })()
  )
})
