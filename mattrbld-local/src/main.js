import { Buffer } from 'buffer';
import { registerSW } from 'virtual:pwa-register'; // eslint-disable-line import/no-unresolved
import { createApp } from 'vue';

import App from './App.vue';
import FieldArrangementList from './components/utility/FieldArrangementList.vue';
import router from './router';
import store from './store';

import 'modern-normalize';

import './assets/styles/base.scss';

window.Buffer = Buffer; // polyfilling Buffer is required by gray-matter and isomorphic-git

const app = createApp(App).use(store).use(router);

// import base components for convenience
const modules = import.meta.glob('./components/Mb*.{vue,js}', { eager: true });

Object.entries(modules).forEach(([filePath, module]) => {
  const componentName = filePath.split('/').pop().replace(/\.\w+$/, '');
  app.component(componentName, module.default || module);
});

// Needs to be defined globally because FieldArrangementItems need to reference
// it without importing it (as that causes a build warning)
app.component('FieldArrangementList', FieldArrangementList);

app.mount('#app');

const updateSW = registerSW({
  onNeedRefresh() {
    store.commit('addToast', {
      action: updateSW,
      actionLabel: 'Refresh',
      id: 'refresh-to-update',
      message: 'A new version of Mattrbld is available, refresh to start using the newest verison',
      timeout: false,
    });
  },
  onOfflineReady() {
    store.commit('addToast', { message: 'Mattrbld was cached on your device and is available offline from now on', type: 'positive' });
  },
});
