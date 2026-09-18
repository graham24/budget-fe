<script setup>
import { ref, reactive, computed, watch } from "vue";
import { useDisplay } from "vuetify";
import { isExpense, isIncome, isTransfer, useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
import { sliceByDateRange } from "../utils/dateWindow";
import Dialog from "./common/Dialog.vue";
import CategoryRuleForm from "./CategoryRuleForm.vue";
import TransactionReviewDialog from "./TransactionReviewDialog.vue";

const props = defineProps({
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const transactionStore = useTransactionStore();
const accountStore = useAccountStore();
const { smAndDown } = useDisplay();

// ---- toolbar state ----
const activeTab = ref("all");
const searchTerm = ref("");
const debouncedSearchTerm = ref("");
const accountFilter = ref(null); // null = all accounts
const sortOrder = ref("desc");

let searchTimeout = null;
watch(searchTerm, (value) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearchTerm.value = value;
  }, 250);
});

// ---- active 3-month window, driven by transactionStore.monthsAgo ----
const windowStart = computed(() => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - (transactionStore.monthsAgo + 3));
  return d;
});
const windowEnd = computed(() => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - transactionStore.monthsAgo);
  return d;
});
const windowedTransactions = computed(() =>
  sliceByDateRange(transactionStore.transactions, windowStart.value, windowEnd.value)
);

// Per-transaction date decoration, computed once per windowed transaction
// instead of re-parsing `new Date(t.date)` in the sort comparator and again
// in dayKey/dayLabel. Keyed by id (not spread onto the transaction object)
// so the store's transaction objects keep their identity for v-model edits.
function dayParts(date) {
  return {
    ms: date.getTime(),
    dayKey: date.toDateString(),
    dayLabel: date.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  };
}

const dateDecorations = computed(() => {
  const map = new Map();
  for (const t of windowedTransactions.value) {
    const d = new Date(t.date);
    // `created` is when the import wrote the row. Rows imported before the
    // column existed (or any payload without it) fall back to the
    // transaction date, so sorting never lands on NaN.
    const fetched = t.created ? new Date(t.created) : d;
    map.set(t.id, {
      ...dayParts(d),
      fetched: dayParts(Number.isNaN(fetched.getTime()) ? d : fetched),
    });
  }
  return map;
});

// Which timestamp the table is ordered and grouped by
const sortByFetched = computed(() => sortOrder.value.startsWith("fetched"));
const sortAscending = computed(() => sortOrder.value.endsWith("asc"));

function decorationFor(id) {
  const decoration = dateDecorations.value.get(id);
  return sortByFetched.value ? decoration.fetched : decoration;
}

function matchesTab(t, tab) {
  if (tab === "all") return true;
  if (tab === "income") return isIncome(t);
  if (tab === "needs") return isExpense(t) && t.need;
  if (tab === "wants") return isExpense(t) && !t.need;
  if (tab === "transfers") return isTransfer(t);
  if (tab === "review") return t.category === "Unknown" || t.sub_category === "Unknown";
  return true;
}

const tabDefs = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "needs", label: "Needs" },
  { key: "wants", label: "Wants" },
  { key: "transfers", label: "Transfers" },
];

const tabCounts = computed(() => {
  const counts = { all: 0, income: 0, needs: 0, wants: 0, transfers: 0, review: 0 };
  for (const t of windowedTransactions.value) {
    for (const key of Object.keys(counts)) {
      if (matchesTab(t, key)) counts[key] += 1;
    }
  }
  return counts;
});

// ---- accounts ----
const accountOptions = computed(() =>
  (accountStore.accounts?.accounts ?? []).map((a) => ({ id: a.id, label: a.description }))
);
const accountSelectItems = computed(() => [
  { id: null, label: "All accounts" },
  ...accountOptions.value,
]);
const accountLabels = computed(() => {
  const labels = new Map();
  for (const account of accountStore.accounts?.accounts ?? []) {
    labels.set(account.id, account.description);
  }
  return labels;
});
function accountLabel(accountId) {
  return accountLabels.value.get(accountId) ?? "Unknown";
}

// ---- search index (built once per data change, not per keystroke) ----
const searchIndex = computed(() => {
  const index = new Map();
  for (const t of windowedTransactions.value) {
    index.set(
      t.id,
      (t.description + t.category + t.sub_category + accountLabel(t.account_id)).toLowerCase()
    );
  }
  return index;
});

