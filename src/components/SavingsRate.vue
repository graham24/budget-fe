<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();

const focusMonth = computed(
  () => transactionStore.net_incomes[transactionStore.monthsAgo] ?? null
);

const netValue = computed(() => {
  const focus = focusMonth.value;
  if (!focus) return 0;
  return (focus["income"] ?? 0) + (focus["expensesNeed"] + focus["expensesWant"]);
});

const savingsRate = computed(() => {
  const income = focusMonth.value?.["income"] ?? 0;
  if (!income || income === 0) return 0;
  return (netValue.value / income) * 100;
});
</script>

<template>
  <div class="savings-wrapper">
    <div class="muted text-caption">Savings rate</div>
    <div class="savings-value">
      {{ savingsRate.toFixed(0) }}%
      <span class="savings-sub muted">of income saved</span>
    </div>
  </div>
</template>

<style scoped>
.savings-wrapper {
  display: grid;
  gap: 6px;
}
.savings-value {
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  flex-direction: column;
}
.savings-sub {
  font-size: 0.9rem;
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}
</style>
