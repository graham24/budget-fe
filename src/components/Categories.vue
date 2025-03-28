<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";
const transactionStore = useTransactionStore();

defineOptions({
  methods: {
    formatDate(date) {
      const options = { year: "numeric", month: "long" };
      return new Date(date).toLocaleDateString(undefined, options);
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    },
  },
});
</script>
<template>
  <div class="categories widget">
    <div>
      <div class="widget-title">
        <span
          >{{
            formatDate(transactionStore.summary.categories[0].date)
          }}
          Income</span
        >
      </div>
      <div
        :class="['category-rows']"
        v-for="income in [...transactionStore.summary.categories[0].income].sort((a, b) => b.amount - a.amount)"
      >
        <div>{{ income.category }}</div>
        <div>{{ formatCurrency(income.amount) }}</div>
      </div>
    </div>
    <div class="spacer"></div>
    <div>
      <div class="widget-title">
        <span
          >{{
            formatDate(transactionStore.summary.categories[0].date)
          }}
          Expenses</span
        >
      </div>
    <div
      :class="['category-rows']"
      v-for="expense in [...transactionStore.summary.categories[0].expenses].sort((a, b) => a.amount - b.amount)"
      >
        <div>{{ expense.category }}</div>
        <div>{{ formatCurrency(expense.amount) }}</div>
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
