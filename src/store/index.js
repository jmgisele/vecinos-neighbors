import { createStore } from 'vuex';

export default createStore({
  state: {
    application: {
      mobile: false,
      tooltip: null,
    },
    user: {
      theme: 'auto',
    },
  },
  mutations: {
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
  },
  modules: {
  },
});
