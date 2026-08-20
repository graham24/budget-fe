<script setup>
import { ref, reactive, computed, watch } from "vue";
import { useDisplay } from "vuetify";
import { useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
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
  transactionStore.transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= windowStart.value && d < windowEnd.value;
  })
);

function matchesTab(t, tab) {
  if (tab === "all") return true;
  if (tab === "income") return t.category !== "Transfer" && t.amount >= 0;
  if (tab === "needs") return t.category !== "Transfer" && t.amount < 0 && t.need;
  if (tab === "wants") return t.category !== "Transfer" && t.amount < 0 && !t.need;
  if (tab === "transfers") return t.category === "Transfer";
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
function accountLabel(accountId) {
  const account = (accountStore.accounts?.accounts ?? []).find((a) => a.id === accountId);
  return account?.description ?? "Unknown";
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
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return sortOrder.value === "asc" ? -diff : diff;
  });
});

// ---- group rows by calendar day ----
function dayKey(dateStr) {
  return new Date(dateStr).toDateString();
}
function dayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
const groupedByDay = computed(() => {
  const groups = [];
  const byKey = new Map();
  for (const t of filteredItems.value) {
    const key = dayKey(t.date);
    let group = byKey.get(key);
    if (!group) {
      group = { key, label: dayLabel(t.date), total: 0, items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.total += t.amount;
    group.items.push(t);
  }
  return groups;
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
  } else if (transaction.amount >= 0) {
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
  return transaction.amount >= 0 ? "income" : "expenses";
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
function setNeed(transaction, need) {
  transaction.need = need;
  saveTransaction(transaction);
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
    if (t.category !== "Transfer" && t.amount < 0) {
      t.need = true;
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
      <table class="tx-table">
        <thead>
          <tr>
            <th
              v-if="!readOnly"
              class="col-check"
            >
              <v-checkbox
                :model-value="allSelected"
                density="compact"
                hide-details
                @update:model-value="toggleSelectAll"
              />
            </th>
            <th>Description</th>
            <th>Category</th>
            <th>Account</th>
            <th class="col-amount">
              Amount
            </th>
            <th>Type</th>
            <th
              v-if="!readOnly"
              class="col-actions"
            />
          </tr>
        </thead>
        <tbody
          v-for="group in groupedByDay"
          :key="group.key"
        >
          <tr class="day-row">
            <td :colspan="readOnly ? 5 : 7">
              <span class="day-label">{{ group.label }}</span>
              <span class="day-total mono">{{ formatCurrency(group.total) }}</span>
            </td>
          </tr>
          <tr
            v-for="item in group.items"
            :key="item.id"
            class="tx-row"
            :class="{ 'tx-row--review': isReview(item), 'tx-row--selected': !!selected[item.id] }"
          >
            <td
              v-if="!readOnly"
              class="col-check"
            >
              <v-checkbox
                v-model="selected[item.id]"
                density="compact"
                hide-details
              />
            </td>
            <td>
              <div class="tx-description">
                {{ item.description }}
              </div>
            </td>
            <td>
              <template v-if="!readOnly">
                <span
                  v-if="isReview(item)"
                  class="review-label"
                >Needs a category</span>
                <v-combobox
                  v-model="item.category"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="category-combo"
                  :items="categoryItems(item)"
                  @focus="rememberEdit(item)"
                  @blur="saveIfChanged(item)"
                />
                <v-combobox
                  v-model="item.sub_category"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="sub-category-combo"
                  :items="subCategoryItems(item)"
                  @focus="rememberEdit(item)"
                  @blur="saveIfChanged(item)"
                />
              </template>
              <template v-else>
                <div class="tx-category">
                  {{ item.category }}
                </div>
                <div class="tx-subcategory muted">
                  {{ item.sub_category }}
                </div>
              </template>
            </td>
            <td>
              <span class="account-pill">{{ accountLabel(item.account_id) }}</span>
            </td>
            <td class="col-amount">
              <span
                class="amount mono"
                :class="{
                  'amount-positive': item.amount >= 0,
                  'amount-transfer': item.category === 'Transfer',
                }"
              >{{ formatCurrency(item.amount) }}</span>
            </td>
            <td>
              <v-chip
                v-if="item.category === 'Transfer'"
                size="small"
                variant="outlined"
              >
                Transfer
              </v-chip>
              <v-chip
                v-else-if="item.amount >= 0"
                size="small"
                color="success"
                variant="tonal"
              >
                Income
              </v-chip>
              <v-menu v-else-if="!readOnly">
                <template #activator="{ props: menuProps }">
                  <v-chip
                    v-bind="menuProps"
                    size="small"
                    :color="item.need ? 'primary' : undefined"
                    variant="tonal"
                    append-icon="mdi-chevron-down"
                  >
                    {{ item.need ? "Need" : "Want" }}
                  </v-chip>
                </template>
                <v-list density="compact">
                  <v-list-item @click="setNeed(item, true)">
                    <v-list-item-title>Need</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="setNeed(item, false)">
                    <v-list-item-title>Want</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-chip
                v-else
                size="small"
                :color="item.need ? 'primary' : undefined"
                variant="tonal"
              >
                {{ item.need ? "Need" : "Want" }}
              </v-chip>
            </td>
            <td
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
                  <v-list-item @click="ruleSource = item">
                    <v-list-item-title>Create rule</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="!filteredItems.length"
        class="empty-state muted"
      >
        No transactions match these filters.
      </div>
    </div>

    <!-- Mobile card list -->
    <div
      v-else
      class="mobile-list"
    >
      <template
        v-for="group in groupedByDay"
        :key="group.key"
      >
        <div class="day-row day-row--mobile">
          <span class="day-label">{{ group.label }}</span>
          <span class="day-total mono">{{ formatCurrency(group.total) }}</span>
        </div>
        <div
          v-for="item in group.items"
          :key="item.id"
          class="tx-card"
          :class="{ 'tx-card--review': isReview(item) }"
          @click="openDetail(item)"
        >
          <div class="tx-card__row">
            <div class="tx-description">
              {{ item.description }}
            </div>
            <div
              class="amount mono"
              :class="{
                'amount-positive': item.amount >= 0,
                'amount-transfer': item.category === 'Transfer',
              }"
            >
              {{ formatCurrency(item.amount) }}
            </div>
          </div>
          <div class="tx-card__meta">
            <v-chip
              v-if="isReview(item)"
              size="x-small"
              color="warning"
              variant="tonal"
            >
              Set type
            </v-chip>
            <v-chip
              v-else-if="item.category === 'Transfer'"
              size="x-small"
              variant="outlined"
            >
              Transfer
            </v-chip>
            <v-chip
              v-else-if="item.amount >= 0"
              size="x-small"
              color="success"
              variant="tonal"
            >
              Income
            </v-chip>
            <v-chip
              v-else
              size="x-small"
              :color="item.need ? 'primary' : undefined"
              variant="tonal"
            >
              {{ item.need ? "Need" : "Want" }}
            </v-chip>
            <span class="muted">{{ item.category }} · {{ accountLabel(item.account_id) }}</span>
          </div>
        </div>
      </template>
      <div
        v-if="!filteredItems.length"
        class="empty-state muted"
      >
        No transactions match these filters.
      </div>
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
          v-if="detailTransaction.category !== 'Transfer' && detailTransaction.amount < 0"
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
  border: 1px solid rgba(var(--v-theme-outline), 0.5);
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
.tx-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}
.tx-table thead th {
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 8px 10px;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.4);
  white-space: nowrap;
}
.tx-table td {
  padding: 8px 10px;
  vertical-align: middle;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.25);
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

.day-row td {
  background: rgba(var(--v-theme-on-surface), 0.03);
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 6px 10px;
  border-bottom: none;
  display: flex;
  justify-content: space-between;
}
.day-label {
  font-weight: 600;
}

.tx-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.tx-row--review {
  background: rgba(var(--v-theme-warning), 0.08);
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-warning));
}
.tx-row--selected {
  background: rgba(var(--v-theme-primary), 0.06);
}

.tx-description {
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
  font-size: 0.78rem;
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
  padding: 8px 8px;
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.55);
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: var(--radius-xs);
  margin-top: 8px;
}
.tx-card {
  padding: 12px 8px;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
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
