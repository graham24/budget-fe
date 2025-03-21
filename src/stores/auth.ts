import { defineStore } from "pinia";
import axios from "axios";
import type { User } from "../types";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null, // Store authenticated user
  }),
  actions: {
    async fetchUser() {
      try {
        const response = await axios.get<User | null>("/api/auth/me", {
          withCredentials: true, // Ensures cookies/session support
        });
        this.user = response.data;
      } catch (error) {
        this.user = null; // Ensure user is reset if not authenticated
      }
    },
    async logout() {
      await axios.get("/api/auth/logout", { withCredentials: true });
      this.user = null;
    },
  },
});
