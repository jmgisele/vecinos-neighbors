import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {
      theme: 'auto',
    },
  },
  mutations: {
    setUserProperty(state, { key, value }) {
      state.user[key] = value;
    },
  },
  actions: {
  },
  modules: {
  },
});
