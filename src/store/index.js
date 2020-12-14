import { createStore } from 'vuex';

export default createStore({
  state: {
    application: {
      openModals: [],
      mobile: false,
      tooltip: null,
    },
    user: {
      theme: 'auto',
    },
  },
  mutations: {
    addOpenModal(state, modalEl) {
      state.application.openModals.push(modalEl);
    },
    closeModal(state, index) {
      state.application.openModals.splice(index, 1);
    },
    closeTopmostModal(state) {
      state.application.openModals.pop();
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
  },
  modules: {
  },
});
