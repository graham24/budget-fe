import { defineStore } from "pinia";
import { getAccounts } from "../api";
import { useAuthStore } from "./auth";
import type { Account } from "../types";

export const useAccountStore = defineStore("account", {
  state: () => ({
    accounts: { accounts: [] as Account[] },
  }),
  actions: {
    async fetchAccounts() {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) return;
      try {
        this.accounts = await getAccounts(userId);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    },
  },
});
