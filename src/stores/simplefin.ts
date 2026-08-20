import { defineStore } from "pinia";
import { fetchSimplefinAccounts, importSimplefinTransactions, linkSimplefinAccount, refreshSimplefinAccountTransactions } from "../api";
import { useAccountStore } from "./account";
import { useTransactionStore } from "./transaction";
import type { SimplefinAccount, SimplefinImportResult } from "../types";

export const useSimplefinStore = defineStore("simplefin", {
  state: () => ({
    accounts: [] as SimplefinAccount[],
    firstFetch: false,
    importing: false,
    lastImportResult: null as SimplefinImportResult | null,
    refreshingAccountId: null as number | null,
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
      const index = this.accounts.findIndex((a) => a.id === id);
      if (index !== -1) this.accounts[index] = updated;
      if (updates.new_account) {
        const accountStore = useAccountStore();
        await accountStore.fetchAccounts();
      }
      // Backfill 3 months of history for the newly-linked account. Best
      // effort — a failure here shouldn't undo the link itself.
      if (updated.bank_account_id) {
        try {
          await this.refreshAccountTransactions(id, householdId);
        } catch (error) {
          console.error("Error backfilling newly linked account:", error);
        }
      }
    },
    // Errors propagate so the caller can show them
    async importTransactions(householdId: number) {
      this.importing = true;
      try {
        const result = await importSimplefinTransactions(householdId);
        this.lastImportResult = result;
        const transactionStore = useTransactionStore();
        await transactionStore.fetchTransactions(null, true);
        return result;
      } finally {
        this.importing = false;
      }
    },
    // Pulls the last 3 months for a single linked account. Errors propagate
    // so the caller can show them.
    async refreshAccountTransactions(id: number, householdId: number) {
      this.refreshingAccountId = id;
      try {
        const result = await refreshSimplefinAccountTransactions(id, householdId);
        const index = this.accounts.findIndex((a) => a.id === id);
        if (index !== -1) this.accounts[index] = result;
        const transactionStore = useTransactionStore();
        await transactionStore.fetchTransactions(null, true);
        return result;
      } finally {
        this.refreshingAccountId = null;
      }
    },
  },
});
