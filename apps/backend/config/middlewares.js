const bikewoOrigins = [
  'https://bikewo.com',
  'https://www.bikewo.com',
  'https://crm.bikewo.com',
  'https://pm.bikewo.com',
  'https://accounts.bikewo.com',
  'https://portal.bikewo.com',
];

const localOrigins = [
  'http://localhost:3001', // CRM
  'http://localhost:3002', // Client portal
  'http://localhost:3003', // Accounts
  'http://localhost:3005', // PM
];

const extraOrigins = String(process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...localOrigins, ...bikewoOrigins, ...extraOrigins];

const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.bikewo\.com$/,
];

module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://*.amazonaws.com',
            'https://*.cloudfront.net',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'https://*.amazonaws.com',
            'https://*.cloudfront.net',
          ],
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (ctx) => {
        const requestOrigin = ctx.request.header.origin;

        if (!requestOrigin) {
          return '*';
        }

        if (allowedOrigins.includes(requestOrigin)) {
          return requestOrigin;
        }

        if (allowedOriginPatterns.some((pattern) => pattern.test(requestOrigin))) {
          return requestOrigin;
        }

        return '';
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'X-Organization-Id',
        'x-landing-signup-secret',
        'x-website-signup-secret',
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::jwt-auth', // Custom JWT authentication middleware
  'global::api-cache', // Redis cache for GET /api/* (leads, contacts, tasks, projects, …)
];
