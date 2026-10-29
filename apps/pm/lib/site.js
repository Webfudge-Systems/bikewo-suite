import { FUDGE_SUITE_ASSETS } from '@webfudge/utils'

const siteUrl = (process.env.NEXT_PUBLIC_PM_APP_URL || 'http://localhost:3006').replace(/\/$/, '')

export const PM_SITE = {
  brandName: 'BikeWo',
  brandShortName: 'BikeWo',
  legalName: 'BikeWo',
  name: 'Fudge Work',
  shortName: 'Work',
  description:
    'Fudge Work is the project management workspace for projects, tasks, teams, messages, and delivery across the BikeWo suite.',
  tagline: 'Track projects, tasks, and your team in one place.',
  loginTagline: 'Plan, track, and deliver — together.',
  loginDetail:
    'Sign in to manage projects, assign tasks, collaborate with your team, and keep delivery on schedule.',
  loginFeatures: [
    { value: 'Plan', label: 'Projects' },
    { value: 'Assign', label: 'Tasks' },
    { value: 'Deliver', label: 'On time' },
  ],
  url: siteUrl,
  ...FUDGE_SUITE_ASSETS.bikewo,
  brandLogoPath: FUDGE_SUITE_ASSETS.bikewo.brandLogoPath,
  ogImagePath: FUDGE_SUITE_ASSETS.bikewo.brandLogoPath,
  locale: 'en_US',
  themeColor: '#F5630F',
  backgroundColor: '#FFFAF7',
  twitterHandle: '@bikewo',
  keywords: ['Fudge Work', 'project management', 'tasks', 'team collaboration', 'delivery', 'BikeWo'],
}
