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
  { key: "amount", title: "Amount" },
  // { title: "Actions", key: "actions", align: "end", sortable: false },
];
// const DEFAULT_RECORD = { category: "", sub_category: "" };
// const record = ref(DEFAULT_RECORD);
// const dialog = shallowRef(false);
// const isEditing = shallowRef(false);

// function edit(id) {
//   isEditing.value = true;

//   const found = transactionStore.transactions.all_transactions.find(
//     (transaction) => transaction.id === id
//   );

//   record.value = {
//     id: found.id,
//     date: found.date,
//     description: found.description,
//     category: found.category,
//     sub_category: found.sub_category,
//     account_id: found.account_id,
//     amount: found.amount,
//     type: found.type,
//   };

//   dialog.value = true;
// }

// function save() {
//   if (isEditing.value) {
//     const index = transactionStore.transactions.all_transactions.findIndex(
//       (transaction) => transaction.id === record.value.id
//     );
//     transactionStore.saveTransaction(record.value);
//     transactionStore.transactions.all_transactions[index] = record.value;
//   }
//   dialog.value = false;
// }

function saveTransaction(transaction) {
  const index = transactionStore.transactions.all_transactions.findIndex(
    (transaction) => transaction.id === transaction.id
  );
  transactionStore.saveTransaction(transaction);
  transactionStore.transactions.all_transactions[index] = transaction;
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
              v-on:update:model-value="saveTransaction(item)"
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
              v-on:update:model-value="saveTransaction(item)"
              density="compact"
              :items="
                transactionStore.categories[item.type.toLowerCase()].find(
                  (cat) => cat.name === item.category
                ).sub_categories
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
          <!-- <template v-slot:item.actions="{ item }">
            <div class="d-flex ga-2 justify-end">
              <v-icon
                color="medium-emphasis"
                icon="mdi-pencil"
                size="small"
                @click="edit(item.id)"
              ></v-icon>
            </div>
          </template> -->
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
      <!-- <v-dialog v-model="dialog" max-width="500">
        <v-card :subtitle="`Update Transaction`" :title="`Edit`">
          <template v-slot:text>
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="record.category"
                  label="Category"
                  :items="
                    transactionStore.categories[record.type.toLowerCase()].map(
                      (category) => category.name
                    )
                  "
                ></v-combobox>
              </v-col>
              <v-col cols="12">
                <v-combobox
                  v-model="record.sub_category"
                  label="Sub-Category"
                  :items="
                    transactionStore.categories[record.type.toLowerCase()].find(
                      (cat) => cat.name === record.category
                    ).sub_categories
                  "
                ></v-combobox>
              </v-col>
            </v-row>
          </template>

          <v-divider></v-divider>

          <v-card-actions class="bg-surface-light">
            <v-btn
              text="Cancel"
              variant="plain"
              @click="dialog = false"
            ></v-btn>

            <v-spacer></v-spacer>

            <v-btn text="Save" @click="save"></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog> -->
    </div>
    <!-- <details
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
    </details> -->
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
