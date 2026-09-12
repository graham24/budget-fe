<script setup>
import { computed, ref } from "vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();
const mode = ref("net");
const width = 120;
const height = 60;
const padding = 6;

const focusIndex = computed(() => transactionStore.monthsAgo + 1);

function monthNet(entry) {
  if (!entry) return null;
  return (
    (entry.income ?? 0) + (entry.expensesNeed ?? 0) + (entry.expensesWant ?? 0)
  );
}

function monthDate(index) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - index);
  return d;
}

const focusMonth = computed(
  () => transactionStore.net_incomes[focusIndex.value] ?? null
);
const focusLabel = computed(() =>
  monthDate(focusIndex.value).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  })
);

const netValue = computed(() => monthNet(focusMonth.value) ?? 0);
const incomeTotal = computed(() => focusMonth.value?.income ?? 0);
const expensesTotal = computed(
  () =>
    (focusMonth.value?.expensesNeed ?? 0) +
    (focusMonth.value?.expensesWant ?? 0)
);

// Context: how this month compares to the previous month and the
// 3-month window average (focus + two prior)
const priorNet = computed(() =>
  monthNet(transactionStore.net_incomes[focusIndex.value + 1])
);
const priorLabel = computed(() =>
  monthDate(focusIndex.value + 1).toLocaleString(undefined, { month: "short" })
);
const deltaPrior = computed(() =>
  priorNet.value === null ? null : netValue.value - priorNet.value
);

const deltaAvg = computed(() => {
  const nets = [0, 1, 2]
    .map((i) => monthNet(transactionStore.net_incomes[focusIndex.value + i]))
    .filter((n) => n !== null);
  if (nets.length < 2) return null;
  const avg = nets.reduce((a, b) => a + b, 0) / nets.length;
  return netValue.value - avg;
});

// Sparkline (merged in from the old NetTrend card)
const seriesMap = computed(() => {
  const baseIndex = transactionStore.monthsAgo;
  const income = [];
  const expensesNeed = [];
  const expensesWant = [];
  const net = [];

  const monthLabel = (offset) =>
    monthDate(baseIndex + offset + 1).toLocaleString(undefined, {
      month: "short",
      year: "numeric",
    });

  // build from oldest to newest so the sparkline runs left-to-right
  // chronologically, up to 12 months ending at the focus month
  for (let i = 11; i >= 0; i--) {
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

const currentSeries = computed(() => seriesMap.value[mode.value] ?? []);

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
  <div class="cashflow">
    <div class="net-header">
      <div>
        <div class="muted text-caption">
          Focus month
        </div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ focusLabel }}
        </div>
      </div>
      <div
        class="net-value"
        :class="netValue >= 0 ? 'positive' : 'negative'"
      >
        {{ formatCurrency(netValue) }}
      </div>
    </div>

    <div class="deltas">
      <span
        v-if="deltaPrior !== null"
        class="delta-chip"
        :class="deltaPrior >= 0 ? 'positive' : 'negative'"
      >
        <v-icon
          :icon="deltaPrior >= 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'"
          size="x-small"
        />
        {{ formatCurrency(Math.abs(deltaPrior)) }} vs. {{ priorLabel }}
      </span>
      <span
        v-if="deltaAvg !== null"
        class="delta-chip"
        :class="deltaAvg >= 0 ? 'positive' : 'negative'"
      >
        <v-icon
          :icon="deltaAvg >= 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'"
          size="x-small"
        />
        {{ formatCurrency(Math.abs(deltaAvg)) }} vs. 3-mo avg
      </span>
    </div>

    <div class="pill-row">
      <span class="amount-chip positive">
        Income: {{ formatCurrency(incomeTotal) }}
      </span>
      <span class="amount-chip negative">
        Expenses: {{ formatCurrency(expensesTotal) }}
      </span>
    </div>

    <div
      v-if="currentSeries.length"
      class="trend-section"
    >
      <div class="trend-header">
        <span class="muted text-caption">
          Trend ({{ currentSeries.length }} months)
        </span>
        <v-btn-toggle
          v-model="mode"
          density="compact"
          mandatory
          color="primary"
        >
          <v-btn
            value="net"
            text="Net"
            size="small"
          />
          <v-btn
            value="income"
            text="Income"
            size="small"
          />
          <v-btn
            value="expensesNeed"
            text="Needs"
            size="small"
          />
          <v-btn
            value="expensesWant"
            text="Wants"
            size="small"
          />
        </v-btn-toggle>
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
          :class="
            plottedPoints[0].value >= plottedPoints[plottedPoints.length - 1].value
              ? 'negative'
              : 'positive'
          "
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          :cx="plottedPoints[plottedPoints.length - 1].x"
          :cy="plottedPoints[plottedPoints.length - 1].y"
          r="2.5"
          fill="currentColor"
          :class="
            plottedPoints[0].value >= plottedPoints[plottedPoints.length - 1].value
              ? 'negative'
              : 'positive'
          "
        />
      </svg>
      <div class="trend-labels muted text-caption">
        <span>{{ currentSeries[0]?.label }}</span>
        <span>{{ currentSeries[currentSeries.length - 1]?.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cashflow {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.net-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.net-value {
  font-size: 1.7rem;
  font-weight: 800;
}
.deltas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.delta-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-outline), 0.1);
  font-size: 0.85rem;
  font-weight: 600;
}
.pill-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.amount-chip {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: rgba(var(--v-theme-outline), 0.1);
  font-size: 0.9rem;
  font-weight: 600;
}
.trend-section {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.2);
  padding-top: 8px;
}
.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.sparkline {
  width: 100%;
  height: 64px;
}
.trend-labels {
  display: flex;
  justify-content: space-between;
}
.positive {
  color: rgb(var(--v-theme-success));
}
.negative {
  color: rgb(var(--v-theme-error));
}
</style>
