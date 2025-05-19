<script setup>
import { defineComponent } from "vue";
import { ref } from "vue";
import { onMounted } from "vue";
import Transactions from "../components/Transactions.vue";
import ImportForm from "../components/ImportForm.vue";
import Dialog from "../components/common/Dialog.vue";
import NetIncome from "../components/NetIncome.vue";
import Categories from "../components/Categories.vue";
import { useHouseholdStore } from "../stores/household";
import { useAccountStore } from "../stores/account";
import { useTransactionStore } from "../stores/transaction";
import { useUserStore } from "../stores/user";

const householdStore = useHouseholdStore();
const accountsStore = useAccountStore();
const transactionsStore = useTransactionStore();
const userStore = useUserStore();
const loading = ref(true);
const showDialog = ref(false);

onMounted(async () => {
  try {
    await Promise.all([
      householdStore.fetchHousehold(),
      accountsStore.fetchAccounts(),
      transactionsStore.fetchTransactions(),
      userStore.fetchUsers(),
    ]);
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
});
defineOptions({
  components: {
    Transactions,
  },
});
</script>

<template>
  <div id="home">
    <v-container v-if="!loading">
      <v-row>
        <v-col md="auto">
          <v-card>
            <h1>{{ householdStore.household.household.name }} Transactions</h1>
          </v-card>
        </v-col>
        <v-col>
          <v-btn @click="transactionsStore.monthsAgo += 1"
            >Previous Month</v-btn
          >
          <v-btn @click="transactionsStore.monthsAgo -= 1">Next Month</v-btn>
        </v-col>
        <v-col>
          <v-card class="import-dialog">
            <v-btn @click="showDialog = true">Import Transactions</v-btn>
            <Dialog v-model="showDialog" title="Import Transactions">
              <ImportForm />
            </Dialog>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="auto">
          <v-card>
            <NetIncome />
          </v-card>
        </v-col>
        <v-col>
          <v-card>
            <Categories />
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-card>
            <Transactions />
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-else
      ><v-card><h1>Loading....</h1></v-card></v-container
    >
  </div>
</template>

<style>
#home {
  width: 100%;
}
.import-popup {
  float: right;
}
.widgets {
  display: flex;
  column-gap: 10px;
}
.widget {
  border: 2px solid white;
  padding: 5px;
  margin: 5px;
  border-radius: 5%;
}
.widget-title {
  font-size: 1.1em;
}
</style>
