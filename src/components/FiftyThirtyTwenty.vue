<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();

const focusMonth = computed(
  () => transactionStore.net_incomes[transactionStore.monthsAgo + 1] ?? null
);

const rows = computed(() => {
  const focus = focusMonth.value;
  const income = focus?.income ?? 0;
  if (income <= 0) return [];

  const needsPct = (-(focus.expensesNeed ?? 0) / income) * 100;
  const wantsPct = (-(focus.expensesWant ?? 0) / income) * 100;
  const savingsPct = 100 - needsPct - wantsPct;

  return [
    {
      label: "Needs",
      pct: needsPct,
      target: 50,
      // under target is good for spending
      color: needsPct <= 50 ? "success" : needsPct <= 60 ? "warning" : "error",
    },
    {
      label: "Wants",
      pct: wantsPct,
      target: 30,
      color: wantsPct <= 30 ? "success" : wantsPct <= 40 ? "warning" : "error",
    },
    {
      label: "Savings",
      pct: savingsPct,
      target: 20,
      // over target is good for savings
      color: savingsPct >= 20 ? "success" : savingsPct >= 10 ? "warning" : "error",
    },
  ];
});
</script>

<template>
  <div
    v-if="rows.length"
    class="fifty-rule"
  >
    <div
      v-for="row in rows"
      :key="row.label"
      class="rule-row"
    >
      <div class="rule-row__labels">
        <span class="rule-row__name">{{ row.label }}</span>
        <span
          class="rule-row__pct"
          :class="`text-${row.color}`"
        >
          {{ row.pct.toFixed(0) }}%
          <span class="muted">/ {{ row.target }}%</span>
        </span>
      </div>
      <div class="rule-row__track">
        <v-progress-linear
          :model-value="Math.min(Math.max(row.pct, 0), 100)"
          :color="row.color"
          height="8"
          rounded
        />
        <div
          class="rule-row__marker"
          :style="{ left: `${row.target}%` }"
        />
      </div>
    </div>
    <p class="muted text-caption mt-1 mb-0">
      50/30/20 rule: needs / wants / savings as a share of income.
      Tick marks show the targets.
    </p>
  </div>
  <div
    v-else
    class="muted text-caption"
  >
    No income recorded this month.
  </div>
</template>

<style scoped>
.fifty-rule {
  display: grid;
  gap: 10px;
}
.rule-row__labels {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 3px;
}
.rule-row__name {
  font-weight: 600;
}
.rule-row__pct {
  font-weight: 700;
  font-size: 0.9rem;
}
.rule-row__track {
  position: relative;
}
.rule-row__marker {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: rgba(var(--v-theme-on-surface), 0.5);
  border-radius: 1px;
}
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
