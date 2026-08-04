import { defineStore } from "pinia";
import { getTransactions, saveTransaction } from "../api";
import { useAuthStore } from "./auth";
import { useHouseholdStore } from "./household";
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
    // Transactions the AI couldn't categorize — the review queue
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
      return state.transactions.filter((transaction) => {
        const d = new Date(transaction.date);
        return d >= start && d < end;
      });
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
    async fetchTransactions(type: string | null = null) {
      const authStore = useAuthStore();
      const householdStore = useHouseholdStore();
      const userId = authStore.user?.id;
      const householdId = householdStore.household?.household?.id;
      if (!userId || !householdId) return;
      try {
        // Fetch 12 months of history before the focus month — feeds the
        // cash-flow trend sparkline and recurring-charge detection.
        const from = new Date();
        from.setDate(1);
        from.setMonth(from.getMonth() - Math.max(this.monthsAgo + 12, 12));
        const from_date = from.toISOString().split("T")[0];

        const all_transactions = await getTransactions(
          userId,
          householdId,
          type,
          from_date
        );
        const sortedTransactions = [...all_transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.transactions = sortedTransactions;
      } catch (error) {
        console.error("Error fetching transactions:", error);
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
