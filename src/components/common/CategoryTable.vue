<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useTransactionStore } from "../../stores/transaction";
import { useAccountStore } from "../../stores/account";
import { useUserStore } from "../../stores/user";

const transactionStore = useTransactionStore();
const accountStore = useAccountStore();
const userStore = useUserStore();

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  need: {
    type: Boolean,
    default: false,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

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

function shortMonth(date) {
  return date.toLocaleString(undefined, { month: "short" });
}

const monthLabels = computed(() => ({
  m1: shortMonth(month1.value),
  m2: shortMonth(month2.value),
  m3: shortMonth(month3.value),
  focusLong: month1.value.toLocaleString(undefined, { month: "long" }),
}));

const transactions = computed(() => {
  if (props.type?.toLowerCase() === "income") {
    return transactionStore.incomeTransactions;
  }
  return props.need
    ? transactionStore.expenseNeedTransactions
    : transactionStore.expenseWantTransactions;
});

// Sub-category rows: the leaves that carry the three monthly totals and the
// focus-month transactions behind them.
const subRows = computed(() => {
  const m1 = month1.value;
  const m2 = month2.value;
  const m3 = month3.value;
  const rowsByKey = new Map();

  transactions.value.forEach((transaction) => {
    const key = `${transaction.category}|${transaction.sub_category}`;
    let row = rowsByKey.get(key);
    if (!row) {
      row = {
        key,
        category: transaction.category,
        subCategory: transaction.sub_category,
        month1: 0,
        month2: 0,
        month3: 0,
        transactions: [],
      };
      rowsByKey.set(key, row);
    }

    // Every transaction in the 3-month window is listed at the third level,
    // tagged with the column it belongs under so its amount lands in its own
    // month rather than the focus month's.
    const txDate = new Date(transaction.date);
    let month = 0;
    if (sameMonth(txDate, m1)) {
      row.month1 += transaction.amount;
      month = 1;
    } else if (sameMonth(txDate, m2)) {
      row.month2 += transaction.amount;
      month = 2;
    } else if (sameMonth(txDate, m3)) {
      row.month3 += transaction.amount;
      month = 3;
    }
    if (month) row.transactions.push({ tx: transaction, month });
  });

  // Drop rows with no activity in any of the 3 displayed months, these come
  // from transactions that exist in the store but fall outside the window
  const active = [...rowsByKey.values()].filter(
    (row) =>
      Math.abs(row.month1) + Math.abs(row.month2) + Math.abs(row.month3) > 0.005
  );
  for (const row of active) {
    // sort on the parsed date, the API's date strings aren't
    // lexicographically ordered, so a string compare scrambles the months
    row.transactions.sort(
      (a, b) => new Date(b.tx.date) - new Date(a.tx.date)
    );
  }
  return active;
});

const PALETTE = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
  "var(--cat-7)",
];

const sortDirection = computed(() => (props.type === "income" ? 1 : -1));

const categories = computed(() => {
  const byName = new Map();
  for (const row of subRows.value) {
    let cat = byName.get(row.category);
    if (!cat) {
      cat = {
        name: row.category,
        month1: 0,
        month2: 0,
        month3: 0,
        subs: [],
      };
      byName.set(row.category, cat);
    }
    cat.month1 += row.month1;
    cat.month2 += row.month2;
    cat.month3 += row.month3;
    cat.subs.push(row);
  }

  const list = [...byName.values()];
  // income sorts biggest-positive first, expenses biggest-negative first
  list.sort((a, b) => (b.month1 - a.month1) * sortDirection.value);
  list.forEach((cat, index) => {
    cat.color = PALETTE[index % PALETTE.length];
    cat.subs.sort((a, b) => (b.month1 - a.month1) * sortDirection.value);
  });
  return list;
});

const totals = computed(() =>
  categories.value.reduce(
    (acc, cat) => ({
      month1: acc.month1 + cat.month1,
      month2: acc.month2 + cat.month2,
      month3: acc.month3 + cat.month3,
    }),
    { month1: 0, month2: 0, month3: 0 }
  )
);

