import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: Home,
    // meta: { requiresAuth: true }
  },
  { path: "/login", component: Login },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard for Protected Routes
// router.beforeEach(async (to, from, next) => {
//   const authStore = useAuthStore();
//   if (!authStore.user) {
//     await authStore.fetchUser();
//   }

//   if (to.meta.requiresAuth && !authStore.user) {
//     next("/login");
//   } else {
//     next();
//   }
// });

export default router;
