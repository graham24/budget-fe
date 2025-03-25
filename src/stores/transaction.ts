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
  }),
  actions: {
    async fetchTransactions(type: string) {
      try {
        this.transactions = await getTransactions(1, 1, type);
        for (const key in this.transactions) {
          this.transactions[key].sort((a, b) => {
            if (a.date === b.date) {
              return b.id - a.id;
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
        }
        this.getCategories();
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    },

    getCategories() {
      for (const key in this.transactions) {
        this.transactions[key].forEach((transaction) => {
          if (
            !this.categories[key].some(
              (cat) => cat.description === transaction.category
            )
          ) {
            const category: Category = { description: transaction.category };
            this.categories[key].push(category);
          }
          if (
            !this.sub_categories[key].some(
              (subCat) => subCat.description === transaction.sub_category
            )
          ) {
            const sub_category: Sub_Category = {
              description: transaction.sub_category,
            };
            this.sub_categories[key].push(sub_category);
          }
        });
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
      var transactions = null;
      if (transaction.category === "Transfer") {
        transactions = this.transactions.transfers;
      } else if (transaction.amount >= 0) {
        transactions = this.transactions.income;
      } else if (transaction.amount < 0) {
        transactions = this.transactions.expenses;
      }
      try {
        const index = transactions.findIndex((t) => t.id === transaction.id);
        if (index !== -1) {
          await saveTransaction(transaction);
          transactions[index] = transaction;
        } else {
          console.warn("Transaction not found, unable to save.");
        }
      } catch (error) {
        console.error("Error saving transaction:", error);
      }
    },
  },
});