function sharePct(value, of) {
  if (!of) return null;
  return Math.round((Math.abs(value) / Math.abs(of)) * 100);
}

// ---- accordion state: one category open, one sub-category open ----
const openCat = ref(null);
const openSub = ref(null);

function toggleCat(name) {
  openSub.value = null;
  openCat.value = openCat.value === name ? null : name;
}
function toggleSub(key) {
  openSub.value = openSub.value === key ? null : key;
}

// paging the month window can drop whatever was open
watch(
  () => transactionStore.monthsAgo,
  () => {
    openCat.value = null;
    openSub.value = null;
  }
);

// Flat render list: category rows, then the open category's sub-category
// rows, then the open sub-category's transactions.
const rows = computed(() => {
  const out = [];
  const grand = totals.value.month1;
  for (const cat of categories.value) {
    out.push({
      kind: "category",
      key: `c:${cat.name}`,
      id: cat.name,
      name: cat.name,
      meta: `${cat.subs.length} ${cat.subs.length === 1 ? "subcategory" : "subcategories"}`,
      color: cat.color,
      month1: cat.month1,
      month2: cat.month2,
      month3: cat.month3,
      share: sharePct(cat.month1, grand),
      open: openCat.value === cat.name,
      overspend: isOverspend(cat),
    });
    if (openCat.value !== cat.name) continue;

    for (const sub of cat.subs) {
      const count = sub.transactions.length;
      out.push({
        kind: "sub",
        key: `s:${sub.key}`,
        id: sub.key,
        name: sub.subCategory || "Uncategorized",
        meta: `${count} ${count === 1 ? "transaction" : "transactions"}`,
        month1: sub.month1,
        month2: sub.month2,
        month3: sub.month3,
        share: sharePct(sub.month1, cat.month1),
        open: openSub.value === sub.key,
        overspend: isOverspend(sub),
      });
      if (openSub.value !== sub.key) continue;

      if (!count) {
        out.push({
          kind: "empty",
          key: `e:${sub.key}`,
          name: "No transactions in this window",
        });
        continue;
      }
      for (const entry of sub.transactions) {
        out.push({
          kind: "tx",
          key: `t:${entry.tx.id}`,
          tx: entry.tx,
          name: entry.tx.description,
          // only the column for the transaction's own month carries a figure
          month1: entry.month === 1 ? entry.tx.amount : null,
          month2: entry.month === 2 ? entry.tx.amount : null,
          month3: entry.month === 3 ? entry.tx.amount : null,
          amount: entry.tx.amount,
        });
      }
    }
  }
  return out;
});

// Flag rows where the focus month is well above the prior two months'
// average (25%+ over and at least $25 more), so jumps stand out.
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
// draft commits ~1.5s after the field loses focus, moving between the
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
  } else if (transaction.income) {
    transaction.type = "Income";
  } else {
    transaction.type = "Expenses";
  }
}

