import { createStore } from 'vuex';

export default createStore({
  state: {
    application: {
      tooltip: null,
      tooltipTimeout: null,
    },
    user: {
      theme: 'auto',
    },
  },
  mutations: {
    hideTooltip(state) {
      if (state.application.tooltipTimeout) {
        window.clearTimeout(state.application.tooltipTimeout);
        state.application.tooltipTimeout = null;
      }
      state.application.tooltip = null;
    },
    setUserProperty(state, { key, value }) {
      state.user[key] = value;
    },
    showTooltip(state, tooltip) {
      if (state.application.tooltipTimeout) { // clear any existing timeouts
        window.clearTimeout(state.application.tooltipTimeout);
        state.application.tooltipTimeout = null;
      }

      if (!state.application.tooltip && (tooltip.timeout > 0 || typeof tooltip.timeout === 'undefined')) {
        state.application.tooltipTimeout = window.setTimeout(() => {
          state.application.tooltip = tooltip;
          state.application.tooltipTimeout = null;
        }, tooltip.timeout || 1000);
      } else state.application.tooltip = tooltip;
    },
  },
  actions: {
  },
  modules: {
  },
});
