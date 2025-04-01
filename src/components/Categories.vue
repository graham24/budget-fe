<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";
const transactionStore = useTransactionStore();
function getCategoryTotals(transactions) {
  const categoryTotals = {};
  const endDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 1);
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
</script>
<template>
  <div class="categories widget">
    <div>
      <div class="widget-title">
        <span
          >{{
            formatDate(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ).setMonth(new Date().getMonth() - 1)
                )
          }}
          Income</span
        >
      </div>
      <div
        :class="['category-rows']"
        v-for="(value, category) in getCategoryTotals(
          transactionStore.transactions.all_transactions.filter(
            (transaction) =>
              transaction.amount >= 0 && transaction.category !== 'Transfer'
          )
        )"
      >
        <div>{{ category }}</div>
        <div>{{ formatCurrency(value) }}</div>
      </div>
    </div>
    <div class="spacer"></div>
    <div>
      <div class="widget-title">
        <span
          >{{
            formatDate(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ).setMonth(new Date().getMonth() - 1)
                )
          }}
          Expenses</span
        >
      </div>
      <div
        :class="['category-rows']"
        v-for="(value, category) in getCategoryTotals(
          transactionStore.transactions.all_transactions.filter(
            (transaction) =>
              transaction.amount < 0 && transaction.category !== 'Transfer'
          )
        )"
      >
        <div>{{ category }}</div>
        <div>{{ formatCurrency(value) }}</div>
      </div>
    </div>
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
