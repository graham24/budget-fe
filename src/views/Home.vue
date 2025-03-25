<script setup>
import { defineComponent } from "vue";
import { ref } from "vue";
import { onMounted } from "vue";
import Transactions from "../components/Transactions.vue";
import { useHouseholdStore } from "../stores/household";
import { useAccountStore } from "../stores/account";
import { useTransactionStore } from "../stores/transaction";

const householdStore = useHouseholdStore();
const accountsStore = useAccountStore();
const transactionsStore = useTransactionStore();
const loading = ref(true);

onMounted(async () => {
  await Promise.all([
    householdStore.fetchHousehold(),
    accountsStore.fetchAccounts(),
    transactionsStore.fetchSummary(),
  ]);
  loading.value = false;
});
defineOptions({
  components: {
    Transactions,
  },
});
</script>

<template>
  <div>
    <div v-if="!loading">
      <h1>{{ householdStore.household.household.name }} Transactions</h1>
      <div v v-for="period in transactionsStore.summary.net_incomes">
        <span>{{ period.date }}</span
        >: <span>${{ period.net }}</span> -
        <span>Income: ${{ period.income }}</span
        >, <span>Expenses: ${{ period.income }}</span>
      </div>
      <div v v-for="period in transactionsStore.summary.categories">
        <span>{{ period.date }}</span>
        <div v v-for="category in period.income">
          <span>{{ category.category }}</span
          >: <span>${{ category.amount }}</span>
        </div>
        <!-- <span>{{period.date}}</span>: <span>{{ period.expenses }}</span> -->
      </div>
      <Transactions />
    </div>
    <div v-else><h1>Loading....</h1></div>
  </div>
</template>
