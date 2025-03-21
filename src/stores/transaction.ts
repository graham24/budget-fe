import { defineStore } from "pinia";
import { getTransactions, addTransaction } from "../api";
import type { Transaction } from "../types";

export const useTransactionStore = defineStore("transaction", {
  state: () => ({
    transactions: [] as Transaction[],
  }),
  actions: {
    async fetchTransactions() {
      try {
        this.transactions = await getTransactions();
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
  },
});
