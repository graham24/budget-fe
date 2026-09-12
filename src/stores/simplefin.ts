import { defineStore } from "pinia";
import { fetchSimplefinAccounts, importSimplefinTransactions, linkSimplefinAccount, refreshSimplefinAccountTransactions } from "../api";
import { useAccountStore } from "./account";
import { useTransactionStore } from "./transaction";
import type { SimplefinAccount, SimplefinImportResult } from "../types";

// Axios surfaces the API's own message under response.data.message; fall
// back to the thrown error's own message, then to something generic.
function refreshErrorMessage(error: unknown): string {
  const axiosLike = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    axiosLike?.response?.data?.message ?? axiosLike?.message ?? "Refresh failed"
  );
}

export interface RefreshProgress {
  simplefinAccountId: number;
  label: string;
  status: "pending" | "running" | "done" | "error";
  imported?: number;
  duplicates?: number;
  error?: string;
}

export const useSimplefinStore = defineStore("simplefin", {
  state: () => ({
    accounts: [] as SimplefinAccount[],
    firstFetch: false,
    importing: false,
    lastImportResult: null as SimplefinImportResult | null,
    refreshingAccountId: null as number | null,
    // Live per-account state for a "refresh every account" run
    refreshAllRunning: false,
    refreshAllProgress: [] as RefreshProgress[],
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
      // effort, a failure here shouldn't undo the link itself.
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
    // so the caller can show them. `refetch` is false for the run-them-all
    // path, which refetches once at the end instead of N times.
    async refreshAccountTransactions(
      id: number,
      householdId: number,
      refetch = true
    ) {
      this.refreshingAccountId = id;
      try {
        const result = await refreshSimplefinAccountTransactions(id, householdId);
        const index = this.accounts.findIndex((a) => a.id === id);
        if (index !== -1) this.accounts[index] = result;
        if (refetch) {
          const transactionStore = useTransactionStore();
          await transactionStore.fetchTransactions(null, true);
        }
        return result;
      } finally {
        this.refreshingAccountId = null;
      }
    },
    // Runs every linked account through the same per-account refresh, one at
    // a time, recording a result line each. A failing account is recorded and
    // the run continues, one dead bank connection shouldn't stop the rest.
    async refreshAllAccounts(
      householdId: number,
      labelFor?: (account: SimplefinAccount) => string
    ) {
      if (this.refreshAllRunning) return;

      const linked = this.accounts.filter((a) => a.bank_account_id);
      this.refreshAllProgress = linked.map((account) => ({
        simplefinAccountId: account.id,
        label: labelFor?.(account) ?? account.name ?? `Account ${account.id}`,
        status: "pending",
      }));
      if (!linked.length) return;

      this.refreshAllRunning = true;
      try {
        for (const [index, account] of linked.entries()) {
          this.refreshAllProgress[index].status = "running";
          try {
            const result = await this.refreshAccountTransactions(
              account.id,
              householdId,
              false
            );
            Object.assign(this.refreshAllProgress[index], {
              status: "done",
              imported: result.imported,
              duplicates: result.duplicates,
            });
          } catch (error) {
            Object.assign(this.refreshAllProgress[index], {
              status: "error",
              error: refreshErrorMessage(error),
            });
          }
        }
        // One refetch for the whole run, not one per account
        const transactionStore = useTransactionStore();
        await transactionStore.fetchTransactions(null, true);
      } finally {
        this.refreshAllRunning = false;
      }
    },
    clearRefreshAllProgress() {
      this.refreshAllProgress = [];
    },
  },
});
