import { createStore } from 'vuex';
import fs from '../fs';

export default createStore({
  state: {
    application: {
      activeUser: null,
      initialised: false,
      openModals: [],
      mobile: false,
      toasts: [],
      tooltip: null,
    },
    user: {
      gitAuth: null,
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
        console.log(jsonString);
        commit('setAppData', {
          ...state.application,
          ...JSON.parse(jsonString),
        });
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        else commit('setAppProperty', { key: 'initialised', value: true }); // if the file doesn’t exist, we’re doing a cold start with default state
      }
    },
  },
  modules: {
  },
});
