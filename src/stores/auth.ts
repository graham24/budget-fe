import { defineStore } from "pinia";
import type { User } from "../types";
import { login } from "../api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
  }),
  actions: {
    // Errors propagate so the login form can show them (e.g. 404 unknown email)
    async login(email: string) {
      const user_response = await login(email);
      this.user = user_response;
      localStorage.setItem("user", JSON.stringify(user_response));
    },
    logout() {
      this.user = null;
      localStorage.removeItem("user");
    },
    verifyUser(user: User) {
      this.user = user;
      localStorage.setItem("user", JSON.stringify(user));
    },
  },
});
