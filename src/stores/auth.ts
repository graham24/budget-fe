import { defineStore } from "pinia";
import type { User } from "../types";
import { demoLogin, googleLogin, updateUser } from "../api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    // True only while the landing page is running a live demo preview (see
    // startPreview/endPreview below) — lets App.vue tell "authed for real"
    // apart from "authed only to power a background preview fetch" so the
    // app shell (top bar, logout, etc.) stays hidden on the landing page.
    previewing: false,
  }),
  actions: {
    // Errors propagate so the login screen can show them
    async loginWithGoogle(credential: string) {
      const { user, token } = await googleLogin(credential);
      this.user = user;
      this.token = token;
      this.previewing = false;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    },
    async loginAsDemo() {
      const { user, token } = await demoLogin();
      this.user = user;
      this.token = token;
      this.previewing = false;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    },
    // Silently authenticates as the read-only demo account WITHOUT
    // persisting to localStorage — used by the landing page to feed the
    // real dashboard components live data for the preview sections while
    // staying on "/". Never call this expecting a real, durable session:
    // it's wiped on refresh and superseded by any real login.
    async startPreview() {
      const { user, token } = await demoLogin();
      this.user = user;
      this.token = token;
      this.previewing = true;
    },
    endPreview() {
      if (!this.previewing) return;
      this.user = null;
      this.token = null;
      this.previewing = false;
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
      this.token = null;
      this.previewing = false;
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
        this.token = storedToken;
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    },
  },
});
