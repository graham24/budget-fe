<script setup>
import { computed, reactive } from "vue";
import { useTransactionStore } from "../../stores/transaction";
import { useAccountStore } from "../../stores/account";
import { useUserStore } from "../../stores/user";

const transactionStore = useTransactionStore();
const accountStore = useAccountStore();
const userStore = useUserStore();

// account_id -> "Account description: First name", same as TransactionsTable
const accountLabels = computed(() => {
  const labels = new Map();
  for (const account of accountStore.accounts?.accounts ?? []) {
    const user = userStore.users.users.find((u) => u.id === account.user_id);
    labels.set(
      account.id,
      `${account.description}: ${user?.first_name ?? "Unknown"}`
    );
  }
  return labels;
});

function accountLabel(account_id) {
  return accountLabels.value.get(account_id) ?? "Unknown Account";
}
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
        key: `${transaction.category}|${transaction.sub_category}`,
        category: transaction.category,
        subCategory: transaction.sub_category,
        month1: 0,
        month2: 0,
        month3: 0,
        total: 0,
        transactions: [],
      };
      rows.push(row);
    }

    const txDate = new Date(transaction.date);
    if (sameMonth(txDate, m1)) row.month1 += transaction.amount;
    else if (sameMonth(txDate, m2)) row.month2 += transaction.amount;
    else if (sameMonth(txDate, m3)) row.month3 += transaction.amount;
    else return;
    // rows carry the transactions behind their numbers so the drill-down
    // expansion reads them directly
    row.transactions.push(transaction);
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
    row.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
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

// Drill-down edits go to a local draft, not the store transaction, so the
// tables don't recompute (and the row doesn't jump groups) mid-edit. The
// draft commits ~1.5s after the field loses focus — moving between the
// row's two fields cancels the pending commit.
const drafts = reactive({});
const pendingCommits = new Map();

function draftOf(transaction) {
  return drafts[transaction.id] ?? transaction;
}

function startEdit(transaction) {
  cancelCommit(transaction.id);
  if (!drafts[transaction.id]) {
    drafts[transaction.id] = {
      category: transaction.category,
      sub_category: transaction.sub_category,
      need: transaction.need,
    };
  }
}

function cancelCommit(id) {
  clearTimeout(pendingCommits.get(id));
  pendingCommits.delete(id);
}

function scheduleCommit(transaction) {
  cancelCommit(transaction.id);
  pendingCommits.set(
    transaction.id,
    setTimeout(() => commitDraft(transaction), 1500)
  );
}

function commitDraft(transaction) {
  pendingCommits.delete(transaction.id);
  const draft = drafts[transaction.id];
  if (!draft) return;
  delete drafts[transaction.id];
  if (
    draft.category === transaction.category &&
    draft.sub_category === transaction.sub_category &&
    draft.need === transaction.need
  ) {
    return;
  }
  transaction.category = draft.category;
  transaction.sub_category = draft.sub_category;
  transaction.need = draft.need;
  transactionStore.saveTransaction(transaction);
  if (transaction.category === "Transfer") {
    transaction.type = "Transfer";
  } else if (transaction.amount >= 0) {
    transaction.type = "Income";
  } else {
    transaction.type = "Expenses";
  }
}

function toggleNeed(transaction) {
  if (!drafts[transaction.id]) {
    drafts[transaction.id] = {
      category: transaction.category,
      sub_category: transaction.sub_category,
      need: transaction.need,
    };
  }
  drafts[transaction.id].need = !drafts[transaction.id].need;
  cancelCommit(transaction.id);
  pendingCommits.set(
    transaction.id,
    setTimeout(() => commitDraft(transaction), 1500)
  );
}

function categoryOptions(transaction) {
  const group = transactionStore.categories[transaction.type?.toLowerCase()];
  return (group ?? []).map((category) => category.name);
}

function subCategoryOptions(transaction) {
  const group = transactionStore.categories[transaction.type?.toLowerCase()];
  return (
    (group ?? []).find((cat) => cat.name === draftOf(transaction).category)
      ?.sub_categories ?? []
  );
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
  // must be `key:` — Vuetify only detects an existing expand column by key,
  // and would auto-append a duplicate if this used `value:`
  { title: "", key: "data-table-expand", sortable: false },
]);
</script>

<template>
  <div class="category-table-wrapper">
    <v-data-table
      :items="sortedRows"
      :headers="headers"
      :group-by="[{ key: 'category', name: 'Category' }]"
      item-value="key"
      show-expand
      expand-on-click
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
          <td></td>
        </tr>
      </template>
      <template v-slot:expanded-row="{ columns, item }">
        <tr class="drill-row">
          <td :colspan="columns.length">
            <div class="drill">
              <div
                v-for="t in item.transactions"
                :key="t.id"
                class="drill-tx"
              >
                <span class="drill-tx__date muted">{{ formatDate(t.date) }}</span>
                <span class="drill-tx__desc">{{ t.description }}</span>
                <span class="drill-tx__account muted">{{
                  accountLabel(t.account_id)
                }}</span>
                <v-combobox
                  v-model="draftOf(t).category"
                  class="drill-tx__edit"
                  density="compact"
                  variant="plain"
                  hide-details
                  :items="categoryOptions(t)"
                  @focus="startEdit(t)"
                  @blur="scheduleCommit(t)"
                />
                <v-combobox
                  v-model="draftOf(t).sub_category"
                  class="drill-tx__edit"
                  density="compact"
                  variant="plain"
                  hide-details
                  :items="subCategoryOptions(t)"
                  @focus="startEdit(t)"
                  @blur="scheduleCommit(t)"
                />
                <v-checkbox
                  v-if="type !== 'income'"
                  :model-value="draftOf(t).need"
                  label="Need"
                  density="compact"
                  hide-details
                  class="drill-tx__need"
                  @change="toggleNeed(t)"
                />
                <span class="drill-tx__amount">{{ formatCurrency(t.amount) }}</span>
              </div>
            </div>
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
          <td></td>
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
/* sub-category rows expand to the transactions behind their numbers */
.category-table :deep(tbody tr) {
  cursor: pointer;
}
.drill-row {
  cursor: default;
}
.drill-row > td {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.5);
}
.drill {
  padding: 6px 8px 6px 44px;
  display: flex;
  flex-direction: column;
}
.drill-tx {
  display: grid;
  grid-template-columns: 88px minmax(160px, 1fr) minmax(120px, auto) 150px 150px 80px auto;
  gap: 12px;
  align-items: center;
  padding: 4px 0;
  font-size: 0.82rem;
}
.drill-tx__account {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.drill-tx__edit {
  font-size: 0.82rem;
}
.drill-tx__edit :deep(.v-field__input) {
  font-size: 0.82rem;
  padding-top: 2px;
  padding-bottom: 2px;
  min-height: 0;
}
.drill-tx + .drill-tx {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.4);
}
.drill-tx__date {
  white-space: nowrap;
}
.drill-tx__need {
  font-size: 0.82rem;
}
.drill-tx__need :deep(.v-label) {
  font-size: 0.82rem;
  opacity: 0.7;
}
.drill-tx__amount {
  font-weight: 600;
  white-space: nowrap;
}
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.category-table :deep(table) {
  min-width: 560px;
}
</style>
