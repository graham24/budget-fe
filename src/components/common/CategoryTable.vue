<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../../stores/transaction";

const transactionStore = useTransactionStore();
const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  need: {
    type: Boolean,
    default: false,
  },
});

function monthRef(offsetFromToday) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offsetFromToday);
  return d;
}

function sameMonth(txDate, ref) {
  return (
    txDate.getFullYear() === ref.getFullYear() &&
    txDate.getMonth() === ref.getMonth()
  );
}

// month1 = focus month, month2/month3 = the two preceding months
const month1 = computed(() => monthRef(transactionStore.monthsAgo + 1));
const month2 = computed(() => monthRef(transactionStore.monthsAgo + 2));
const month3 = computed(() => monthRef(transactionStore.monthsAgo + 3));

const transactions = computed(() => {
  if (props.type?.toLowerCase() === "income") {
    return transactionStore.incomeTransactions;
  } else {
    return props.need
      ? transactionStore.expenseNeedTransactions
      : transactionStore.expenseWantTransactions;
  }
});

const categoryRows = computed(() => {
  const m1 = month1.value;
  const m2 = month2.value;
  const m3 = month3.value;
  const rows = [];

  transactions.value.forEach((transaction) => {
    let row = rows.find(
      (cat) =>
        cat.category === transaction.category &&
        cat.subCategory === transaction.sub_category
    );
    if (!row) {
      row = {
        category: transaction.category,
        subCategory: transaction.sub_category,
        month1: 0,
        month2: 0,
        month3: 0,
        total: 0,
      };
      rows.push(row);
    }

    const txDate = new Date(transaction.date);
    if (sameMonth(txDate, m1)) row.month1 += transaction.amount;
    else if (sameMonth(txDate, m2)) row.month2 += transaction.amount;
    else if (sameMonth(txDate, m3)) row.month3 += transaction.amount;
  });

  // Drop rows with no activity in any of the 3 displayed months — these come
  // from transactions that exist in the store but fall outside the window
  const activeRows = rows.filter(
    (row) =>
      Math.abs(row.month1) + Math.abs(row.month2) + Math.abs(row.month3) >
      0.005
  );

  // total = focus month sum per category group
  activeRows.forEach((row) => {
    row.total = activeRows
      .filter((r) => r.category === row.category)
      .reduce((sum, r) => sum + r.month1, 0);
  });

  return activeRows;
});

const sortedRows = computed(() => {
  return [...categoryRows.value].sort((a, b) => {
    if (b.total === a.total) {
      return props.type === "income"
        ? b.month1 - a.month1
        : a.month1 - b.month1;
    }
    return props.type === "income" ? b.total - a.total : a.total - b.total;
  });
});

function calculateAverage(item) {
  return (item.month1 + item.month2 + item.month3) / 3;
}

// Flag expense rows where the focus month is well above the prior two months'
// average (25%+ over and at least $25 more), so jumps stand out in the table.
function isOverspend(item) {
  if (props.type?.toLowerCase() === "income") return false;
  const prior = (Math.abs(item.month2) + Math.abs(item.month3)) / 2;
  if (prior === 0) return false;
  const current = Math.abs(item.month1);
  return current > prior * 1.25 && current - prior >= 25;
}

function overspendTitle(item) {
  const prior = (Math.abs(item.month2) + Math.abs(item.month3)) / 2;
  const pct = ((Math.abs(item.month1) / prior - 1) * 100).toFixed(0);
  return `${pct}% above the prior two months' average`;
}

function sumField(items, key) {
  return items.reduce((total, currentItem) => {
    const value = currentItem.raw?.[key] ?? currentItem[key] ?? 0;
    return total + value;
  }, 0);
}

const totalsRow = computed(() =>
  categoryRows.value.reduce(
    (totals, current) => ({
      ...totals,
      month1: totals.month1 + (current.month1 ?? 0),
      month2: totals.month2 + (current.month2 ?? 0),
      month3: totals.month3 + (current.month3 ?? 0),
    }),
    { subCategory: "Totals", month1: 0, month2: 0, month3: 0 }
  )
);

