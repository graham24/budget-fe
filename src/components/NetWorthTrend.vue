<script setup>
import { computed, ref } from "vue";
import { useNetWorthStore } from "../stores/netWorth";

const netWorthStore = useNetWorthStore();
const mode = ref("net_worth");
const width = 120;
const height = 60;
const padding = 6;

function monthLabel(month) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
}

const series = computed(() =>
  (netWorthStore.summary?.series ?? []).map((point) => ({
    label: monthLabel(point.month),
    value: point[mode.value],
  }))
);

// Debts going down is good — flip the trend color in debt mode
const trendingGood = computed(() => {
  const points = series.value;
  if (points.length < 2) return true;
  const rising = points[points.length - 1].value >= points[0].value;
  return mode.value === "debts" ? !rising : rising;
});

const plottedPoints = computed(() => {
  const points = series.value;
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

// The series always spans 12 months (zeros before the first entry), so key
// the empty state off whether any balances have been recorded at all
const hasHistory = computed(
  () =>
    series.value.length >= 2 &&
    netWorthStore.items.some((item) => item.entries.length > 0)
);
</script>

<template>
  <div
    v-if="hasHistory"
    class="trend-section"
  >
    <div class="trend-header">
      <span class="muted text-caption">
        Trend ({{ series.length }} months)
      </span>
      <v-btn-toggle
        v-model="mode"
        density="compact"
        mandatory
        color="primary"
      >
        <v-btn
          value="net_worth"
          text="Net"
          size="small"
        />
        <v-btn
          value="assets"
          text="Assets"
          size="small"
        />
        <v-btn
          value="debts"
          text="Debts"
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
        :class="trendingGood ? 'positive' : 'negative'"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        :cx="plottedPoints[plottedPoints.length - 1].x"
        :cy="plottedPoints[plottedPoints.length - 1].y"
        r="2.5"
        fill="currentColor"
        :class="trendingGood ? 'positive' : 'negative'"
      />
    </svg>
    <div class="trend-labels muted text-caption">
      <span>{{ series[0]?.label }}</span>
      <span>{{ series[series.length - 1]?.label }}</span>
    </div>
  </div>
  <p
    v-else
    class="muted text-caption text-center py-3"
  >
    Add balance updates over time to see your trend.
  </p>
</template>

<style scoped>
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
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
