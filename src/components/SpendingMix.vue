<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();

const palette = [
  "#42a5f5",
  "#66bb6a",
  "#ffa726",
  "#ab47bc",
  "#ef5350",
  "#26c6da",
  "#8d6e63",
];

const slices = computed(() => {
  const byCategory = new Map();
  for (const t of transactionStore.focusMonthTransactions) {
    if (t.amount >= 0 || t.category === "Transfer") continue;
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) - t.amount);
  }

  const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 6);
  const otherTotal = sorted.slice(6).reduce((sum, [, v]) => sum + v, 0);
  if (otherTotal > 0) top.push(["Other", otherTotal]);

  const total = top.reduce((sum, [, v]) => sum + v, 0);
  if (total <= 0) return [];

  let offset = 0;
  return top.map(([category, amount], i) => {
    const pct = (amount / total) * 100;
    const slice = {
      category,
      amount,
      pct,
      color: palette[i % palette.length],
      // stroke-dasharray donut: each slice is a dash starting at its offset
      dasharray: `${pct} ${100 - pct}`,
      // dashoffset rotates the slice into place; 25 starts at 12 o'clock
      dashoffset: 25 - offset,
    };
    offset += pct;
    return slice;
  });
});

const totalSpent = computed(() =>
  slices.value.reduce((sum, slice) => sum + slice.amount, 0)
);
</script>

<template>
  <div
    v-if="slices.length"
    class="spending-mix"
  >
    <svg
      viewBox="0 0 42 42"
      class="donut"
      role="img"
      aria-label="Spending by category"
    >
      <circle
        v-for="slice in slices"
        :key="slice.category"
        cx="21"
        cy="21"
        r="15.91549430918954"
        fill="transparent"
        :stroke="slice.color"
        stroke-width="5"
        :stroke-dasharray="slice.dasharray"
        :stroke-dashoffset="slice.dashoffset"
      />
      <text
        x="21"
        y="20"
        class="donut__total"
        text-anchor="middle"
      >
        {{ formatCurrency(totalSpent) }}
      </text>
      <text
        x="21"
        y="24.5"
        class="donut__caption"
        text-anchor="middle"
      >spent</text>
    </svg>
    <div class="legend">
      <div
        v-for="slice in slices"
        :key="slice.category"
        class="legend-row"
      >
        <span
          class="legend-dot"
          :style="{ background: slice.color }"
        />
        <span class="legend-label">{{ slice.category }}</span>
        <span class="legend-amount">
          {{ formatCurrency(slice.amount) }}
          <span class="muted">({{ slice.pct.toFixed(0) }}%)</span>
        </span>
      </div>
    </div>
  </div>
  <div
    v-else
    class="muted text-caption"
  >
    No expenses in the focus month.
  </div>
</template>

<style scoped>
.spending-mix {
  display: flex;
  align-items: center;
  gap: 18px;
}
.donut {
  width: 150px;
  min-width: 130px;
}
.donut__total {
  font-size: 4.5px;
  font-weight: 700;
  fill: rgba(var(--v-theme-on-surface), 0.95);
}
.donut__caption {
  font-size: 2.8px;
  fill: rgba(var(--v-theme-on-surface), 0.6);
}
.legend {
  display: grid;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.legend-amount {
  white-space: nowrap;
  font-weight: 600;
}
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

@media (max-width: 600px) {
  .spending-mix {
    flex-direction: column;
  }
  .donut {
    width: 170px;
  }
  .legend {
    width: 100%;
  }
}
</style>
