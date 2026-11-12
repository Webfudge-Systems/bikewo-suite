'use strict';

// auth: false — relies on the global jwt-auth middleware + manual user checks in the controller.
const authFalse = { auth: false, policies: [], middlewares: [] };

module.exports = {
  routes: [
    { method: 'GET', path: '/push/public-key', handler: 'push-subscription.publicKey', config: authFalse },
    { method: 'POST', path: '/push/subscribe', handler: 'push-subscription.subscribe', config: authFalse },
    { method: 'POST', path: '/push/unsubscribe', handler: 'push-subscription.unsubscribe', config: authFalse },
  ],
};
