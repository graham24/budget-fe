<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();

// Mirrors the backend's normalize_description: drop tokens containing digits.
// Memoized by transaction id — descriptions are never edited in place, so
// this avoids re-tokenizing all 12 months of history whenever an unrelated
// transaction mutation (e.g. a category edit) invalidates this computed.
const normalizedCache = new Map();
function normalizeDescription(t) {
  let cached = normalizedCache.get(t.id);
  if (cached === undefined) {
    cached = t.description
      .split(/\s+/)
      .filter((token) => !/\d/.test(token))
      .join(" ")
      .toLowerCase()
      .trim();
    normalizedCache.set(t.id, cached);
  }
  return cached;
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

const recurring = computed(() => {
  const groups = new Map();
  for (const t of transactionStore.transactions) {
    if (t.amount >= 0 || t.category === "Transfer") continue;
    const key = normalizeDescription(t);
    if (!key) continue;
    let group = groups.get(key);
    if (!group) {
      group = { label: t.description, byMonth: new Map() };
      groups.set(key, group);
    }
    const mk = monthKey(t.date);
    group.byMonth.set(mk, (group.byMonth.get(mk) ?? 0) - t.amount);
  }

  const rows = [];
  for (const group of groups.values()) {
    // Recurring = seen in 3+ distinct months with consistent amounts (±30%)
    if (group.byMonth.size < 3) continue;
    const amounts = [...group.byMonth.values()];
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    if (min < max * 0.7) continue;

    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    // Months sort chronologically with this key format within a year span;
    // compare the newest month against the average of the rest
    const keys = [...group.byMonth.keys()].sort((a, b) => {
      const [ay, am] = a.split("-").map(Number);
      const [by, bm] = b.split("-").map(Number);
      return ay * 12 + am - (by * 12 + bm);
    });
    const latest = group.byMonth.get(keys[keys.length - 1]);
    const priorAvg =
      keys.slice(0, -1).reduce((sum, k) => sum + group.byMonth.get(k), 0) /
      (keys.length - 1);
    rows.push({
      label: group.label,
      avg,
      months: group.byMonth.size,
      priceUp: latest > priorAvg * 1.02,
    });
  }

  return rows.sort((a, b) => b.avg - a.avg).slice(0, 10);
});

const monthlyBaseline = computed(() =>
  recurring.value.reduce((sum, row) => sum + row.avg, 0)
);
</script>

<template>
  <div
    v-if="recurring.length"
    class="recurring"
  >
    <div class="baseline mb-2">
      <span class="muted text-caption">Monthly baseline</span>
      <span class="baseline__value">{{ formatCurrency(monthlyBaseline) }}</span>
    </div>
    <div class="recurring-list">
      <div
        v-for="row in recurring"
        :key="row.label"
        class="recurring-row"
      >
        <div class="recurring-row__info">
          <span class="recurring-row__label">{{ row.label }}</span>
          <span class="muted text-caption">{{ row.months }} months</span>
        </div>
        <div class="recurring-row__amount">
          <v-icon
            v-if="row.priceUp"
            icon="mdi-arrow-up-bold"
            size="x-small"
            color="error"
            title="Latest charge is above the usual amount"
          />
          {{ formatCurrency(row.avg) }}<span class="muted text-caption">/mo</span>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="muted text-caption"
  >
    No recurring charges detected yet — needs 3+ months of similar charges.
  </div>
</template>

<style scoped>
.baseline {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.baseline__value {
  font-size: 1.2rem;
  font-weight: 800;
}
.recurring-list {
  display: grid;
  gap: 8px;
}
.recurring-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.recurring-row__info {
  display: grid;
  gap: 0;
  min-width: 0;
}
.recurring-row__label {
  font-size: 0.9rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recurring-row__amount {
  font-weight: 700;
  white-space: nowrap;
}
</style>