// ---- filtered + sorted items ----
const filteredItems = computed(() => {
  let items = windowedTransactions.value.filter((t) => matchesTab(t, activeTab.value));
  if (accountFilter.value) {
    items = items.filter((t) => t.account_id === accountFilter.value);
  }
  if (debouncedSearchTerm.value) {
    const query = debouncedSearchTerm.value.toLowerCase();
    items = items.filter((t) => searchIndex.value.get(t.id)?.includes(query));
  }
  return [...items].sort((a, b) => {
    const diff = decorationFor(b.id).ms - decorationFor(a.id).ms;
    return sortAscending.value ? -diff : diff;
  });
});

// ---- group rows by calendar day ----
const groupedByDay = computed(() => {
  const groups = [];
  const byKey = new Map();
  for (const t of filteredItems.value) {
    // group by the same date the list is ordered by, or the headers run out
    // of sequence with the rows under them
    const { dayKey, dayLabel } = decorationFor(t.id);
    let group = byKey.get(dayKey);
    if (!group) {
      // say so explicitly, or "Friday, July 17" reads as the transaction date
      const label = sortByFetched.value ? `Fetched ${dayLabel}` : dayLabel;
      group = { key: dayKey, label, total: 0, items: [] };
      byKey.set(dayKey, group);
      groups.push(group);
    }
    group.total += t.amount;
    group.items.push(t);
  }
  return groups;
});

// Flattened, uniform list for v-virtual-scroll (day headers interleaved with
// their rows), the grouped table/list markup above renders every row with
// no windowing, which gets heavy once a 3-month window runs into the
// hundreds/thousands of rows.
const virtualRows = computed(() => {
  const rows = [];
  for (const group of groupedByDay.value) {
    rows.push({ type: "header", key: `h-${group.key}`, group });
    for (const item of group.items) {
      rows.push({ type: "row", key: item.id, item });
    }
  }
  return rows;
});

// v-virtual-scroll's own scroll container isn't a <table>, so the desktop
// row grid uses CSS grid instead, this template mirrors the old <th>/<td>
// column widths so header and rows stay aligned.
const gridTemplateColumns = computed(() => {
  const cols = [];
  if (!props.readOnly) cols.push("36px");
  cols.push("minmax(160px, 1.4fr)"); // description
  cols.push("minmax(220px, 1.6fr)"); // category
  cols.push("minmax(120px, 1fr)"); // account
  cols.push("minmax(90px, 0.8fr)"); // amount
  cols.push("minmax(90px, 0.9fr)"); // type
  if (!props.readOnly) cols.push("40px"); // actions
  return cols.join(" ");
});

// ---- row selection ----
const selected = reactive({});
const selectedIds = computed(() => Object.keys(selected).filter((id) => selected[id]));
const selectedCount = computed(() => selectedIds.value.length);
const selectedTransactions = computed(() => filteredItems.value.filter((t) => selected[t.id]));
const allSelected = computed(
  () => filteredItems.value.length > 0 && filteredItems.value.every((t) => selected[t.id])
);
function toggleSelectAll() {
  const next = !allSelected.value;
  for (const t of filteredItems.value) {
    if (next) selected[t.id] = true;
    else delete selected[t.id];
  }
}
function clearSelection() {
  for (const key of Object.keys(selected)) delete selected[key];
}

// ---- editing ----
// Snapshot of the row being edited so blur events without an actual
// change don't fire a save per combobox.
let editSnapshot = null;
function rememberEdit(transaction) {
  editSnapshot = {
    id: transaction.id,
    category: transaction.category,
    sub_category: transaction.sub_category,
  };
}
function normalizeType(transaction) {
  if (transaction.category === "Transfer") {
    transaction.type = "Transfer";
  } else if (transaction.income) {
    transaction.type = "Income";
  } else {
    transaction.type = "Expenses";
  }
}
function saveTransaction(transaction) {
  normalizeType(transaction);
  transactionStore.saveTransaction(transaction);
}
function saveIfChanged(transaction) {
  if (
    editSnapshot &&
    editSnapshot.id === transaction.id &&
    editSnapshot.category === transaction.category &&
    editSnapshot.sub_category === transaction.sub_category
  ) {
    return;
  }
  saveTransaction(transaction);
}

