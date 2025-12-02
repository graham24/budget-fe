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

const month1 = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
const month2 = new Date(new Date().getFullYear(), month1.getMonth() - 1, 1);
const month3 = new Date(new Date().getFullYear(), month2.getMonth() - 1, 1);

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
  const rows = [];
  transactions.value.forEach((transaction) => {
    let row = rows.find(
      (cat) =>
        cat.category === transaction.category &&
        cat.subCategory === transaction.sub_category
    );
    if (!row) {
      rows.push({
        category: transaction.category,
        subCategory: transaction.sub_category,
        month1: 0,
        month2: 0,
        month3: 0,
        total: 0,
      });
      row = rows.find(
        (cat) =>
          cat.category === transaction.category &&
          cat.subCategory === transaction.sub_category
      );
    }

    row.month1 +=
      new Date(transaction.date).getMonth() === month1.getMonth()
        ? transaction.amount
        : 0;
    row.month2 +=
      new Date(transaction.date).getMonth() === month2.getMonth()
        ? transaction.amount
        : 0;
    row.month3 +=
      new Date(transaction.date).getMonth() === month3.getMonth()
        ? transaction.amount
        : 0;
  });
  transactions.value.forEach((transaction) => {
    let matchingCategoryRows = rows.filter(
      (r) => r.category === transaction.category
    );
    matchingCategoryRows.forEach((r) => {
      r.total +=
        new Date(transaction.date).getMonth() === month1.getMonth()
          ? transaction.amount
          : 0;
    });
  });
  return rows;
});

const sortedRows = computed(() => {
  // Sort by total then month1
  return categoryRows.value.sort((a, b) => {
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

const headers = [
  // { title: "Category", value: "category" },
  { title: "Sub Category", value: "subCategory" },
  {
    title: month3.toLocaleString(undefined, { month: "long" }),
    value: "month3",
  },
  {
    title: month2.toLocaleString(undefined, { month: "long" }),
    value: "month2",
  },
  {
    title: month1.toLocaleString(undefined, { month: "long" }),
    value: "month1",
  },
  { title: "Average", value: "average" },
];
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
        {{ formatCurrency(item.month1) }}
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
.category-table :deep(.v-data-table__th) {
  background: rgba(var(--v-theme-primary), 0.05);
  font-weight: 700;
}
.category-table :deep(.v-data-table__tr:nth-child(even)) {
  background: rgba(var(--v-theme-primary), 0.02);
}
.category-table :deep(td) {
  border-color: rgba(var(--v-theme-outline), 0.25);
}
.group-row {
  background: rgba(var(--v-theme-primary), 0.08);
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
