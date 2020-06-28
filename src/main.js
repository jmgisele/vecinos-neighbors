import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';

import 'normalize.css';
import 'typeface-inter';
import '@/assets/styles/base.styl';

// import base components globally for convenience
const requireComponent = require.context('./components', false, /Mb[A-Z]\w+\.(vue|js)$/);

requireComponent.keys().forEach((fileName) => {
  const componentConfig = requireComponent(fileName);
  const componentName = fileName.split('/').pop().replace(/\.\w+$/, '');
  Vue.component(componentName, componentConfig.default || componentConfig);
});

Vue.config.productionTip = false;
Vue.config.devtools = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
