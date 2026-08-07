<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";
import SurfaceCard from "./common/SurfaceCard.vue";

const transactionStore = useTransactionStore();

const focus = computed(
  () => transactionStore.net_incomes[transactionStore.monthsAgo + 1] ?? null
);
const prior = computed(
  () => transactionStore.net_incomes[transactionStore.monthsAgo + 2] ?? null
);

const priorLabel = computed(() => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (transactionStore.monthsAgo + 2));
  return d.toLocaleString(undefined, { month: "short" });
});

function spendingOf(month) {
  return -((month?.expensesNeed ?? 0) + (month?.expensesWant ?? 0));
}

const tiles = computed(() => {
  const f = focus.value;
  const p = prior.value;

  const income = f?.income ?? 0;
  const spend = spendingOf(f);
  const net = income - spend;
  const rate = income > 0 ? (net / income) * 100 : null;

  const priorIncome = p?.income ?? 0;
  const priorSpend = spendingOf(p);
  const priorNet = priorIncome - priorSpend;

  return [
    {
      label: "Income",
      value: income,
      delta: p ? income - priorIncome : null,
      goodWhenUp: true,
    },
    {
      label: "Spending",
      value: spend,
      delta: p ? spend - priorSpend : null,
      goodWhenUp: false,
    },
    {
      label: "Net",
      value: net,
      delta: p ? net - priorNet : null,
      goodWhenUp: true,
    },
    {
      label: "Savings rate",
      value: rate,
      percent: true,
      delta: null,
      caption: rate === null ? "No income this month" : "of income kept",
    },
  ];
});

function deltaClass(tile) {
  if (Math.abs(tile.delta) < 1) return "muted";
  const improved = tile.delta > 0 === tile.goodWhenUp;
  return improved ? "text-success" : "text-error";
}
</script>

<template>
  <div class="kpi-strip">
    <SurfaceCard
      v-for="tile in tiles"
      :key="tile.label"
      class="kpi"
      padding="14px 16px"
    >
      <div class="pill">
        {{ tile.label }}
      </div>
      <div class="kpi__value">
        <template v-if="tile.percent">
          {{ tile.value === null ? "—" : `${tile.value.toFixed(0)}%` }}
        </template>
        <template v-else>
          {{ formatCurrency(tile.value) }}
        </template>
      </div>
      <div
        v-if="tile.delta !== null"
        class="kpi__delta"
        :class="deltaClass(tile)"
      >
        <v-icon
          :icon="tile.delta >= 0 ? 'mdi-arrow-up-thin' : 'mdi-arrow-down-thin'"
          size="16"
        />
        {{ formatCurrency(Math.abs(tile.delta)) }} vs {{ priorLabel }}
      </div>
      <div
        v-else
        class="kpi__delta muted"
      >
        {{ tile.caption }}
      </div>
    </SurfaceCard>
  </div>
</template>

<style scoped>
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.kpi__value {
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin: 2px 0;
}
.kpi__delta {
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .kpi-strip {
    grid-template-columns: repeat(2, 1fr);
  }
  .kpi__value {
    font-size: 1.4rem;
  }
}
</style>
