<script setup lang="ts">
import { computed, ref } from "vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();
const mode = ref<"net" | "income" | "expensesNeed" | "expensesWant">("net");
const width = 120;
const height = 60;
const padding = 6;

const seriesMap = computed(() => {
  const baseIndex = transactionStore.monthsAgo;
  const income: { label: string; value: number }[] = [];
  const expensesNeed: { label: string; value: number }[] = [];
  const expensesWant: { label: string; value: number }[] = [];
  const net: { label: string; value: number }[] = [];

  const monthLabel = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (baseIndex + offset + 1));
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  };

  // build from oldest to newest so the sparkline runs left-to-right chronologically
  for (let i = 2; i >= 0; i--) {
    const entry = transactionStore.net_incomes?.[baseIndex + 1 + i];
    if (!entry) continue;
    const inc = entry.income ?? 0;
    const need = entry.expensesNeed ?? 0;
    const want = entry.expensesWant ?? 0;
    const label = monthLabel(i);
    income.push({ label, value: inc });
    expensesNeed.push({ label, value: need });
    expensesWant.push({ label, value: want });
    net.push({ label, value: inc + need + want });
  }

  return { net, income, expensesNeed, expensesWant };
});

const currentSeries = computed(
  () => seriesMap.value[mode.value] ?? []
);
const trendDelta = computed(() => {
  if (currentSeries.value.length < 2) return 0;
  const last = currentSeries.value.length - 1;
  return currentSeries.value[last].value - currentSeries.value[last - 1].value;
});

const plottedPoints = computed(() => {
  const points = currentSeries.value;
  if (!points.length) return [];
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  return points.map((point, idx) => {
    const x = (idx / Math.max(points.length - 1, 1)) * width;
    const usableHeight = height - padding * 2;
    const y = height - padding - ((point.value - min) / range) * usableHeight;
    return { ...point, x, y };
  });
});
</script>

<template>
  <div class="trend-wrapper" v-if="currentSeries.length">
    <div class="sparkline-header">
      <div class="muted text-caption">Trend (3 months)</div>
      <div class="controls">
        <v-btn-toggle v-model="mode" density="compact" mandatory color="primary">
          <v-btn value="net" text="Net" />
          <v-btn value="income" text="Income" />
          <v-btn value="expensesNeed" text="Needs" />
          <v-btn value="expensesWant" text="Wants" />
        </v-btn-toggle>
        <span class="delta" :class="trendDelta >= 0 ? 'positive' : 'negative'">
          {{ trendDelta >= 0 ? "+" : "" }}{{ formatCurrency(trendDelta) }}
        </span>
      </div>
    </div>
    <svg
      class="sparkline"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
    >
      <polyline
        :points="plottedPoints.map((p) => `${p.x},${p.y}`).join(' ')"
        fill="none"
        stroke="currentColor"
        :class="plottedPoints[0].value >= plottedPoints[plottedPoints.length - 1].value ? 'negative' : 'positive'"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
  <div v-else class="muted text-caption">Not enough data yet.</div>
</template>

<style scoped>
.trend-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sparkline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sparkline {
  width: 100%;
  height: 70px;
}
.delta {
  font-weight: 700;
}
.positive {
  color: rgb(var(--v-theme-success));
}
.negative {
  color: rgb(var(--v-theme-error));
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}
</style>
