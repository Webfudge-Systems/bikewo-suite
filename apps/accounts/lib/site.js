import { FUDGE_SUITE_ASSETS } from '@webfudge/utils'

const siteUrl = (process.env.NEXT_PUBLIC_ACCOUNTS_APP_URL || 'http://localhost:3003').replace(/\/$/, '')

export const ACCOUNTS_SITE = {
  brandName: 'BikeWo',
  brandShortName: 'BikeWo',
  legalName: 'BikeWo',
  name: 'BikeWo Base',
  shortName: 'Base',
  creatorLine: 'Fudge System',
  description:
    'BikeWo Base is the organization administration workspace for users, roles, departments, teams, security, billing, app access, and audit logs across the BikeWo suite.',
  tagline: 'Manage your organization—users, roles, security, billing, and compliance.',
  loginTagline: 'Your organization command center.',
  loginDetail:
    'Sign in to manage users, roles, teams, security settings, billing, and audit logs across your BikeWo workspace.',
  loginFeatures: [
    { value: 'Manage', label: 'Users' },
    { value: 'Control', label: 'Access' },
    { value: 'Track', label: 'Audit' },
  ],
  url: siteUrl,
  ...FUDGE_SUITE_ASSETS.bikewo,
  brandLogoPath: FUDGE_SUITE_ASSETS.bikewo.brandLogoPath,
  ogImagePath: FUDGE_SUITE_ASSETS.bikewo.brandLogoPath,
  locale: 'en_US',
  themeColor: '#2AB77C',
  backgroundColor: '#F1F1F5',
  twitterHandle: '@bikewo',
  keywords: [
    'BikeWo Base',
    'organization admin',
    'user management',
    'roles and permissions',
    'RBAC',
    'teams',
    'departments',
    'billing',
    'audit logs',
    'BikeWo',
    'Fudge System',
  ],
}

export function accountsJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: ACCOUNTS_SITE.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: ACCOUNTS_SITE.description,
    url: ACCOUNTS_SITE.url,
    image: `${ACCOUNTS_SITE.url}${ACCOUNTS_SITE.ogImagePath}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: 'SaaS',
    },
    publisher: {
      '@type': 'Organization',
      name: ACCOUNTS_SITE.legalName,
      url: ACCOUNTS_SITE.url,
    },
  }
}