function toggleNeed(transaction) {
  startEdit(transaction);
  drafts[transaction.id].need = !drafts[transaction.id].need;
  scheduleCommit(transaction);
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

function onRowClick(row) {
  if (row.kind === "category") toggleCat(row.id);
  else if (row.kind === "sub") toggleSub(row.id);
}
</script>

<template>
  <div class="drill">
    <div class="drill__head drill-row">
      <span />
      <span class="col-head">Category</span>
      <span class="col-head drill__num">{{ monthLabels.m3 }}</span>
      <span class="col-head drill__num">{{ monthLabels.m2 }}</span>
      <span class="col-head col-head--focus drill__num drill__focus-head">{{ monthLabels.m1 }}</span>
      <span class="col-head drill__num">Share</span>
    </div>

    <div
      v-for="row in rows"
      :key="row.key"
      class="drill-row"
      :class="[
        `drill-row--${row.kind}`,
        { 'drill-row--open': row.open, 'drill-row--clickable': row.kind !== 'tx' && row.kind !== 'empty' },
      ]"
      :role="row.kind === 'category' || row.kind === 'sub' ? 'button' : undefined"
      :tabindex="row.kind === 'category' || row.kind === 'sub' ? 0 : undefined"
      :aria-expanded="row.kind === 'category' || row.kind === 'sub' ? row.open : undefined"
      @click="onRowClick(row)"
      @keydown.enter.prevent="onRowClick(row)"
      @keydown.space.prevent="onRowClick(row)"
    >
      <span class="drill__lead">
        <v-icon
          v-if="row.kind === 'category' || row.kind === 'sub'"
          :icon="row.open ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          :size="row.kind === 'category' ? 20 : 18"
          class="drill__chev"
        />
        <span
          v-if="row.kind === 'category'"
          class="drill__dot"
          :style="{ background: row.color }"
        />
        <span
          v-else-if="row.kind === 'sub'"
          class="drill__dot drill__dot--sm"
        />
      </span>

      <span class="drill__name-cell">
        <span class="drill__name">{{ row.name }}</span>
        <span
          v-if="row.meta"
          class="drill__meta"
        ><span class="drill__sep"> · </span>{{ row.meta }}</span>
        <span
          v-else-if="row.kind === 'tx'"
          class="drill__meta"
        ><span class="drill__sep"> · </span>{{ formatDate(row.tx.date) }} · {{ accountLabel(row.tx.account_id) }}</span>

        <!-- the month columns now carry each transaction's own figure, so the
             editors sit under the name instead of in the empty cells -->
        <span
          v-if="row.kind === 'tx' && !readOnly"
          class="drill__edit"
          @click.stop
        >
          <v-combobox
            v-model="draftOf(row.tx).category"
            density="compact"
            variant="plain"
            hide-details
            :items="categoryOptions(row.tx)"
            @focus="startEdit(row.tx)"
            @blur="scheduleCommit(row.tx)"
          />
          <v-combobox
            v-model="draftOf(row.tx).sub_category"
            density="compact"
            variant="plain"
            hide-details
            :items="subCategoryOptions(row.tx)"
            @focus="startEdit(row.tx)"
            @blur="scheduleCommit(row.tx)"
          />
          <button
            v-if="type !== 'income'"
            type="button"
            class="need-toggle"
            :class="{ 'need-toggle--on': draftOf(row.tx).need }"
            @click.stop="toggleNeed(row.tx)"
          >{{ draftOf(row.tx).need ? "Need" : "Want" }}</button>
        </span>
      </span>

      <span
        class="drill__num drill__prev"
        :class="{ 'drill__num--tx': row.kind === 'tx' }"
      >{{ row.month3 === null || row.kind === 'empty' ? '' : formatCurrency(row.month3) }}</span>
      <span
        class="drill__num drill__prev"
        :class="{ 'drill__num--tx': row.kind === 'tx' }"
      >{{ row.month2 === null || row.kind === 'empty' ? '' : formatCurrency(row.month2) }}</span>

      <span
        class="drill__num drill__amount"
        :class="{ 'drill__amount--over': row.overspend }"
        :title="row.overspend ? overspendTitle(row) : undefined"
      >
        <template v-if="row.kind === 'tx'">
          <!-- wide: blank unless this transaction is in the focus month, since
               its figure sits in its own column. narrow: the columns are gone,
               so the amount always shows here. -->
          <span class="drill__wide-only">{{ row.month1 === null ? "" : formatCurrency(row.month1) }}</span>
          <span class="drill__narrow-only">{{ formatCurrency(row.amount) }}</span>
        </template>
        <template v-else-if="row.kind !== 'empty'">
          {{ formatCurrency(row.month1) }}
        </template>
      </span>

      <!-- Narrow layout only. Kept a sibling of the amount rather than a child
           of it: nested, its width drove the amount column's `auto` track and
           squeezed the name cell down to an ellipsis. -->
      <span
        v-if="row.kind !== 'tx' && row.kind !== 'empty'"
        class="drill__prevline"
      >{{ monthLabels.m3 }} {{ formatCurrency(row.month3) }} · {{ monthLabels.m2 }} {{ formatCurrency(row.month2) }}</span>

      <span
        class="drill__num drill__share"
      >{{ row.share === null || row.share === undefined ? "" : `${row.share}%` }}</span>
    </div>

    <div
      v-if="rows.length"
      class="drill-row drill-row--total"
    >
      <span />
      <span class="drill__name">Total</span>
      <span class="drill__num drill__prev">{{ formatCurrency(totals.month3) }}</span>
      <span class="drill__num drill__prev">{{ formatCurrency(totals.month2) }}</span>
      <span class="drill__num drill__amount">{{ formatCurrency(totals.month1) }}</span>
      <span
        class="drill__prevline"
      >{{ monthLabels.m3 }} {{ formatCurrency(totals.month3) }} · {{ monthLabels.m2 }} {{ formatCurrency(totals.month2) }}</span>
      <span class="drill__num drill__share">100%</span>
    </div>
    <p
      v-else
      class="drill__empty muted"
    >
      Nothing in this window yet.
    </p>
  </div>
