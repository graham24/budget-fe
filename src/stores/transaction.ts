import { defineStore } from "pinia";
import {
  getTransactions,
  addTransaction,
  saveTransaction,
  getSummary,
} from "../api";
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
    summary: {
      categories: null,
      net_incomes: null,
    },
    net_incomes: [
      { income: 0, expenses: 0 },
      { income: 0, expenses: 0 },
      { income: 0, expenses: 0 },
    ],
    monthsAgo: 0 as number,
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
        this.getNetIncomes();
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    },

    async fetchSummary() {
      try {
        this.summary = await getSummary(1, 1);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    },

    getNetIncomes() {
      const calculateDateRanges = (monthsAgo: number) => {
        const endDate = new Date(
          new Date().getFullYear(),
          new Date().getMonth() - (monthsAgo + this.monthsAgo),
          1
        );
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        return { startDate, endDate };
      };

      const dateRanges = [
        calculateDateRanges(0),
        calculateDateRanges(1),
        calculateDateRanges(2),
      ];

      this.transactions.all_transactions.forEach((transaction) => {
        try {
          const transactionDate = new Date(
            new Date(transaction.date).setMinutes(
              new Date(transaction.date).getMinutes() +
                new Date(transaction.date).getTimezoneOffset()
            )
          );

          if (transaction.category !== "Transfer") {
            dateRanges.forEach((range, index) => {
              if (
                transactionDate < range.endDate &&
                transactionDate >= range.startDate
              ) {
                if (transaction.amount >= 0) {
                  this.net_incomes[index]["income"] += transaction.amount;
                } else {
                  this.net_incomes[index]["expenses"] += transaction.amount;
                }
              }
            });
          }
        } catch (error) {
          console.log(error);
        }
      });
    },

    getCategories() {
      this.transactions.all_transactions.forEach((transaction) => {
        if (transaction.category === "Transfer") {
          if (
            !this.categories.transfers.some(
              (cat) => cat.name === transaction.category
            )
          ) {
            this.categories.transfers.push({
              name: transaction.category,
              sub_categories: [],
            });
          }
          const transferCategory = this.categories.transfers.find(
            (cat) => cat.name === transaction.category
          );
          if (
            !transferCategory.sub_categories.includes(transaction.sub_category)
          ) {
            transferCategory.sub_categories.push(transaction.sub_category);
          }
        } else if (transaction.amount >= 0) {
          if (
            !this.categories.income.some(
              (cat) => cat.name === transaction.category
            )
          ) {
            this.categories.income.push({
              name: transaction.category,
              sub_categories: [],
            });
          }
          const incomeCategory = this.categories.income.find(
            (cat) => cat.name === transaction.category
          );
          if (
            !incomeCategory.sub_categories.includes(transaction.sub_category)
          ) {
            incomeCategory.sub_categories.push(transaction.sub_category);
          }
        }
        if (transaction.amount < 0) {
          if (
            !this.categories.expenses.some(
              (cat) => cat.name === transaction.category
            )
          ) {
            this.categories.expenses.push({
              name: transaction.category,
              sub_categories: [],
            });
          }
          const expensesCategory = this.categories.expenses.find(
            (cat) => cat.name === transaction.category
          );
          if (
            !expensesCategory.sub_categories.includes(transaction.sub_category)
          ) {
            expensesCategory.sub_categories.push(transaction.sub_category);
          }
        }
      });
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
      // TODO: If there is a new category or sub-category, add it
      try {
        await saveTransaction(transaction);
      } catch (error) {
        console.error("Error saving transaction:", error);
      }
    },
  },
});
