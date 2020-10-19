import { createStore } from 'vuex';

export default createStore({
  state: {
    application: {
      tooltip: null,
    },
    user: {
      theme: 'auto',
    },
  },
  mutations: {
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
