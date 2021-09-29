/* eslint-disable no-console */

import { register } from 'register-service-worker';

import Store from './store';

const runningLocally = window.location.host.includes('localhost') || window.location.host.includes('172.0.0.1');

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      if (!runningLocally) return;
      console.log(
        'App is being served from cache by a service worker.\n'
        + 'For more details, visit https://goo.gl/AFskqB',
      );
    },
    registered() {
      if (runningLocally) console.log('Service worker has been registered.');
    },
    cached() {
      if (runningLocally) console.log('Content has been cached for offline use.');
      Store.commit('addToast', { message: 'Mattrbld was cached on your device and is available offline from now on', type: 'positive' });
    },
    updatefound() {
      if (runningLocally) console.log('New content is downloading.');
    },
    updated(registration) {
      if (runningLocally) console.log('New content is available; please refresh.');
      Store.commit('addToast', {
        action() {
          if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload(true);
        },
        actionLabel: 'Refresh',
        message: 'A new version of Mattrbld is available, refresh to start using the newest verison',
        timeout: false,
      });
    },
    offline() {
      if (runningLocally) console.log('No internet connection found. App is running in offline mode.');
    },
    error(error) {
      if (runningLocally) console.error('Error during service worker registration:', error);
      Store.commit('addToast', { message: `There was an error while caching the application: ${error.message}`, type: 'error' });
    },
  });
}