</template>

<style scoped>
.drill {
  width: 100%;
}

/* One grid shape for every level, so nothing shifts as rows open:
   chevron · name · prior month · prior month · focus month · share */
.drill-row {
  display: grid;
  /* 104px at full width; the number columns give ground first in a narrow
     container (the Insights rail band) so the name never collapses */
  grid-template-columns:
    26px minmax(0, 1fr)
    repeat(3, minmax(72px, 104px))
    minmax(44px, 58px);
  align-items: center;
  gap: 10px;
  padding: 12px 14px 12px 6px;
  border-bottom: 1px solid var(--hairline-soft);
}

.drill__head {
  padding-top: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--hairline);
}

.drill-row--clickable {
  cursor: pointer;
}
.drill-row--clickable:hover {
  background: var(--row-open);
}
.drill-row--open {
  background: var(--row-open);
}

.drill__lead {
  display: flex;
  align-items: center;
  gap: 6px;
}
.drill__chev {
  color: rgb(var(--v-theme-primary));
}
.drill-row--sub .drill__chev {
  color: rgb(var(--v-theme-secondary));
}
/* the colored dot is the mobile layout's category cue */
.drill__dot {
  display: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
}
.drill__dot--sm {
  width: 4px;
  height: 4px;
  background: rgb(var(--v-theme-secondary));
}