function typeKey(transaction) {
  if (transaction.category === "Transfer") return "transfers";
  return transaction.income ? "income" : "expenses";
}
function categoryItems(transaction) {
  return (transactionStore.categories[typeKey(transaction)] ?? []).map((c) => c.name);
}
function subCategoryItems(transaction) {
  return (
    transactionStore.categories[typeKey(transaction)]?.find(
      (c) => c.name === transaction.category
    )?.sub_categories ?? []
  );
}
// Choosing Need/Want also makes the row an expense, which is how a positive
// row gets reclassified from income to a refund.
function setNeed(transaction, need) {
  transaction.need = need;
  transaction.income = false;
  saveTransaction(transaction);
}
function setIncome(transaction) {
  transaction.income = true;
  transaction.need = false;
  saveTransaction(transaction);
}
// Only money coming in can be income or a refund; debits are always expenses.
function canBeIncome(transaction) {
  return !isTransfer(transaction) && transaction.amount > 0;
}
function kindColor(transaction) {
  if (isIncome(transaction)) return "success";
  return transaction.need ? "primary" : undefined;
}
function kindLabel(transaction) {
  if (isIncome(transaction)) return "Income";
  const kind = transaction.need ? "Need" : "Want";
  return transaction.amount > 0 ? `Refund · ${kind}` : kind;
}
function isReview(transaction) {
  return transaction.category === "Unknown" || transaction.sub_category === "Unknown";
}

// ---- create-rule dialog ----
const ruleSource = ref(null);
const showRuleDialog = computed({
  get: () => ruleSource.value !== null,
  set: (open) => {
    if (!open) ruleSource.value = null;
  },
});
function createRuleFromSelection() {
  if (selectedTransactions.value.length === 1) {
    ruleSource.value = selectedTransactions.value[0];
  }
}

// ---- bulk set-category dialog ----
const showBulkCategoryDialog = ref(false);
const bulkCategory = ref(null);
const bulkSubCategory = ref(null);
const bulkCategoryItems = computed(() => {
  const first = selectedTransactions.value[0];
  return first ? categoryItems(first) : [];
});
const bulkSubCategoryItems = computed(() => {
  const first = selectedTransactions.value[0];
  if (!first || !bulkCategory.value) return [];
  return (
    transactionStore.categories[typeKey(first)]?.find((c) => c.name === bulkCategory.value)
      ?.sub_categories ?? []
  );
});
function openBulkCategory() {
  bulkCategory.value = null;
  bulkSubCategory.value = null;
  showBulkCategoryDialog.value = true;
}
function applyBulkCategory() {
  if (!bulkCategory.value) return;
  for (const t of selectedTransactions.value) {
    t.category = bulkCategory.value;
    t.sub_category = bulkSubCategory.value ?? "";
    saveTransaction(t);
  }
  showBulkCategoryDialog.value = false;
  clearSelection();
}
function bulkMarkNeed() {
  for (const t of selectedTransactions.value) {
    if (isExpense(t)) {
      t.need = true;
      saveTransaction(t);
    }
  }
  clearSelection();
}
// Positive rows only: flips them between income and refund (expense).
const selectionHasCredits = computed(() =>
  selectedTransactions.value.some(canBeIncome)
);
function bulkSetIncome(income) {
  for (const t of selectedTransactions.value) {
    if (canBeIncome(t) && t.income !== income) {
      t.income = income;
      if (income) t.need = false;
      saveTransaction(t);
    }
  }
  clearSelection();
}

// ---- guided review dialog (unknown-category queue) ----
const showReviewDialog = ref(false);
const reviewList = ref([]);
function openReview() {
  reviewList.value = [...transactionStore.unknownTransactions];
  showReviewDialog.value = true;
}

// ---- mobile transaction detail sheet ----
const detailTransaction = ref(null);
function openDetail(transaction) {
  if (!smAndDown.value || props.readOnly) return;
  detailTransaction.value = transaction;
}
function closeDetail() {
  detailTransaction.value = null;
}
function saveDetail() {
  if (detailTransaction.value) saveTransaction(detailTransaction.value);
  closeDetail();
}

