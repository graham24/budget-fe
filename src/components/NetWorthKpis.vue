<script setup>
import { computed } from "vue";
import { useNetWorthStore } from "../stores/netWorth";
import SurfaceCard from "./common/SurfaceCard.vue";

const netWorthStore = useNetWorthStore();

// Delta vs. the prior month's series point
const priorPoint = computed(() => {
  const series = netWorthStore.summary?.series ?? [];
  return series.length >= 2 ? series[series.length - 2] : null;
});

const priorLabel = computed(() => {
  if (!priorPoint.value) return "";
  const [year, month] = priorPoint.value.month.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString(undefined, {
    month: "short",
  });
});

const tiles = computed(() => {
  const p = priorPoint.value;
  return [
    {
      label: "Total assets",
      value: netWorthStore.totalAssets,
      delta: p ? netWorthStore.totalAssets - p.assets : null,
      goodWhenUp: true,
    },
    {
      label: "Total debts",
      value: netWorthStore.totalDebts,
      delta: p ? netWorthStore.totalDebts - p.debts : null,
      goodWhenUp: false,
    },
    {
      label: "Net worth",
      value: netWorthStore.netWorth,
      delta: p ? netWorthStore.netWorth - p.net_worth : null,
      goodWhenUp: true,
    },
  ];
});

// The monthly series only carries asset/debt totals, so this tile shows the
// two balances behind the ratio instead of a month-over-month delta.
const cashToCards = computed(() => {
  const cash = netWorthStore.cashTotal;
  const cards = netWorthStore.creditCardTotal;
  return {
    cash,
    cards,
    ratio: cards > 0 ? cash / cards : null,
  };
});

function ratioClass(ratio) {
  if (ratio === null) return "muted";
  return ratio >= 1 ? "text-success" : "text-error";
}

function deltaClass(tile) {
  if (Math.abs(tile.delta) < 1) return "muted";
  const improved = tile.delta > 0 === tile.goodWhenUp;
  return improved ? "text-success" : "text-error";
}
</script>

<template>
  <!-- Same reflow-on-own-width treatment as KpiStrip: this is embedded both
       full width and inside the landing page's narrow preview card. -->
  <div class="kpi-strip-wrap">
    <div class="kpi-strip">
      <SurfaceCard
        v-for="tile in tiles"
        :key="tile.label"
        class="kpi"
        padding="16px 18px"
      >
        <div class="pill">
          {{ tile.label }}
        </div>
        <div class="kpi__value">
          {{ formatCurrency(tile.value) }}
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
          No history yet
        </div>
      </SurfaceCard>
      <SurfaceCard
        class="kpi"
        padding="16px 18px"
      >
        <div class="pill">
          Cash to credit cards
        </div>
        <div
          class="kpi__value"
          :class="ratioClass(cashToCards.ratio)"
        >
          {{ cashToCards.ratio === null ? "—" : `${cashToCards.ratio.toFixed(1)}×` }}
        </div>
        <div class="kpi__delta muted">
          <template v-if="cashToCards.ratio !== null">
            {{ formatCurrency(cashToCards.cash) }} cash · {{ formatCurrency(cashToCards.cards) }} cards
          </template>
          <template v-else>
            No credit card balances
          </template>
        </div>
      </SurfaceCard>
    </div>
  </div>
</template>

<style scoped>
.kpi-strip-wrap {
  container-type: inline-size;
}
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap);
}
.kpi {
  min-width: 0;
}
.kpi__value {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin: 4px 0;
}
.kpi__delta {
  font-size: 12.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

/* two-up once four tiles would crowd, one-up on a phone */
@container (max-width: 820px) {
  .kpi-strip {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .kpi__value {
    font-size: 23px;
  }
}
@container (max-width: 340px) {
  .kpi-strip {
    grid-template-columns: 1fr;
  }
}

/* browsers without container queries keep the old viewport behaviour */
@supports not (container-type: inline-size) {
  @media (max-width: 960px) {
    .kpi-strip {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .kpi__value {
      font-size: 23px;
    }
  }
}
</style>
