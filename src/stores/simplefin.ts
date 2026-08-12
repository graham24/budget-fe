import { defineStore } from "pinia";
import { fetchSimplefinAccounts, importSimplefinTransactions, linkSimplefinAccount, updateSimplefinAccount } from "../api";
import { useAccountStore } from "./account";
import { useTransactionStore } from "./transaction";
import type { SimplefinAccount, SimplefinImportResult } from "../types";

export const useSimplefinStore = defineStore("simplefin", {
  state: () => ({
    accounts: [] as SimplefinAccount[],
    firstFetch: false,
    importing: false,
    lastImportResult: null as SimplefinImportResult | null,
  }),
  actions: {
    async fetchAccounts(householdId: number) {
      try {
        const { accounts, first_fetch } = await fetchSimplefinAccounts(
          householdId
        );
        this.accounts = accounts;
        this.firstFetch = first_fetch;
      } catch (error) {
        console.error("Error fetching SimpleFin accounts:", error);
      }
    },
    // Errors propagate so the wizard card can show them
    async linkAccount(
      id: number,
      householdId: number,
      updates: {
        bank_account_id?: number | null;
        new_account?: { description: string; type: string; bank: string; user_id: number };
      }
    ) {
      const updated = await linkSimplefinAccount(id, householdId, updates);
      const update_account = updateSimplefinAccount(id, householdId);
      const index = this.accounts.findIndex((a) => a.id === id);
      if (index !== -1) this.accounts[index] = updated;
      if (updates.new_account) {
        const accountStore = useAccountStore();
        await accountStore.fetchAccounts();
      }
    },
    // Errors propagate so the caller can show them
    async importTransactions(householdId: number) {
      this.importing = true;
      try {
        const result = await importSimplefinTransactions(householdId);
        this.lastImportResult = result;
        const transactionStore = useTransactionStore();
        await transactionStore.fetchTransactions();
        return result;
      } finally {
        this.importing = false;
      }
    },
  },
});
