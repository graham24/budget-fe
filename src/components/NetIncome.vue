<script setup lang="ts">
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();

const focusMonth = computed(
  () => transactionStore.net_incomes[transactionStore.monthsAgo + 1] ?? null
);

const incomeTotal = computed(() => focusMonth.value?.income ?? 0);
const expensesTotal = computed(
  () => (focusMonth.value?.expensesNeed ?? 0) + (focusMonth.value?.expensesWant ?? 0)
);
const netValue = computed(() => incomeTotal.value + expensesTotal.value);
</script>
<template>
  <div class="net-wrapper">
    <div class="net-header">
      <div class="muted text-caption">
        Focus month
      </div>
      <div class="text-h6 font-weight-bold">
        {{
          formatDate(
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).setMonth(new Date().getMonth() - (transactionStore.monthsAgo + 1))
          )
        }}
      </div>
    </div>
    <div
      class="net-highlight"
      :class="[netValue >= 0 ? 'positive' : 'negative']"
    >
      <div class="label muted">
        Net income
      </div>
      <div class="value">
        {{ formatCurrency(netValue) }}
      </div>
    </div>
    <div class="pill-row">
      <span class="amount-chip positive">
        Income:
        {{ formatCurrency(incomeTotal ?? 0) }}
      </span>
      <span class="amount-chip negative">
        Expenses:
        {{ formatCurrency(expensesTotal ?? 0) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.positive {
  color: rgb(var(--v-theme-success));
}
.negative {
  color: rgb(var(--v-theme-error));
}
.net-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.net-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.net-highlight {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-primary), 0.05);
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
}
.net-highlight .label {
  font-size: 0.9rem;
  margin-bottom: 4px;
}
.net-highlight .value {
  font-size: 1.6rem;
  font-weight: 800;
}
.pill-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.amount-chip {
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-outline), 0.1);
  font-weight: 600;
}
.history {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.2);
  padding-top: 8px;
  display: grid;
  gap: 6px;
}
.history-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}
</style>
