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
  },
  actions: {
    async fetchTransactions(type: string | null = null) {
      try {
        const all_transactions = await getTransactions(1, 1, type);
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