.drill__name-cell {
  min-width: 0;
  padding-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* the editable transaction row is two lines: merchant, then its editors */
.drill-row--tx .drill__name-cell {
  white-space: normal;
  overflow: visible;
}
.drill-row--tx .drill__name,
.drill-row--tx .drill__meta {
  white-space: nowrap;
}
.drill__name {
  font-size: 14.5px;
  font-weight: 700;
}
.drill__meta {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.drill__num {
  text-align: right;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.drill__prev {
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
/* a transaction's own figure isn't a comparison column, don't dim it just
   because it landed under Jun or Jul */
.drill__num--tx {
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 1);
}
.drill__narrow-only {
  display: none;
}
.drill__amount {
  font-size: 14.5px;
  font-weight: 700;
}
.drill__amount--over {
  color: rgb(var(--v-theme-error));
}
.drill__share {
  font-family: var(--font-sans);
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
/* only shown once the table collapses to a single-column stack */
.drill__prevline {
  display: none;
}

/* Level 2, sub-categories, indented onto a canvas-tinted band */
.drill-row--sub {
  padding-left: 34px;
  background: var(--row-tint);
}
.drill-row--sub .drill__name {
  font-size: 13.5px;
  font-weight: 600;
}

/* Level 3, the transactions behind a sub-category's number */
.drill-row--tx,
.drill-row--empty {
  padding-left: 60px;
  background: rgb(var(--v-theme-surface));
}
.drill-row--tx .drill__name {
  font-size: 13.5px;
  font-weight: 500;
}
.drill-row--tx .drill__amount {
  font-size: 13.5px;
  font-weight: 500;
}
.drill-row--empty .drill__name {
  font-size: 12.5px;
  font-weight: 400;
  font-style: italic;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* Category/sub-category editors sit under the merchant name, the month
   columns are spoken for by each transaction's own figure. */
.drill__edit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  max-width: 420px;
}
.drill__edit :deep(.v-input) {
  flex: 1;
  min-width: 0;
}
.drill__edit :deep(.v-field__input) {
  font-size: 12.5px;
  padding-top: 0;
  padding-bottom: 0;
  min-height: 0;
}
.drill__edit :deep(.v-field__append-inner) {
  padding-top: 0;
}

.need-toggle {
  flex: none;
  font: 600 11.5px var(--font-sans);
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--hairline);
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.6);
  cursor: pointer;
}
.need-toggle--on {
  background: rgba(var(--v-theme-primary), 0.12);
  border-color: transparent;
  color: rgb(var(--v-theme-primary));
}

.drill-row--total {
  background: var(--row-tint-strong);
  border-bottom: none;
  padding-top: 14px;
  padding-bottom: 14px;
}
.drill-row--total .drill__name {
  font-size: 13.5px;
}
.drill-row--total .drill__amount {
  font-size: 14px;
}

.drill__caption,
.drill__empty {
  margin: 10px 4px 0;
  font-size: 11.5px;
  line-height: 1.5;
}

/* Phone: the three-month table becomes one stacked row per line, name and
   meta left, the focus month large on the right with the two prior months
   underneath. Never a horizontal scroll. */
@media (max-width: 700px) {
  /* Two rows: dot · name · amount, then the two prior months underneath,
     spanning. Placement is explicit so the prior-months line can never
     compete with the name for width. */
  .drill-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
    column-gap: 10px;
    row-gap: 2px;
    padding: 12px 12px 12px 8px;
  }
  .drill__head,
  .drill__prev,
  .drill__share {
    display: none;
  }
  .drill__lead {
    grid-column: 1;
    grid-row: 1;
  }
  .drill__name-cell {
    grid-column: 2;
    grid-row: 1;
  }
  .drill__amount {
    grid-column: 3;
    grid-row: 1;
  }
  .drill__wide-only {
    display: none;
  }
  .drill__narrow-only {
    display: inline;
  }
  .drill__prevline {
    grid-column: 2 / -1;
    grid-row: 2;
    display: block;
    text-align: right;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 10.5px;
    font-weight: 400;
    color: rgba(var(--v-theme-on-surface), 0.5);
  }
  .drill__dot {
    display: block;
  }
  .drill__name-cell {
    white-space: normal;
  }
  /* stacked, but each line still truncates rather than wrapping mid-phrase */
  .drill__name,
  .drill__meta {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .drill__meta {
    font-size: 11.5px;
  }
  /* the inline " · " separator only makes sense on one line */
  .drill__sep {
    display: none;
  }
  .drill-row--sub {
    padding-left: 30px;
  }
  .drill-row--tx,
  .drill-row--empty {
    padding-left: 44px;
  }
  .drill-row--total .drill__share {
    display: none;
  }

  /* Transaction rows: flatten the name cell so the editors can take their own
     line under name + meta at the row's full width, instead of being squeezed
     into the name column beside the amount. */
  .drill-row--tx .drill__name-cell {
    display: contents;
  }
  .drill-row--tx .drill__name {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
  }
  .drill-row--tx .drill__meta {
    grid-column: 2 / -1;
    grid-row: 2;
    min-width: 0;
  }
  .drill__edit {
    grid-column: 2 / -1;
    grid-row: 3;
    max-width: none;
    margin-top: 4px;
  }
  .need-toggle {
    padding: 6px 12px;
  }
}
</style>
