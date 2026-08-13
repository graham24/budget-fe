<script setup>
import { ref, shallowRef, computed } from "vue";
import { useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";
import SurfaceCard from "./common/SurfaceCard.vue";
import SectionHeader from "./common/SectionHeader.vue";
import Dialog from "./common/Dialog.vue";
import CategoryRuleForm from "./CategoryRuleForm.vue";
// import DayJsAdapter from '@date-io/dayjs'

const props = defineProps({
  type: {
    type: String,
  },
  searchTerm: {
    type: String,
  },
  selectedDates: {
    type: Array,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const transactionStore = useTransactionStore();
const accountStore = useAccountStore();
const userStore = useUserStore();
const headers = [
  {
    key: "date",
    title: "Date",
  },
  { key: "description", title: "Description" },
  { key: "category", title: "Category" },
  { key: "sub_category", title: "Sub-Category" },
  { key: "account_name", title: "Account Name" },
  // { key: "account_id", title: "Account ID" },
  { key: "amount", title: "Amount" },
  { key: "need", title: "Need" },
  { key: "actions", title: "", sortable: false },
];

// Snapshot of the row being edited so blur events without an actual
// change don't fire a PUT per combobox.
let editSnapshot = null;

function rememberEdit(transaction) {
  editSnapshot = {
    id: transaction.id,
    category: transaction.category,
    sub_category: transaction.sub_category,
  };
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

function saveTransaction(transaction) {
  transactionStore.saveTransaction(transaction);
  if (transaction.category === "Transfer") {
    transaction.type = "Transfer";
  } else if (transaction.amount >= 0) {
    transaction.type = "Income";
  } else if (transaction.amount < 0) {
    transaction.type = "Expenses";
  }
}

// account_id -> "Account description: First name", computed once instead of
// per row per keystroke
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

// Create-rule dialog state
const ruleSource = ref(null);
const showRuleDialog = computed({
  get: () => ruleSource.value !== null,
  set: (open) => {
    if (!open) ruleSource.value = null;
  },
});
// function selectDates() {
//   if (selectedDates.value.length > 1) {
//     console.log(
//       "Selected dates:",
//       selectedDates.value[0],
//       selectedDates.value[selectedDates.value.length - 1]
//     );
//     setTimeout(() => {
//       showDatePicker.value = !showDatePicker.value;
//     }, 500);
//   }
// }
// Earliest month in the 3-month window: monthsAgo+3 months ago
// Latest month in the window: monthsAgo+1 months ago (focus month)
const windowStart = computed(() => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (transactionStore.monthsAgo + 3));
  return d;
});
const windowEnd = computed(() => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - transactionStore.monthsAgo);
  return d; // exclusive upper bound (start of the month after the focus month)
});

// Transactions of this table's type within the active 3-month window
const windowedItems = computed(() => {
  let transactions;
  if (props.type === "income") {
    transactions = transactionStore.incomeTransactions;
  } else if (props.type === "expenses-need") {
    transactions = transactionStore.expenseNeedTransactions;
  } else if (props.type === "expenses-want") {
    transactions = transactionStore.expenseWantTransactions;
  } else {
    transactions = transactionStore.transferTransactions;
  }

  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= windowStart.value && d < windowEnd.value;
  });
});

// Lowercased searchable text per transaction, built once per data change
// instead of per keystroke
const searchIndex = computed(() => {
  const index = new Map();
  const options = { year: "numeric", month: "long" };
  for (const transaction of windowedItems.value) {
    index.set(
      transaction.id,
      (
        new Date(transaction.date).toLocaleDateString(undefined, options) +
        transaction.date +
        transaction.description +
        transaction.category +
        transaction.sub_category +
        accountLabel(transaction.account_id) +
        " (" +
        transaction.account_id +
        ")" +
        transaction.need
      ).toLowerCase()
    );
  }
  return index;
});

const filteredItems = computed(() => {
  if (!props.searchTerm) return windowedItems.value;

  const query = props.searchTerm.toLocaleLowerCase();
  return windowedItems.value.filter((transaction) =>
    searchIndex.value.get(transaction.id)?.includes(query)
  );
});
</script>

<template>
  <div class="container">
    <div class="data-table">
      <SurfaceCard
        class="transactions-card"
        padding="10px 12px"
      >
        <SectionHeader
          :label="props.type"
          :title="props.type"
        />
        <div class="table-wrapper">
          <v-data-table
            :items="filteredItems"
            :headers="headers"
            density="compact"
            class="elevated-table"
          >
            <template #item.value="{ item }">
              {{ formatCurrency(item.value) }}
            </template>
            <template #item.need="{ item }">
              <div v-if="item.type === 'Expenses'">
                <v-checkbox
                  v-if="!readOnly"
                  v-model="item.need"
                  density="compact"
                  hide-details
                  @change="saveTransaction(item)"
                />
                <v-icon
                  v-else
                  :icon="item.need ? 'mdi-checkbox-marked-outline' : 'mdi-checkbox-blank-outline'"
                  size="18"
                />
              </div>
            </template>
            <template #item.category="{ item }">
              <v-combobox
                v-if="!readOnly"
                v-model="item.category"
                density="compact"
                variant="plain"
                :items="
                  transactionStore.categories[item.type.toLowerCase()].map(
                    (category) => category.name
                  )
                "
                @focus="rememberEdit(item)"
                @blur="saveIfChanged(item)"
              />
              <span v-else>{{ item.category }}</span>
            </template>
            <template #item.sub_category="{ item }">
              <v-combobox
                v-if="!readOnly"
                v-model="item.sub_category"
                density="compact"
                variant="plain"
                :items="
                  transactionStore.categories[item.type.toLowerCase()].find(
                    (cat) => cat.name === item.category
                  )?.sub_categories
                "
                @focus="rememberEdit(item)"
                @blur="saveIfChanged(item)"
              />
              <span v-else>{{ item.sub_category }}</span>
            </template>
            <template #item.account_name="{ item }">
              {{ accountLabel(item.account_id) }} ({{ item.account_id }})
            </template>
            <template #item.actions="{ item }">
              <v-btn
                v-if="!readOnly"
                icon="mdi-tag-plus-outline"
                variant="text"
                size="small"
                title="Create a category rule from this transaction"
                @click="ruleSource = item"
              />
            </template>
            <template #item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            <template #item.amount="{ item }">
              {{ formatCurrency(item.amount) }}
            </template>
            <template #group.header="item">
              <td :colspan="headers.length">
                <v-btn
                  icon
                  @click="item.toggle"
                >
                  <v-icon>{{ item.isOpen ? "mdi-minus" : "mdi-plus" }}</v-icon>
                </v-btn>
                {{ item.group }}
              </td>
            </template>
          </v-data-table>
        </div>
      </SurfaceCard>
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
  </div>
</template>

<style scoped>
.search-input {
  min-width: 260px;
}
.elevated-table :deep(.v-data-table__tr:nth-child(even)) {
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.elevated-table :deep(td) {
  border-color: rgba(var(--v-theme-outline), 0.5);
}
.elevated-table :deep(.v-data-table-footer) {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.25);
}
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}
.table-wrapper :deep(table) {
  min-width: 900px;
}
.table-wrapper :deep(.v-data-table__wrapper) {
  overflow: visible;
}
.container {
  position: relative;
}

@media (max-width: 960px) {
  .search-input {
    min-width: 100%;
  }
}
</style>
