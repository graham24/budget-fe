import { defineStore } from "pinia";
import type { User } from "../types";
import { googleLogin, updateUser } from "../api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
  }),
  actions: {
    // Errors propagate so the login screen can show them
    async loginWithGoogle(credential: string) {
      const { user, token } = await googleLogin(credential);
      this.user = user;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
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
      localStorage.removeItem("token");
    },
    verifyUser(user: User) {
      this.user = user;
      localStorage.setItem("user", JSON.stringify(user));
    },
    // Restores the session from localStorage. Called before the router's
    // first navigation so the auth guard sees the correct state.
    restore() {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      if (storedUser && storedToken) {
        this.user = JSON.parse(storedUser);
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    },
  },
});
