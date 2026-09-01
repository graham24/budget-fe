<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";
import SurfaceCard from "./common/SurfaceCard.vue";

const props = defineProps({
  // "cashflow" = income / spending / net / savings rate (dashboard overview,
  // landing page). "mix" = income / needs / wants / net, for the Insights tab
  // where the tables below break spending down the same way.
  variant: {
    type: String,
    default: "cashflow",
  },
});

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

const cashflowTiles = computed(() => {
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

const mixTiles = computed(() => {
  const f = focus.value;
  const p = prior.value;

  const income = f?.income ?? 0;
  const needs = -(f?.expensesNeed ?? 0);
  const wants = -(f?.expensesWant ?? 0);
  const net = income - needs - wants;

  const priorIncome = p?.income ?? 0;
  const priorNeeds = -(p?.expensesNeed ?? 0);
  const priorWants = -(p?.expensesWant ?? 0);
  const priorNet = priorIncome - priorNeeds - priorWants;

  return [
    {
      label: "Income",
      value: income,
      delta: p ? income - priorIncome : null,
      goodWhenUp: true,
    },
    {
      label: "Needs",
      value: needs,
      delta: p ? needs - priorNeeds : null,
      goodWhenUp: false,
    },
    {
      label: "Wants",
      value: wants,
      delta: p ? wants - priorWants : null,
      goodWhenUp: false,
    },
    {
      label: "Net",
      value: net,
      delta: p ? net - priorNet : null,
      goodWhenUp: true,
    },
  ];
});

const tiles = computed(() =>
  props.variant === "mix" ? mixTiles.value : cashflowTiles.value
);

function deltaClass(tile) {
  if (Math.abs(tile.delta) < 1) return "muted";
  const improved = tile.delta > 0 === tile.goodWhenUp;
  return improved ? "text-success" : "text-error";
}
</script>

<template>
  <!-- The strip is embedded at very different widths (full dashboard column,
       narrow landing-page card), so it reflows on its own width rather than
       the viewport's. -->
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
