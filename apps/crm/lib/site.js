import { FUDGE_SUITE_ASSETS } from '@webfudge/utils'

const siteUrl = (process.env.NEXT_PUBLIC_CRM_APP_URL || 'http://localhost:3007').replace(/\/$/, '')

export const CRM_SITE = {
  brandName: 'BikeWo',
  brandShortName: 'BikeWo',
  legalName: 'BikeWo',
  name: 'Fudge Grow',
  shortName: 'Grow',
  description:
    'Fudge Grow is the sales CRM workspace for leads, deals, contacts, client accounts, and pipeline management across the BikeWo suite.',
  tagline: 'Manage leads, deals, contacts, and your pipeline in one place.',
  loginTagline: 'Close more deals, faster.',
  loginDetail:
    'Sign in to manage leads, contacts, deals, and your sales pipeline from one workspace.',
  loginFeatures: [
    { value: 'Capture', label: 'Leads' },
    { value: 'Close', label: 'Deals' },
    { value: 'Grow', label: 'Pipeline' },
  ],
  url: siteUrl,
  ...FUDGE_SUITE_ASSETS.bikewo,
  brandLogoPath: FUDGE_SUITE_ASSETS.bikewo.brandLogoPath,
  ogImagePath: FUDGE_SUITE_ASSETS.bikewo.brandLogoPath,
  locale: 'en_US',
  themeColor: '#F5630F',
  backgroundColor: '#FFFAF7',
  twitterHandle: '@bikewo',
  keywords: ['Fudge Grow', 'CRM', 'sales CRM', 'lead management', 'deal pipeline', 'BikeWo'],
}
