import { createRouter, createWebHistory } from 'vue-router';
import Store from '../store';

import GeneralError from '../views/GeneralError.vue';
import Forbidden from '../views/Forbidden.vue';
import Home from '../views/Home.vue';
import NotFound from '../views/NotFound.vue';
import Onboarding from '../views/Onboarding.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Projects',
    },
  },
  {
    path: '/general-error',
    name: 'Error',
    component: GeneralError,
    meta: {
      title: 'Something went wrong',
      hideAppHeader: true,
    },
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '404',
      hideAppHeader: true,
    },
  },
  {
    path: '/access-denied',
    name: 'Forbidden',
    component: Forbidden,
    meta: {
      title: 'Access Denied',
      hideAppHeader: true,
    },
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: Onboarding,
    meta: {
      title: 'Welcome',
      hideAppHeader: true,
    },
    beforeEnter: () => {
      if (Store.state.application.activeUser) return { name: 'Home' };
      return true;
    },
  },
  {
    path: '/project/:id',
    name: 'Project',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "project" */ '../views/Project.vue'),
    meta: {
      sidebar: true,
      title: 'Project',
    },
    children: [
      {
        name: 'Project.Dashboard',
        path: '', // this sub-route will be loaded when we enter the parent route
        component: () => import(/* webpackChunkName: "project" */ '../views/ProjectDashboard.vue'),
        meta: {
          label: 'Dashboard',
          title: 'Project Dashboard',
        },
      },
      {
        name: 'Project.MediaLibrary',
        path: 'media', // this sub-route will be loaded when we enter the parent route
        component: () => import(/* webpackChunkName: "project" */ '../views/ProjectMediaLibrary.vue'),
        meta: {
          label: 'Media Library',
          title: 'Project Media Library',
        },
      },
      {
        name: 'Project.Settings',
        path: 'settings',
        component: () => import(/* webpackChunkName: "project" */ '../views/ProjectSettings.vue'),
        meta: {
          label: 'Settings',
          title: 'Project Settings',
        },
      },
    ],
    beforeEnter: (to) => {
      if (!Store.state.user.projects.includes(to.params.id)) return { name: 'Forbidden', replace: true };
      return true;
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  if (Store.state.application.openModals.length !== 0) {
    Store.commit('closeTopmostModal');
    return false;
  }

  // Initialise App if it hasn’t yet
  if (!Store.state.application.initialised) {
    try {
      await Store.dispatch('initialiseApplication');
    } catch (err) {
      // We pretend we initialised, so we can move to the error route
      Store.commit('setAppProperty', { key: 'initialised', value: true });
      return {
        name: 'Error',
        params: {
          code: err.code,
          message: err.message,
          name: err.name,
          stage: 'init',
        },
      };
    }
  }

  if (to.name !== 'Error' && to.name !== 'Onboarding' && !Store.state.application.activeUser) return { name: 'Onboarding', replace: true };
  return true;
});

router.afterEach((to) => {
  if (to.meta && to.meta.title) document.title = `${to.meta.title} | Mattrbld`;
  else document.title = 'Mattrbld';
});

router.onError((err) => {
  router.push({ name: 'Error', params: { error: err } });
});

export default router;
