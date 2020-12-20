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
    },
    beforeEnter: () => {
      if (Store.state.user.onboardingComplete) return { path: '/' };
      return true;
    },
  },
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  // },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  if (Store.state.application.openModals.length > 0) {
    Store.commit('closeTopmostModal');
    return false;
  }

  if (to.name !== 'Onboarding' && !Store.state.user.onboardingComplete) return { name: 'Onboarding' };
  return true;
});

router.afterEach((to) => {
  const nearestRouteWithTitle = to.matched.slice().reverse().find((route) => route.meta && route.meta.title);
  if (nearestRouteWithTitle) document.title = `${nearestRouteWithTitle.meta.title} | Mattrbld`;
  else document.title = 'Mattrbld';
});

export default router;
