import { defineStore } from "pinia";
import { getTransactions, addTransaction, saveTransaction } from "../api";
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
    monthsAgo: 0 as number,
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
    // net_incomes[n] = aggregated data for the month that is (n+1) months ago from today.
    // e.g. net_incomes[0] = last month, net_incomes[1] = 2 months ago, etc.
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
        const n = monthsDiff - 1;
        if (n < 0) continue; // current (in-progress) month

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
      try {
        // Fetch far enough back to cover the 3-month window + the trend's extra months
        // at maximum monthsAgo (2), we need data from up to monthsAgo+4 months ago.
        const from = new Date();
        from.setDate(1);
        from.setMonth(from.getMonth() - (this.monthsAgo + 4));
        const from_date = from.toISOString().split("T")[0];

        const all_transactions = await getTransactions(1, 1, type, from_date);
        const sortedTransactions = [...all_transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.transactions = sortedTransactions;
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    },

    async createTransaction(transaction: Omit<Transaction, "id">) {
      try {
        const newTransaction = await addTransaction(transaction);
        this.transactions.push(newTransaction);
      } catch (error) {
        console.error("Error adding transaction:", error);
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
