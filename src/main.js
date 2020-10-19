import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';

import 'normalize.css';
import 'fontsource-inter';
import 'fontsource-inter/700.css';

import './assets/styles/base.styl';

const app = createApp(App).use(store).use(router);

// import base components for convenience
const requireComponent = require.context('./components', false, /Mb[A-Z]\w+\.(vue|js)$/);

requireComponent.keys().forEach((fileName) => {
  const componentConfig = requireComponent(fileName);
  const componentName = fileName.split('/').pop().replace(/\.\w+$/, '');
  app.component(componentName, componentConfig.default || componentConfig);
});

app.mount('#app');
