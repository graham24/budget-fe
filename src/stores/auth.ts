import { defineStore } from "pinia";
import type { User } from "../types";
import { login, signup, updateUser } from "../api";

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
    async signup(email: string, firstName: string, lastName: string) {
      const user_response = await signup(email, firstName, lastName);
      this.user = user_response;
      localStorage.setItem("user", JSON.stringify(user_response));
    },
    async updateProfile(updates: {
      first_name?: string;
      last_name?: string;
      email?: string;
    }) {
      if (!this.user) return;
      const updated = await updateUser(this.user.id, updates);
      this.verifyUser(updated);
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
