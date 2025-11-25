import { defineStore } from "pinia";
import type { User } from "../types";
import { login } from "../api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
  }),
  actions: {
    async login() {
      try {
        const user_response = await login();
        this.user = user_response;
        localStorage.setItem("user", JSON.stringify(user_response));
      } catch (error) {
        console.error("Error fetching user:", error);
      }
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
