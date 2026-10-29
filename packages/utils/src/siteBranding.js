/** Shared public asset paths for Fudge Suite workspace apps (CRM / PM / Accounts). */
export const FUDGE_SUITE_ASSETS = {
  bikewo: {
    logoPath: '/logos/bikewo-logo-primary.png',
    brandIconPath: '/favicon/web-app-manifest-512x512.png',
    brandLogoPath: '/logos/bikewo-logo-primary.png',
    manifestPath: '/favicon/site.webmanifest',
    faviconIco: '/favicon.ico',
    faviconSvg: '/favicon/favicon.svg',
    favicon96: '/favicon/favicon-96x96.png',
    favicon16: '/favicon/favicon-96x96.png',
    favicon32: '/favicon/favicon-96x96.png',
    appleTouchIcon: '/favicon/apple-touch-icon.png',
    pwaIcon192: '/favicon/web-app-manifest-192x192.png',
    pwaIcon512: '/favicon/web-app-manifest-512x512.png',
  },
  webfudge: {
    logoPath: '/favicon/web-app-manifest-512x512.png',
    brandLogoPath: '/favicon/web-app-manifest-512x512.png',
    manifestPath: '/favicon/site.webmanifest',
    faviconSvg: '/favicon/favicon.svg',
    favicon96: '/favicon/favicon-96x96.png',
    appleTouchIcon: '/favicon/apple-touch-icon.png',
    pwaIcon192: '/favicon/web-app-manifest-192x192.png',
    pwaIcon512: '/favicon/web-app-manifest-512x512.png',
  },
}

export function bikewoMetadataIcons() {
  const { faviconIco, faviconSvg, favicon96, appleTouchIcon } = FUDGE_SUITE_ASSETS.bikewo
  return {
    icon: [
      { url: faviconIco },
      { url: faviconSvg, type: 'image/svg+xml' },
      { url: favicon96, sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: appleTouchIcon, sizes: '180x180', type: 'image/png' }],
    shortcut: [faviconIco],
  }
}

export function webfudgeMetadataIcons() {
  const { faviconSvg, favicon96, appleTouchIcon } = FUDGE_SUITE_ASSETS.webfudge
  return {
    icon: [
      { url: faviconSvg, type: 'image/svg+xml' },
      { url: favicon96, sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: appleTouchIcon, sizes: '180x180', type: 'image/png' }],
    shortcut: [faviconSvg],
  }
}
