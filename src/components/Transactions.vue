<script setup>
import { ref, computed, onMounted } from "vue";
import { useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
import TransactionRow from "./TransactionRow.vue";
import { useUserStore } from "../stores/user";

const groupedTransactions = ref({ expenses: [], income: [], transfers: [] });
const transactionStore = useTransactionStore();
const userStore = useUserStore();
const searchQuery = ref("");
const headers = [
  "Date",
  "Description",
  "Category",
  "Sub-Category",
  "Account",
  "Amount",
];

function getAccount(account_id) {
  const accountsStore = useAccountStore();
  const account = accountsStore.accounts?.accounts?.find(
    (acc) => acc.id === account_id
  );
  return account ? account : "Unknown Account";
}

function groupTransactions() {
  const groups = groupedTransactions.value;
  transactionStore.transactions.all_transactions.forEach((transaction) => {
    if (transaction.category === "Transfer") {
      groups["transfers"].push(transaction);
    } else if (transaction.amount >= 0) {
      groups["income"].push(transaction);
    } else if (transaction.amount < 0) {
      groups["expenses"].push(transaction);
    }
  });
}

onMounted(() => {
  groupTransactions();
});

const filteredTransactions = computed(() => {
  const searchTerm = searchQuery.value.toLocaleLowerCase();
  const result = {};
  for (const group in groupedTransactions.value) {
    result[group] = groupedTransactions.value[group].filter((transaction) => {
      return (
        transaction.description.toLowerCase().includes(searchTerm) ||
        transaction.category.toLowerCase().includes(searchTerm) ||
        transaction.sub_category.toLowerCase().includes(searchTerm) ||
        getAccount(transaction.account_id)
          .description.toLowerCase()
          .includes(searchTerm) ||
        getUser(getAccount(transaction.account_id).user_id)
          .first_name.toLowerCase()
          .includes(searchTerm)
      );
    });
  }
  return result;
});
function getUser(userId) {
  return userStore.users.users.find((user) => user.id === userId);
}
</script>

<template>
  <div class="container">
    <details
      v-for="(transactions, name, index) in filteredTransactions"
      :open="index === 0"
    >
      <summary class="table-title">
        {{ name.charAt(0).toUpperCase() + name.slice(1) }}
      </summary>
      <div class="search-bar">
        <input type="text" v-model="searchQuery" placeholder="Search..." />
      </div>
      <table class="transactions-table">
        <thead>
          <tr>
            <th v-for="header in headers" :key="header">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in transactions" :key="item.id">
            <td>{{ formatDate(item.date) }}</td>
            <td>{{ item.description }}</td>
            <td>
              <input
                :list="name + '-categories'"
                v-model="item.category"
                @blur="transactionStore.saveTransaction(item)"
              />
              <datalist :id="name + '-categories'">
                <option
                  v-for="category in transactionStore.categories[name]"
                  :value="category['name']"
                ></option>
              </datalist>
            </td>
            <td>
              <input
                :list="name + '-sub-categories'"
                v-model="item.sub_category"
                @blur="transactionStore.saveTransaction(item)"
              />
              <datalist :id="name + '-sub-categories'">
                <option
                  v-for="subCategory in transactionStore.categories[name].find(
                    (cat) => cat.name === item.category
                  )?.sub_categories || []"
                  :key="subCategory"
                  :value="subCategory"
                ></option>
              </datalist>
            </td>
            <td>
              {{ getUser(getAccount(item.account_id).user_id).first_name }}:
              {{ getAccount(item.account_id).description }}
            </td>
            <td>{{ formatCurrency(item.amount) }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>

<style scoped>
.table-title {
  text-align: left;
  font-size: 1.3em;
  margin: 10px;
}
.search-bar {
  text-align: left;
  margin: 10px;
}
details {
  min-width: 1280px;
}
table {
  text-align: left;
  margin: 10px;
  min-width: 1280px;
}
th,
td {
  text-align: left;
}
</style>
