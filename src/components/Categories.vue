<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";
const transactionStore = useTransactionStore();
function getCategoryTotals(transactions) {
  const categoryTotals = {};
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 2);
  transactions.forEach((transaction) => {
    const transactionDate = new Date(
      new Date(transaction.date).setMinutes(
        new Date(transaction.date).getMinutes() +
          new Date(transaction.date).getTimezoneOffset()
      )
    );
    if (transactionDate < endDate && transactionDate >= startDate) {
      if (!categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] = 0;
      }
      categoryTotals[transaction.category] += transaction.amount;
    }
  });
  const sortedCategoryTotals = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => {
      if (a < 0 && b < 0) {
        return a - b; // Sort negatives in ascending order
      }
      return b - a; // Sort positives in descending order
    })
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  return sortedCategoryTotals;
}

function getCategoryTotalsComputed(type) {
  const categories = [];
  var transactions = null;
  if (type == "income") {
    transactions = transactionStore.transactions.all_transactions.filter(
      (transaction) =>
        transaction.amount >= 0 && transaction.category !== "Transfer"
    );
  } else {
    transactions = transactionStore.transactions.all_transactions.filter(
      (transaction) =>
        transaction.amount < 0 && transaction.category !== "Transfer"
    );
  }
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 2);
  transactions.forEach((transaction) => {
    const transactionDate = new Date(
      new Date(transaction.date).setMinutes(
        new Date(transaction.date).getMinutes() +
          new Date(transaction.date).getTimezoneOffset()
      )
    );
    if (transactionDate < endDate && transactionDate >= startDate) {
      const existingCategory = categories.find(
        (item) => item.category === transaction.category
      );
      if (existingCategory) {
        existingCategory.value += transaction.amount;
      } else {
        categories.push({
          category: transaction.category,
          value: transaction.amount,
        });
      }
    }
    if (type == "income") {
      categories.sort((a, b) => b.value - a.value);
    } else {
      categories.sort((a, b) => a.value - b.value);
    }
  });
  return categories;
}
</script>
<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="auto">
          <v-card>
            {{
              formatDate(
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ).setMonth(new Date().getMonth() - 2)
              )
            }}
            Income
            <v-data-table
              :items="getCategoryTotalsComputed('income')"
              hide-default-footer
              density="compact"
            >
              <template v-slot:item.value="{ item }">
                {{ formatCurrency(item.value) }}
              </template>
            </v-data-table>
          </v-card>
        </v-col>
        <v-col>
          <v-card>
            {{
              formatDate(
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ).setMonth(new Date().getMonth() - 2)
              )
            }}
            Expenses
            <v-data-table
              :items="getCategoryTotalsComputed('expenses')"
              density="compact"
            >
              <template v-slot:item.value="{ item }">
                {{ formatCurrency(item.value) }}
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.categories {
  display: flex;
  column-gap: 10px;
  text-align: left;
}
.category-rows {
  display: grid;
  grid-template-columns: 3fr 2fr 3fr;
  column-gap: 10px;
  text-align: left;
}
</style>
