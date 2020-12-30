import { createStore } from 'vuex';
import fs from '../fs';

const persistentAppProperties = ['activeUser', 'corsProxy', 'initialised'];

export default createStore({
  state: {
    application: {
      activeUser: null,
      corsProxy: null,
      initialised: false,
      openModals: [],
      mobile: false,
      toasts: [],
      tooltip: null,
    },
    user: {
      email: null,
      gitAuth: null,
      name: null,
      projects: [],
      role: null,
      theme: 'auto',
    },
  },
  mutations: {
    addOpenModal(state, modalEl) {
      state.application.openModals.push(modalEl);
    },
    addToast(state, toast) {
      console.log('adding toast with message', toast.message); // only for debugging while toasts arent displayed
      let timeout = 500;

      if (toast.timeout && toast.timeout > 1000) timeout = toast.timeout;
      if (toast.type === 'error') timeout = 0;

      state.application.toasts.push({
        id: toast.id || Math.random().toString(36).substr(2, 9),
        ...toast,
        timeout, // override the timeout set in the toast-object
        type: toast.type === 'error' ? 'negative' : toast.type, // error toasts are negative toasts that don’t disappear
      });
    },
    clearToasts(state) {
      state.application.toasts = [];
    },
    closeModal(state, index) {
      state.application.openModals.splice(index, 1);
    },
    closeTopmostModal(state) {
      state.application.openModals.pop();
    },
    removeToast(state, id) {
      const index = state.application.toasts.findIndex((toast) => toast.id === id);
      if (index > -1) state.application.toasts.splice(index, 1);
    },
    setAppData(state, data) {
      state.application = data;
    },
    setAppProperty(state, { key, value }) {
      state.application[key] = value;
    },
    setMobile(state, value) {
      state.application.mobile = value;
    },
    setUserData(state, data) {
      state.user = data;
    },
    setUserProperty(state, { key, value }) {
      state.user[key] = value;
    },
    setTooltip(state, tooltip) {
      state.application.tooltip = tooltip;
    },
  },
  actions: {
    async initialiseApplication({ commit, state }) {
      try {
        const jsonString = await fs.readFile('/mattrbld.conf', 'utf8');
        commit('setAppData', {
          ...state.application,
          ...JSON.parse(jsonString),
        });

        if (state.application.activeUser) { // load the active user
          const userJsonString = await fs.readFile(`/users/${state.application.activeUser}.json`, 'utf8');
          commit('setUserData', {
            ...state.user,
            ...JSON.parse(userJsonString),
          });
        }
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        else commit('setAppProperty', { key: 'initialised', value: true }); // if the file doesn’t exist, we’re doing a cold start with default state
      }
    },
    async saveAppData({ commit, state }) {
      try {
        const appData = {};

        persistentAppProperties.forEach((prop) => { appData[prop] = state.application[prop]; });
        await fs.writeFile('/mattrbld.conf', JSON.stringify(appData), 'utf8');
      } catch (err) {
        commit('addToast', { message: `Something went wrong while saving the app configuration: ${err.message}`, type: 'error' });
      }
    },
  },
  modules: {
  },
});
