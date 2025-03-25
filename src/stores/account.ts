import { defineStore } from "pinia";
import { getAccounts } from "../api";
import type { Account } from "../types";

export const useAccountStore = defineStore("account", {
  state: () => ({
    accounts: [] as Account[],
  }),
  actions: {
    async fetchAccounts() {
      try {
        this.accounts = await getAccounts();
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    },
  },
});
