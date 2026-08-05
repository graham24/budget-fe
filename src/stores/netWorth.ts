import { defineStore } from "pinia";
import {
  addBalanceEntry,
  createNetWorthItem,
  deleteBalanceEntry,
  deleteNetWorthItem,
  getNetWorthItems,
  getNetWorthSummary,
  updateNetWorthItem,
} from "../api";
import { useHouseholdStore } from "./household";
import type { NetWorthItem, NetWorthSummary } from "../types";

function byBalanceDesc(a: NetWorthItem, b: NetWorthItem) {
  return (b.current_balance ?? 0) - (a.current_balance ?? 0);
}

export const useNetWorthStore = defineStore("netWorth", {
  state: () => ({
    items: [] as NetWorthItem[],
    summary: null as NetWorthSummary | null,
    loaded: false,
  }),
  getters: {
    assets: (state) =>
      state.items.filter((i) => i.kind === "asset").sort(byBalanceDesc),
    debts: (state) =>
      state.items.filter((i) => i.kind === "debt").sort(byBalanceDesc),
    // Computed from items (not the summary) so KPIs update instantly on edits
    totalAssets(): number {
      return this.assets.reduce((sum, i) => sum + (i.current_balance ?? 0), 0);
    },
    totalDebts(): number {
      return this.debts.reduce((sum, i) => sum + (i.current_balance ?? 0), 0);
    },
    netWorth(): number {
      return this.totalAssets - this.totalDebts;
    },
  },
  actions: {
    householdId(): number | undefined {
      return useHouseholdStore().household?.household?.id;
    },
    async fetchAll() {
      const householdId = this.householdId();
      if (!householdId) return;
      try {
        const [items, summary] = await Promise.all([
          getNetWorthItems(householdId),
          getNetWorthSummary(householdId),
        ]);
        this.items = items;
        this.summary = summary;
        this.loaded = true;
      } catch (error) {
        console.error("Error fetching net worth data:", error);
      }
    },
    async refreshSummary() {
      const householdId = this.householdId();
      if (!householdId) return;
      try {
        this.summary = await getNetWorthSummary(householdId);
      } catch (error) {
        console.error("Error refreshing net worth summary:", error);
      }
    },
    async createItem(payload: {
      name: string;
      account_id?: number | null;
      kind: "asset" | "debt";
      type: string;
      interest_rate?: number | null;
      minimum_payment?: number | null;
      initial_balance?: number | null;
      balance_date?: string | null;
    }) {
      const householdId = this.householdId();
      if (!householdId) throw new Error("No household loaded");
      const item = await createNetWorthItem({
        household_id: householdId,
        ...payload,
      });
      this.items.push(item);
      await this.refreshSummary();
      return item;
    },
    async updateItem(
      id: number,
      updates: {
        name?: string;
        account_id?: number | null;
        type?: string;
        interest_rate?: number | null;
        minimum_payment?: number | null;
      }
    ) {
      const item = await updateNetWorthItem(id, updates);
      const idx = this.items.findIndex((i) => i.id === id);
      if (idx !== -1) this.items[idx] = item;
      return item;
    },
    async deleteItem(id: number) {
      await deleteNetWorthItem(id);
      this.items = this.items.filter((i) => i.id !== id);
      await this.refreshSummary();
    },
    async addBalance(itemId: number, balance: number, effective_date?: string) {
      const entry = await addBalanceEntry(itemId, balance, effective_date);
      const item = this.items.find((i) => i.id === itemId);
      if (item) {
        item.entries.unshift(entry);
        item.entries.sort(
          (a, b) =>
            new Date(b.effective_date).getTime() -
              new Date(a.effective_date).getTime() || b.id - a.id
        );
        this.syncCurrentBalance(item);
      }
      await this.refreshSummary();
      return entry;
    },
    async deleteBalance(itemId: number, entryId: number) {
      await deleteBalanceEntry(entryId);
      const item = this.items.find((i) => i.id === itemId);
      if (item) {
        item.entries = item.entries.filter((e) => e.id !== entryId);
        this.syncCurrentBalance(item);
      }
      await this.refreshSummary();
    },
    // Entries are kept sorted newest-first; current balance is entries[0]
    syncCurrentBalance(item: NetWorthItem) {
      const latest = item.entries[0] ?? null;
      item.current_balance = latest ? latest.balance : null;
      item.current_balance_date = latest ? latest.effective_date : null;
    },
  },
});
