<script setup>
import { ref, shallowRef, computed } from "vue";
import { useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";
import SurfaceCard from "./common/SurfaceCard.vue";
import SectionHeader from "./common/SectionHeader.vue";
import TransactionReviewDialog from "./TransactionReviewDialog.vue";
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
});

const transactionStore = useTransactionStore();
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
  // { title: "Actions", key: "actions", align: "end", sortable: false },
];

function saveTransaction(transaction) {
  console.log(transaction);
  transactionStore.saveTransaction(transaction);
  // setTimeout(() => {
  //   console.log("Transaction saved after delay");
  // }, 5000);
  if (transaction.category === "Transfer") {
    transaction.type = "Transfer";
  } else if (transaction.amount >= 0) {
    transaction.type = "Income";
  } else if (transaction.amount < 0) {
    transaction.type = "Expenses";
  }
}

function getAccount(account_id) {
  const accountsStore = useAccountStore();
  const account = accountsStore.accounts?.accounts?.find(
    (acc) => acc.id === account_id
  );
  return account ? account : "Unknown Account";
}

function getUser(userId) {
  return userStore.users.users.find((user) => user.id === userId);
}
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

const filteredItems = computed(() => {
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

  // Filter to the active 3-month window
  transactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= windowStart.value && d < windowEnd.value;
  });

  if (!props.searchTerm) return transactions;

  const query = props.searchTerm.toLocaleLowerCase();
  const options = { year: "numeric", month: "long" };
  return transactions.filter((transaction) => {
    return (
      new Date(transaction.date).toLocaleDateString(undefined, options) +
      transaction.date +
      transaction.description +
      transaction.category +
      transaction.sub_category +
      (getAccount(transaction.account_id).description +
        ": " +
        getUser(getAccount(transaction.account_id).user_id).first_name) +
      " (" +
      transaction.account_id +
      ")" +
      transaction.need
    )
      .toLowerCase()
      .includes(query);
  });
});
</script>

<template>
  <div class="container">
    <div class="data-table">
      <SurfaceCard class="transactions-card" padding="10px 12px">
        <SectionHeader :label="props.type" :title="props.type" />
        <div class="table-wrapper">
          <v-data-table
            :items="filteredItems"
            :headers="headers"
            density="compact"
            class="elevated-table"
          >
            <template v-slot:item.value="{ item }">
              {{ formatCurrency(item.value) }}
            </template>
            <template v-slot:item.need="{ item }">
              <div v-if="item.type === 'Expenses'">
                <v-checkbox
                  v-model="item.need"
                  @change="saveTransaction(item)"
                  density="compact"
                  hide-details
                ></v-checkbox>
              </div>
            </template>
            <template v-slot:item.category="{ item }">
              <v-combobox
                v-model="item.category"
                @blur="saveTransaction(item)"
                density="compact"
                variant="plain"
                :items="
                  transactionStore.categories[item.type.toLowerCase()].map(
                    (category) => category.name
                  )
                "
              ></v-combobox>
            </template>
            <template v-slot:item.sub_category="{ item }">
              <v-combobox
                v-model="item.sub_category"
                @blur="saveTransaction(item)"
                density="compact"
                variant="plain"
                :items="
                  transactionStore.categories[item.type.toLowerCase()].find(
                    (cat) => cat.name === item.category
                  )?.sub_categories
                "
              ></v-combobox>
            </template>
            <template v-slot:item.account_name="{ item }">
              {{ getAccount(item.account_id).description }}:
              {{ getUser(getAccount(item.account_id).user_id).first_name }}
              ({{ item.account_id }})
            </template>
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            <template v-slot:item.amount="{ item }">
              {{ formatCurrency(item.amount) }}
            </template>
            <template v-slot:group.header="item">
              <td :colspan="headers.length">
                <v-btn icon @click="item.toggle">
                  <v-icon>{{ item.isOpen ? "mdi-minus" : "mdi-plus" }}</v-icon>
                </v-btn>
                {{ item.group }}
              </td>
            </template>
          </v-data-table>
        </div>
      </SurfaceCard>
    </div>
    <!-- <TransactionReviewDialog
      v-model="showReviewDialog"
      :transactions="transactionStore.transactions.all_transactions"
    /> -->
  </div>
</template>

<style scoped>
.search-input {
  min-width: 260px;
}
.elevated-table :deep(.v-data-table__tr:nth-child(even)) {
  background: rgba(var(--v-theme-primary), 0.02);
}
.elevated-table :deep(td) {
  border-color: rgba(var(--v-theme-outline), 0.25);
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
