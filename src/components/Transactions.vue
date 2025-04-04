<script setup>
import { ref, shallowRef } from "vue";
import { useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";

const search = ref("");
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
  { key: "account_id", title: "Account ID" },
  { key: "amount", title: "Amount" },
  // { title: "Actions", key: "actions", align: "end", sortable: false },
];

function saveTransaction(transaction) {
  const index = transactionStore.transactions.all_transactions.findIndex(
    (transaction) => transaction.id === transaction.id
  );
  transactionStore.saveTransaction(transaction);
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
</script>

<template>
  <div class="container">
    <div class="data-table">
      <v-card title="Transactions" flat>
        <template v-slot:text>
          <v-text-field
            v-model="search"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            hide-details
            single-line
          ></v-text-field>
        </template>
        <v-data-table
          :items="transactionStore.transactions.all_transactions"
          :search="search"
          :headers="headers"
          :group-by="[{ key: 'type' }]"
          show-group-by
        >
          <template v-slot:item.category="{ item }">
            <v-combobox
              v-model="item.category"
              @blur="saveTransaction(item)"
              density="compact"
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
      </v-card>
    </div>
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
