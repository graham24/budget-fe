import { defineStore } from "pinia";
import { createAccount, getAccounts, updateAccount } from "../api";
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
    // Errors propagate so the account form can show them
    async createAccount(account: {
      description: string;
      type: string;
      bank: string;
      user_id: number;
    }) {
      await createAccount(account);
      await this.fetchAccounts();
    },
    async updateAccount(
      id: number,
      updates: {
        description?: string;
        type?: string;
        bank?: string;
        user_id?: number;
      }
    ) {
      await updateAccount(id, updates);
      await this.fetchAccounts();
    },
  },
});
