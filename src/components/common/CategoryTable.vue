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

function getMonthRanges(months = 3) {
  const base = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const offset = transactionStore.monthsAgo ?? 0;

  return Array.from({ length: months }, (_, index) => {
    const endDate = new Date(base);
    endDate.setMonth(endDate.getMonth() - (offset + index));
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 1);
    return { key: `month${index + 1}`, startDate, endDate };
  });
}

const monthRanges = computed(() => getMonthRanges());
const monthLabels = computed(() =>
  monthRanges.value.map((range) =>
    range.startDate.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    })
  )
);

function normalizeDate(dateString) {
  const date = new Date(dateString);
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

function matchesType(transaction) {
  if (transaction.type) {
    return (transaction.type.toLowerCase() === props.type.toLowerCase() && transaction.need === props.need);
  }
  if (props.type.toLowerCase() === "income") return transaction.amount >= 0;
  if (props.type.toLowerCase() === "expenses") return transaction.amount < 0;
  return true;
}

function buildCategoryMap(ranges) {
  const categoryMap = {};
  const transactions = transactionStore.transactions?.all_transactions ?? [];

  transactions.forEach((transaction) => {
    if (!matchesType(transaction)) return;

    const transactionDate = normalizeDate(transaction.date);
    const range = ranges.find(
      ({ startDate, endDate }) =>
        transactionDate >= startDate && transactionDate < endDate
    );

    if (!range) return;

    const category =
      categoryMap[transaction.category] ??
      (categoryMap[transaction.category] = {
        category: transaction.category,
        month1: 0,
        month2: 0,
        month3: 0,
        subCategories: {},
      });

    category[range.key] += transaction.amount;

    const subCategoryKey = transaction.sub_category ?? "Uncategorized";
    const subCategory =
      category.subCategories[subCategoryKey] ??
      (category.subCategories[subCategoryKey] = {
        category: transaction.category,
        subCategory: subCategoryKey,
        month1: 0,
        month2: 0,
        month3: 0,
      });

    subCategory[range.key] += transaction.amount;
  });

  return categoryMap;
}

const categoryMap = computed(() => buildCategoryMap(monthRanges.value));

const categoryTotals = computed(() => {
  const isIncome = props.type?.toLowerCase() === "income";
  const categorySort = (a, b) =>
    isIncome
      ? calculateAverage(b) - calculateAverage(a)
      : calculateAverage(a) - calculateAverage(b);

  return Object.values(categoryMap.value)
    .sort(categorySort)
    .flatMap((category) =>
      Object.values(category.subCategories).sort(categorySort)
    );
});

function calculateAverage(item) {
  return (item.month1 + item.month2 + item.month3) / 3;
}

function sumField(items, key) {
  return items.reduce((total, currentItem) => {
    const value = currentItem.raw?.[key] ?? 0;
    return total + value;
  }, 0);
}

const totalsRow = computed(() =>
  categoryTotals.value.reduce(
    (totals, current) => ({
      ...totals,
      month1: totals.month1 + (current.month1 ?? 0),
      month2: totals.month2 + (current.month2 ?? 0),
      month3: totals.month3 + (current.month3 ?? 0),
    }),
    { subCategory: "Totals", month1: 0, month2: 0, month3: 0 }
  )
);

const headers = computed(() => {
  const [month1Label, month2Label, month3Label] = monthLabels.value;
  return [
    // { title: "Category", value: "category" },
    { title: "Sub Category", value: "subCategory" },    
    { title: month3Label ?? "Month 3", value: "month3" },
    { title: month2Label ?? "Month 2", value: "month2" },
    { title: month1Label ?? "Month 1", value: "month1" },
    { title: "Average", value: "average" },
  ];
});
</script>

<template>
  <div class="category-table-wrapper">
    <v-data-table
      :items="categoryTotals"
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
