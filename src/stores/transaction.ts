import { defineStore } from "pinia";
import { getTransactions, saveTransaction } from "../api";
import { useAuthStore } from "./auth";
import { useHouseholdStore } from "./household";
import { sliceByDateRange } from "../utils/dateWindow";
import type { Transaction, Category, Sub_Category } from "../types";

export const useTransactionStore = defineStore("transaction", {
  state: () => ({
    transactions: [] as Transaction[],
    categories: {
      expenses: [] as Category[],
      income: [] as Category[],
      transfers: [] as Category[],
    },
    sub_categories: {
      expenses: [] as Sub_Category[],
      income: [] as Sub_Category[],
      transfers: [] as Sub_Category[],
    },
    monthsAgo: -1 as number,
    // Earliest `from_date` (YYYY-MM-DD) currently covered by `transactions`,
    // so a re-navigation within an already-loaded range can skip the fetch.
    earliestLoadedDate: null as string | null,
    // True while a fetchTransactions() call triggered by month-pager
    // navigation is in flight, lets individual panels show an in-place
    // refresh treatment instead of the whole dashboard unmounting.
    isRefreshing: false,
  }),
  getters: {
    incomeTransactions: (state) =>
      state.transactions.filter(
        (transaction) =>
          transaction.category !== "Transfer" && transaction.amount >= 0
      ),
    expenseNeedTransactions: (state) =>
      state.transactions.filter(
        (transaction) =>
          transaction.category !== "Transfer" &&
          transaction.amount < 0 &&
          transaction.need
      ),
    expenseWantTransactions: (state) =>
      state.transactions.filter(
        (transaction) =>
          transaction.category !== "Transfer" &&
          transaction.amount < 0 &&
          !transaction.need
      ),
    transferTransactions: (state) =>
      state.transactions.filter(
        (transaction) => transaction.category === "Transfer"
      ),
    // Distinct expense category names seen across loaded transactions, a
    // single cached pass, shared by any component that just needs category
    // suggestions rather than rescanning the whole array itself.
    knownExpenseCategories: (state): string[] => {
      const names = new Set<string>();
      for (const t of state.transactions) {
        if (t.amount < 0 && t.category && t.category !== "Transfer") {
          names.add(t.category);
        }
      }
      return [...names].sort();
    },
    // Transactions the AI couldn't categorize, the review queue
    unknownTransactions: (state) =>
      state.transactions.filter(
        (transaction) =>
          transaction.category === "Unknown" ||
          transaction.sub_category === "Unknown"
      ),
    // Transactions in the focus month (monthsAgo + 1 months back from today)
    focusMonthTransactions: (state): Transaction[] => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      start.setMonth(start.getMonth() - (state.monthsAgo + 1));
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return sliceByDateRange(state.transactions, start, end);
    },
    // net_incomes[n] = aggregated data for the month that is n months ago from today.
    // e.g. net_incomes[0] = current (partial) month, net_incomes[1] = last month, etc.
    // The focus month for a given window is net_incomes[monthsAgo + 1].
    net_incomes: (state): Array<{ income: number; expensesNeed: number; expensesWant: number }> => {
      const result: Array<{ income: number; expensesNeed: number; expensesWant: number }> = [];
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();

      for (const tx of state.transactions) {
        if (tx.category === "Transfer") continue;
        const txDate = new Date(tx.date);
        const monthsDiff =
          (todayYear - txDate.getFullYear()) * 12 +
          (todayMonth - txDate.getMonth());
        const n = monthsDiff; // index 0 = current month, 1 = last month, etc.

        if (!result[n]) {
          result[n] = { income: 0, expensesNeed: 0, expensesWant: 0 };
        }
        if (tx.amount >= 0) {
          result[n].income += tx.amount;
        } else if (tx.need) {
          result[n].expensesNeed += tx.amount;
        } else {
          result[n].expensesWant += tx.amount;
        }
      }
      return result;
    },
  },
  actions: {
    async fetchTransactions(
      type: string | null = null,
      forceRefresh: boolean = false
    ) {
      const authStore = useAuthStore();
      const householdStore = useHouseholdStore();
      const userId = authStore.user?.id;
      const householdId = householdStore.household?.household?.id;
      if (!userId || !householdId) return;
      try {
        // Fetch 12 months of history before the focus month, feeds the
        // cash-flow trend sparkline and recurring-charge detection.
        const from = new Date();
        from.setDate(1);
        from.setMonth(from.getMonth() - Math.max(this.monthsAgo + 12, 12));
        const from_date = from.toISOString().split("T")[0];

        // The array only grows backward as monthsAgo increases, so if the
        // range we already have covers the newly requested one, there's
        // nothing new to fetch, unless the caller knows data changed
        // server-side (e.g. an import) and needs a forced refresh.
        if (
          !forceRefresh &&
          this.earliestLoadedDate &&
          from_date >= this.earliestLoadedDate
        ) {
          return;
        }

        this.isRefreshing = true;
        const all_transactions = await getTransactions(
          userId,
          householdId,
          type,
          from_date
        );
        const sortedTransactions = all_transactions
          .map((t) => ({ t, ms: new Date(t.date).getTime() }))
          .sort((a, b) => b.ms - a.ms)
          .map(({ t }) => t);
        this.transactions = sortedTransactions;
        this.earliestLoadedDate = from_date;
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        this.isRefreshing = false;
      }
    },

    async saveTransaction(transaction: Transaction) {
      try {
        const saved = await saveTransaction(transaction);
        const idx = this.transactions.findIndex((t) => t.id === saved.id);
        if (idx !== -1) this.transactions[idx] = saved;
      } catch (error) {
        console.error("Error saving transaction:", error);
      }
    },
  },
});
