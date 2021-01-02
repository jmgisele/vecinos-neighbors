import { createRouter, createWebHistory } from 'vue-router';
import Store from '../store';
import Home from '../views/Home.vue';
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
      title: 'Project',
    },
    children: [
      {
        name: 'Project.Dashboard',
        path: '', // this sub-route will be loaded when we enter the parent route
        component: () => import(/* webpackChunkName: "project" */ '../views/ProjectDashboard.vue'),
        meta: {
          title: 'Project Dashboard',
        },
      },
      {
        name: 'Project.Settings',
        path: 'settings',
        component: () => import(/* webpackChunkName: "project" */ '../views/ProjectSettings.vue'),
        meta: {
          title: 'Project Settings',
        },
      },
    ],
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
      Store.commit('addToast', { message: err.message, type: 'error' });
    }
  }

  if (to.name !== 'Onboarding' && !Store.state.application.activeUser) return { name: 'Onboarding', replace: true };
  return true;
});

router.afterEach((to) => {
  if (to.meta && to.meta.title) document.title = `${to.meta.title} | Mattrbld`;
  else document.title = 'Mattrbld';
});

export default router;
