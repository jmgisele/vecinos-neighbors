import { createStore } from 'vuex';
import fs from '../fs';

import observers from './observers';

const persistentAppProperties = ['activeUser', 'corsProxy', 'initialised', 'locallyChangedFiles'];
const persistentProjectProperties = ['corsProxy', 'id', 'name', 'sidebar', 'slugifyOptions', 'collections', 'customFields', 'customRoles', 'schemas'];
const persistentUserProperties = ['email', 'id', 'name', 'projects', 'role', 'theme', 'uiScale'];

const projectDefaults = {
  avatar: null,
  collections: [],
  corsProxy: null,
  customFields: [],
  customRoles: [],
  id: null,
  name: null,
  schemas: [],
  sidebar: [],
  slugifyOptions: null,
  users: [],
};

export default createStore({
  state: {
    application: {
      activeUser: null,
      corsProxy: null,
      initialised: false,
      locallyChangedFiles: [],
      mobile: false,
      tablet: false,
      openModals: [],
      permanentModals: [],
      sidebarVisible: false,
      softDeleted: [],
      toasts: [],
      tooltip: null,
    },
    currentProject: { ...projectDefaults },
    user: {
      avatar: null,
      email: null,
      gitAuth: null,
      id: null,
      name: null,
      projects: [],
      role: null,
      theme: 'auto',
      uiScale: 'auto',
    },
  },
  getters: {
    hasLocalChanges(state) {
      return (path) => state.application.locallyChangedFiles.some((filepath) => filepath.startsWith(path));
    },
    isSoftDeleted(state) {
      return (path) => state.application.softDeleted.includes(path);
    },
  },
  mutations: {
    addLocallyChangedFile(state, path) {
      if (!state.application.locallyChangedFiles.includes(path)) state.application.locallyChangedFiles.push(path);
    },
    addOpenModal(state, modal) {
      state.application.openModals.push(modal.el);
      if (modal.permanent) state.application.permanentModals.push(modal.el);
    },
    addProjectToActiveUser(state, id) {
      state.user.projects.push(id);
    },
    addToast(state, toast) {
      let timeout = 5000;

      if (toast.timeout && toast.timeout > 1000) timeout = toast.timeout;
      if (toast.type === 'error' || toast.timeout === 0 || toast.timeout === false || toast.permanent) timeout = 0;

      if (state.application.toasts.length > 5) state.application.toasts.shift();

      state.application.toasts.push({
        id: toast.id || Math.random().toString(36).substr(2, 9),
        ...toast,
        timeout, // override the timeout set in the toast-object
        type: toast.type === 'error' ? 'negative' : toast.type, // error toasts are negative toasts that don’t disappear
      });
    },
    addToSoftDeleted(state, path) {
      if (!state.application.softDeleted.includes(path)) state.application.softDeleted.push(path);
    },
    clearCurrentProject(state) {
      state.currentProject = { ...projectDefaults };
    },
    clearToasts(state) {
      state.application.toasts = [];
    },
    closeModal(state, index) {
      state.application.openModals.splice(index, 1);
      state.application.permanentModals.splice(index, 1);
    },
    closeTopmostModal(state) {
      const topmost = state.application.openModals[state.application.openModals.length - 1];
      if (topmost && state.application.permanentModals.indexOf(topmost) === -1) state.application.openModals.pop();
    },
    removeFromSoftDeleted(state, path) {
      const index = state.application.softDeleted.indexOf(path);
      if (index > -1) state.application.softDeleted.splice(index, 1);
    },
    removeLocallyChangedFile(state, path) {
      const index = state.application.locallyChangedFiles.indexOf(path);
      if (index > -1) state.application.locallyChangedFiles.splice(index, 1);
    },
    removeProjectFromActiveUser(state, id) {
      const index = state.user.projects.indexOf(id);
      if (index > -1) state.user.projects.splice(index, 1);
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
    setCurrentProject(state, data) {
      state.currentProject = data;
    },
    setCurrentProjectProperty(state, { key, value }) {
      state.currentProject[key] = value;
    },
    setMobile(state, value) {
      state.application.mobile = value;
    },
    setModalPermanence(state, { el, value }) {
      const index = state.application.permanentModals.indexOf(el);
      if (value && index === -1) state.application.permanentModals.push(el);
      else if (index !== -1) state.application.permanentModals.splice(index, 1);
    },
    setUserData(state, data) {
      state.user = data;
    },
    setUserProperty(state, { key, value }) {
      state.user[key] = value;
    },
    setTablet(state, value) {
      state.application.tablet = value;
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
        await fs.writeFile('/mattrbld.conf', JSON.stringify(appData, null, 2), 'utf8');
        return true;
      } catch (err) {
        commit('addToast', { message: `Something went wrong while saving the app configuration: ${err.message}`, type: 'error' });
        return false;
      }
    },
    async saveCurrentProject({ commit, dispatch, state }) {
      try {
        const currentProjectData = {};
        persistentProjectProperties.forEach((prop) => { currentProjectData[prop] = state.currentProject[prop]; });

        await fs.writeFile(`/projects/${state.currentProject.id}/.mattrbld/config.json`, JSON.stringify(currentProjectData, null, 2), 'utf8');
        commit('addLocallyChangedFile', `/projects/${state.currentProject.id}/.mattrbld/config.json`);
        dispatch('saveAppData');
        return true;
      } catch (err) {
        commit('addToast', { message: `Something went wrong while saving the configuration of the current project: ${err.message}`, type: 'error' });
        return false;
      }
    },
    async saveUser({ commit, state }) {
      try {
        const userData = {};
        persistentUserProperties.forEach((prop) => { userData[prop] = state.user[prop]; });

        await fs.writeFile(`/users/${state.application.activeUser}.json`, JSON.stringify(userData, null, 2), 'utf8');
        return true;
      } catch (err) {
        commit('addToast', { message: `Something went wrong while saving the active user: ${err.message}`, type: 'error' });
        return false;
      }
    },
  },
  modules: {
    observers,
  },
});