const headers = computed(() => [
  { title: "Sub Category", value: "subCategory" },
  {
    title: month3.value.toLocaleString(undefined, { month: "long", year: "numeric" }),
    value: "month3",
  },
  {
    title: month2.value.toLocaleString(undefined, { month: "long", year: "numeric" }),
    value: "month2",
  },
  {
    title: month1.value.toLocaleString(undefined, { month: "long", year: "numeric" }),
    value: "month1",
  },
  { title: "Average", value: "average" },
]);
</script>

<template>
  <div class="category-table-wrapper">
    <v-data-table
      :items="sortedRows"
      :headers="headers"
      :group-by="[{ key: 'category', name: 'Category' }]"
      hide-default-footer
      :items-per-page="-1"
      density="compact"
      class="category-table"
    >
      <template v-slot:header.data-table-group>
        <div>Category</div>
      </template>
      <template v-slot:group-header="{ item, toggleGroup, isGroupOpen }">
        <tr class="group-row">
          <td>
            <div class="d-flex align-center">
              <v-btn
                :icon="isGroupOpen(item) ? '$expand' : '$next'"
                color="medium-emphasis"
                density="comfortable"
                size="small"
                variant="outlined"
                @click="toggleGroup(item)"
              ></v-btn>
              <span class="ms-4">
                {{ item.value }}
                <span class="text-caption">({{ item.items.length }})</span>
              </span>
            </div>
          </td>
          <td class="text-caption text-medium-emphasis"></td>
          <td>
            {{ formatCurrency(sumField(item.items, "month3")) }}
          </td>
          <td>
            {{ formatCurrency(sumField(item.items, "month2")) }}
          </td>
          <td>
            {{ formatCurrency(sumField(item.items, "month1")) }}
          </td>
          <td>
            {{
              formatCurrency(
                calculateAverage({
                  month1: sumField(item.items, "month1"),
                  month2: sumField(item.items, "month2"),
                  month3: sumField(item.items, "month3"),
                })
              )
            }}
          </td>
        </tr>
      </template>
      <template v-slot:item.month1="{ item }">
        <span
          v-if="isOverspend(item)"
          class="overspend"
          :title="overspendTitle(item)"
        >
          {{ formatCurrency(item.month1) }}
          <v-icon icon="mdi-arrow-up-bold" size="x-small" />
        </span>
        <template v-else>{{ formatCurrency(item.month1) }}</template>
      </template>
      <template v-slot:item.month2="{ item }">
        {{ formatCurrency(item.month2) }}
      </template>
      <template v-slot:item.month3="{ item }">
        {{ formatCurrency(item.month3) }}
      </template>
      <template v-slot:item.average="{ item }">
        {{ formatCurrency(calculateAverage(item)) }}
      </template>
      <template v-slot:body.append>
        <tr class="totals-row">
          <td></td>
          <td>Totals</td>
          <td>{{ formatCurrency(totalsRow.month3) }}</td>
          <td>{{ formatCurrency(totalsRow.month2) }}</td>
          <td>{{ formatCurrency(totalsRow.month1) }}</td>
          <td>{{ formatCurrency(calculateAverage(totalsRow)) }}</td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>
<style scoped>
.income.negative,
.expense.negative {
  color: red;
}
.income.positive,
.expense.positive {
  color: green;
}
.totals-row {
  font-weight: 700;
}
.overspend {
  color: rgb(var(--v-theme-error));
  font-weight: 700;
  white-space: nowrap;
}
.category-table :deep(.v-data-table__th) {
  background: rgb(var(--v-theme-surface-variant));
}
.category-table :deep(.v-data-table__tr:nth-child(even)) {
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.category-table :deep(td) {
  border-color: rgba(var(--v-theme-outline), 0.5);
}
.group-row {
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: 600;
}
.totals-row td {
  border-top: 2px solid rgba(var(--v-theme-outline), 0.4);
}
.category-table-wrapper {
  width: 100%;
  overflow-x: auto;
}
.category-table :deep(table) {
  min-width: 560px;
}
</style>
