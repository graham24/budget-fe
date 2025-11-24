<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();

const netTrend = computed(() => {
  const baseIndex = transactionStore.monthsAgo;
  const trend = [];
  for (let i = 0; i < 3; i++) {
    const entry = transactionStore.net_incomes?.[baseIndex + i];
    if (!entry) continue;
    trend.push((entry["income"] ?? 0) + (entry["expenses"] ?? 0));
  }
  return trend;
});

const trendDelta = computed(() => {
  if (netTrend.value.length < 2) return 0;
  const latest = netTrend.value[0];
  const previous = netTrend.value[1];
  return latest - previous;
});
</script>

<template>
  <div class="trend-wrapper" v-if="netTrend.length">
    <div class="sparkline-header">
      <span class="muted text-caption">Trend (3 months)</span>
      <span class="delta" :class="trendDelta >= 0 ? 'positive' : 'negative'">
        {{ trendDelta >= 0 ? "+" : "" }}{{ formatCurrency(trendDelta) }}
      </span>
    </div>
    <svg class="sparkline" viewBox="0 0 120 36" preserveAspectRatio="none">
      <polyline
        :points="netTrend
          .map((value, idx, arr) => {
            const x = (idx / Math.max(arr.length - 1, 1)) * 120;
            const max = Math.max(...arr);
            const min = Math.min(...arr);
            const range = Math.max(max - min, 1);
            const y = 36 - ((value - min) / range) * 30 - 3;
            return `${x},${y}`;
          })
          .join(' ')"
        fill="none"
        stroke="currentColor"
        :class="netTrend[0] >= netTrend[netTrend.length - 1] ? 'negative' : 'positive'"
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
}
.sparkline {
  width: 100%;
  height: 36px;
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