// ---- export active window as CSV ----
function exportCsv() {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = "Date,Description,Category,Sub-Category,Amount,Need,Type,Account ID";
  const lines = windowedTransactions.value.map((t) =>
    [
      new Date(t.date).toISOString().split("T")[0],
      escape(t.description),
      escape(t.category),
      escape(t.sub_category),
      t.amount,
      t.need,
      t.type,
      t.account_id,
    ].join(",")
  );
  const blob = new Blob([[header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `transactions-${windowStart.value.toISOString().split("T")[0]}-to-${
    windowEnd.value.toISOString().split("T")[0]
  }.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
</script>

<template>
  <div class="container">
    <div class="tabs-row">
      <button
        v-for="tab in tabDefs"
        :key="tab.key"
        type="button"
        class="tab-chip"
        :class="{ 'tab-chip--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }} {{ tabCounts[tab.key] }}
      </button>
      <button
        v-if="tabCounts.review > 0"
        type="button"
        class="tab-chip tab-chip--review"
        :class="{ 'tab-chip--active': activeTab === 'review' }"
        @click="activeTab = 'review'"
      >
        To review {{ tabCounts.review }}
      </button>
    </div>

    <div class="toolbar">
      <v-text-field
        v-model="searchTerm"
        placeholder="Search description, amount or account"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        single-line
        class="search-input"
      />
      <v-select
        v-model="accountFilter"
        :items="accountSelectItems"
        item-title="label"
        item-value="id"
        variant="outlined"
        density="comfortable"
        hide-details
        class="account-select"
      />
      <v-select
        v-model="sortOrder"
        :items="[
          { value: 'desc', title: 'Date ↓' },
          { value: 'asc', title: 'Date ↑' },
          { value: 'fetched-desc', title: 'Fetched ↓' },
          { value: 'fetched-asc', title: 'Fetched ↑' },
        ]"
        variant="outlined"
        density="comfortable"
        hide-details
        class="sort-select"
      />
      <v-btn
        v-if="!readOnly && transactionStore.unknownTransactions.length"
        color="warning"
        variant="tonal"
        prepend-icon="mdi-eye-check"
        @click="openReview"
      >
        Review ({{ transactionStore.unknownTransactions.length }})
      </v-btn>
      <v-btn
        variant="tonal"
        prepend-icon="mdi-download"
        @click="exportCsv"
      >
        Export CSV
      </v-btn>
    </div>

    <!-- Desktop table -->
    <div
      v-if="!smAndDown"
      class="table-wrapper"
    >
      <div class="tx-grid">
        <div
          class="tx-grid__header"
          :style="{ gridTemplateColumns }"
        >
          <div
            v-if="!readOnly"
            class="col-check"
          >
            <v-checkbox
              :model-value="allSelected"
              density="compact"
              hide-details
              @update:model-value="toggleSelectAll"
            />
          </div>
          <div>Description</div>
          <div>Category</div>
          <div>Account</div>
          <div class="col-amount">
            Amount
          </div>
          <div>Type</div>
          <div
            v-if="!readOnly"
            class="col-actions"
          />
        </div>

        <v-virtual-scroll
          :items="virtualRows"
          item-key="key"
          item-height="44"
          height="640"
          class="tx-grid__body"
        >
          <template #default="{ item: row }">
            <div
              v-if="row.type === 'header'"
              class="day-row"
            >
              <span class="day-label">{{ row.group.label }}</span>
              <span class="day-total mono">{{ formatCurrency(row.group.total) }}</span>
            </div>
            <div
              v-else
              class="tx-row"
              :style="{ gridTemplateColumns }"
              :class="{
                'tx-row--review': isReview(row.item),
                'tx-row--selected': !!selected[row.item.id],
              }"
            >
              <div
                v-if="!readOnly"
                class="col-check"
              >
                <v-checkbox
                  v-model="selected[row.item.id]"
                  density="compact"
                  hide-details
                />
              </div>
              <div>
                <div class="tx-description">
                  {{ row.item.description }}
                </div>
              </div>
              <div>
                <template v-if="!readOnly">
                  <span
                    v-if="isReview(row.item)"
                    class="review-label"
                  >Needs a category</span>
                  <v-combobox
                    v-model="row.item.category"
                    density="compact"
                    variant="plain"
                    hide-details
                    class="category-combo"
                    :items="categoryItems(row.item)"
                    @focus="rememberEdit(row.item)"
                    @blur="saveIfChanged(row.item)"
                  />
                  <v-combobox
                    v-model="row.item.sub_category"
                    density="compact"
                    variant="plain"
                    hide-details
                    class="sub-category-combo"
                    :items="subCategoryItems(row.item)"
                    @focus="rememberEdit(row.item)"
                    @blur="saveIfChanged(row.item)"
                  />
                </template>
                <template v-else>
                  <div class="tx-category">
                    {{ row.item.category }}
                  </div>
                  <div class="tx-subcategory muted">
                    {{ row.item.sub_category }}
                  </div>
                </template>
              </div>
              <div>
                <span class="account-pill">{{ accountLabel(row.item.account_id) }}</span>
              </div>
              <div class="col-amount">
                <span
                  class="amount mono"
                  :class="{
                    'amount-positive': row.item.amount >= 0,
                    'amount-transfer': row.item.category === 'Transfer',
                  }"
                >{{ formatCurrency(row.item.amount) }}</span>
              </div>
              <div>
                <v-chip
                  v-if="row.item.category === 'Transfer'"
                  size="small"
                  variant="outlined"
                >
                  Transfer
                </v-chip>
                <v-menu v-else-if="!readOnly">
                  <template #activator="{ props: menuProps }">
                    <v-chip
                      v-bind="menuProps"
                      size="small"
                      :color="kindColor(row.item)"
                      variant="tonal"
                      append-icon="mdi-chevron-down"
                    >
                      {{ kindLabel(row.item) }}
                    </v-chip>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-if="canBeIncome(row.item)"
                      @click="setIncome(row.item)"
                    >
                      <v-list-item-title>Income</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="setNeed(row.item, true)">
                      <v-list-item-title>
                        {{ canBeIncome(row.item) ? "Refund · Need" : "Need" }}
                      </v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="setNeed(row.item, false)">
                      <v-list-item-title>
                        {{ canBeIncome(row.item) ? "Refund · Want" : "Want" }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-chip
                  v-else
                  size="small"
                  :color="kindColor(row.item)"
                  variant="tonal"
                >
                  {{ kindLabel(row.item) }}
                </v-chip>
              </div>
              <div
                v-if="!readOnly"
                class="col-actions"
              >
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="ruleSource = row.item">
                      <v-list-item-title>Create rule</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </template>
        </v-virtual-scroll>
      </div>
      <div
        v-if="!filteredItems.length"
        class="empty-state muted"
      >
        No transactions match these filters.
      </div>
    </div>

    <!-- Mobile card list -->
    <v-virtual-scroll
      v-else
      :items="virtualRows"
      item-key="key"
      item-height="64"
      height="640"
      class="mobile-list"
    >
      <template #default="{ item: row }">
        <div
          v-if="row.type === 'header'"
          class="day-row day-row--mobile"
        >
          <span class="day-label">{{ row.group.label }}</span>
          <span class="day-total mono">{{ formatCurrency(row.group.total) }}</span>
        </div>
        <div
          v-else
          class="tx-card"
          :class="{ 'tx-card--review': isReview(row.item) }"
          @click="openDetail(row.item)"
        >
          <div class="tx-card__row">
            <div class="tx-description">
              {{ row.item.description }}
            </div>
            <div
              class="amount mono"
              :class="{
                'amount-positive': row.item.amount >= 0,
                'amount-transfer': row.item.category === 'Transfer',
              }"
            >
              {{ formatCurrency(row.item.amount) }}
            </div>
          </div>
          <div class="tx-card__meta">
            <v-chip
              v-if="isReview(row.item)"
              size="x-small"
              color="warning"
              variant="tonal"
            >
              Set type
            </v-chip>
            <v-chip
              v-else-if="row.item.category === 'Transfer'"
              size="x-small"
              variant="outlined"
            >
              Transfer
            </v-chip>
            <v-chip
              v-else
              size="x-small"
              :color="kindColor(row.item)"
              variant="tonal"
            >
              {{ kindLabel(row.item) }}
            </v-chip>
            <span class="muted">{{ row.item.category }} · {{ accountLabel(row.item.account_id) }}</span>
          </div>
        </div>
      </template>
    </v-virtual-scroll>
    <div
      v-if="smAndDown && !filteredItems.length"
      class="empty-state muted"
    >
      No transactions match these filters.
    </div>

    <!-- Bulk action bar -->
    <div
      v-if="!readOnly && selectedCount > 0"
      class="bulk-bar"
    >
      <span class="bulk-bar__count">{{ selectedCount }} selected</span>
      <v-btn
        variant="tonal"
        size="small"
        @click="openBulkCategory"
      >
        Set category
      </v-btn>
      <v-btn
        variant="tonal"
        size="small"
        @click="bulkMarkNeed"
      >
        Mark as need
      </v-btn>
      <template v-if="selectionHasCredits">
        <v-btn
          variant="tonal"
          size="small"
          @click="bulkSetIncome(false)"
        >
          Mark as refund
        </v-btn>
        <v-btn
          variant="tonal"
          size="small"
          @click="bulkSetIncome(true)"
        >
          Mark as income
        </v-btn>
      </template>
      <v-btn
        variant="tonal"
        size="small"
        :disabled="selectedCount !== 1"
        @click="createRuleFromSelection"
      >
        Create rule
      </v-btn>
      <v-btn
        variant="text"
        size="small"
        @click="clearSelection"
      >
        Clear
      </v-btn>
    </div>

    <Dialog
      v-model="showRuleDialog"
      title="Create Category Rule"
    >
      <CategoryRuleForm
        v-if="ruleSource"
        :initial-match-text="ruleSource.description"
        :initial-category="ruleSource.category"
        :initial-sub-category="ruleSource.sub_category"
        :initial-need="ruleSource.need"
        :initial-income="!!ruleSource.income"
        @saved="ruleSource = null"
        @cancel="ruleSource = null"
      />
    </Dialog>

    <Dialog
      v-model="showBulkCategoryDialog"
      title="Set category"
    >
      <div class="bulk-category-form">
        <v-combobox
          v-model="bulkCategory"
          label="Category"
          :items="bulkCategoryItems"
          variant="outlined"
          density="comfortable"
        />
        <v-combobox
          v-model="bulkSubCategory"
          label="Sub-category"
          :items="bulkSubCategoryItems"
          variant="outlined"
          density="comfortable"
        />
        <v-btn
          color="primary"
          block
          :disabled="!bulkCategory"
          @click="applyBulkCategory"
        >
          Apply to {{ selectedCount }} transaction{{ selectedCount === 1 ? "" : "s" }}
        </v-btn>
      </div>
    </Dialog>

    <Dialog
      :model-value="!!detailTransaction"
      title="Transaction"
      @update:model-value="closeDetail"
    >
      <div
        v-if="detailTransaction"
        class="detail-sheet"
      >
        <div class="detail-sheet__desc">
          {{ detailTransaction.description }}
        </div>
        <div
          class="detail-sheet__amount mono"
          :class="{ 'amount-positive': detailTransaction.amount >= 0 }"
        >
          {{ formatCurrency(detailTransaction.amount) }}
        </div>
        <div class="muted">
          {{ formatDate(detailTransaction.date) }}
        </div>

        <v-btn-toggle
          v-if="canBeIncome(detailTransaction)"
          v-model="detailTransaction.income"
          mandatory
          color="primary"
          class="detail-sheet__toggle"
        >
          <v-btn :value="true">
            Income
          </v-btn>
          <v-btn :value="false">
            Refund
          </v-btn>
        </v-btn-toggle>

        <v-btn-toggle
          v-if="isExpense(detailTransaction)"
          v-model="detailTransaction.need"
          mandatory
          color="primary"
          class="detail-sheet__toggle"
        >
          <v-btn :value="false">
            Want
          </v-btn>
          <v-btn :value="true">
            Need
          </v-btn>
        </v-btn-toggle>

        <v-combobox
          v-model="detailTransaction.category"
          label="Category"
          :items="categoryItems(detailTransaction)"
          variant="outlined"
          density="comfortable"
        />
        <v-combobox
          v-model="detailTransaction.sub_category"
          label="Sub-category"
          :items="subCategoryItems(detailTransaction)"
          variant="outlined"
          density="comfortable"
        />
        <div class="detail-sheet__row muted">
          <span>Account</span>
          <span>{{ accountLabel(detailTransaction.account_id) }}</span>
        </div>

        <v-btn
          variant="tonal"
          block
          @click="ruleSource = detailTransaction"
        >
          New rule
        </v-btn>
        <v-btn
          color="primary"
          block
          @click="saveDetail"
        >
          Save changes
        </v-btn>
      </div>
    </Dialog>

    <TransactionReviewDialog
      v-if="!readOnly"
      v-model="showReviewDialog"
      :transactions="reviewList"
    />
  </div>
</template>

<style scoped>
.container {
  position: relative;
}

.tabs-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.tab-chip {
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid var(--hairline);
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.7);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.tab-chip:hover {
  border-color: rgba(var(--v-theme-outline), 0.9);
}
.tab-chip--active {
  background: rgb(var(--v-theme-on-surface));
  color: rgb(var(--v-theme-surface));
  border-color: transparent;
}
.tab-chip--review {
  border-color: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-warning));
}
.tab-chip--review.tab-chip--active {
  background: rgb(var(--v-theme-warning));
  color: #fff;
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.search-input {
  flex: 1;
  min-width: 220px;
}
.account-select,
.sort-select {
  max-width: 180px;
  min-width: 150px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}
.tx-grid {
  width: 100%;
  min-width: 760px;
}
.tx-grid__header {
  display: grid;
  align-items: center;
  gap: 0;
}
.tx-grid__header > div {
  text-align: left;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 0 10px 8px;
  border-bottom: 1px solid var(--hairline);
  white-space: nowrap;
}
.col-check {
  width: 36px;
}
.col-amount {
  text-align: right;
}
.col-actions {
  width: 40px;
}

.day-row {
  background: var(--row-tint);
  font-size: 11.5px;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 7px 10px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--hairline-soft);
}
.day-label {
  font-weight: 600;
}

.tx-row {
  display: grid;
  align-items: center;
  border-bottom: 1px solid var(--hairline-soft);
}
.tx-row > div {
  padding: 8px 10px;
}
.tx-row:hover {
  background: var(--row-open);
}
.tx-row--review {
  background: rgba(var(--v-theme-warning), 0.08);
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-warning));
}
.tx-row--selected {
  background: rgba(var(--v-theme-primary), 0.06);
}

.tx-description {
  font-size: 14px;
  font-weight: 600;
}
.review-label {
  color: rgb(var(--v-theme-warning));
  font-weight: 600;
}
.category-combo,
.sub-category-combo {
  font-size: 0.85rem;
}
.sub-category-combo {
  margin-top: -8px;
}
.tx-category {
  font-weight: 600;
}
.tx-subcategory {
  font-size: 0.8rem;
}

.account-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-size: 12.5px;
  white-space: nowrap;
}

.amount {
  font-weight: 700;
}
.amount-positive {
  color: rgb(var(--v-theme-success));
}
.amount-transfer {
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-weight: 500;
}

.empty-state {
  padding: 24px;
  text-align: center;
}

.mobile-list {
  display: flex;
  flex-direction: column;
}
.day-row--mobile {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  font-size: 11.5px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--v-theme-on-surface), 0.5);
  background: var(--row-tint);
  border-radius: var(--radius-xs);
  margin-top: 8px;
}
.tx-card {
  padding: 12px 8px;
  border-bottom: 1px solid var(--hairline-soft);
  cursor: pointer;
}
.tx-card--review {
  background: rgba(var(--v-theme-warning), 0.08);
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-warning));
}
.tx-card__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.tx-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 0.82rem;
  flex-wrap: wrap;
}

.bulk-bar {
  position: sticky;
  bottom: 12px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #111827;
  color: #fff;
  padding: 8px 16px;
  border-radius: 999px;
  box-shadow: var(--shadow);
  flex-wrap: wrap;
}
.bulk-bar__count {
  font-weight: 600;
  margin-right: 4px;
}
.bulk-bar :deep(.v-btn) {
  color: #fff;
}
.bulk-bar :deep(.v-btn--variant-tonal) {
  background: rgba(255, 255, 255, 0.14);
}

.detail-sheet {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail-sheet__desc {
  font-weight: 700;
  font-size: 1.1rem;
}
.detail-sheet__amount {
  font-size: 1.8rem;
  font-weight: 700;
}
.detail-sheet__toggle {
  width: 100%;
}
.detail-sheet__toggle :deep(.v-btn) {
  flex: 1;
}
.detail-sheet__row {
  display: flex;
  justify-content: space-between;
}

.bulk-category-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}

@media (max-width: 960px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-input,
  .account-select,
  .sort-select {
    max-width: none;
    min-width: 0;
    width: 100%;
  }
}
</style>
