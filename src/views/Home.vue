<script setup>
import { defineComponent } from "vue";
import { ref } from "vue";
import { onMounted } from "vue";
import Transactions from "../components/Transactions.vue";
import NetIncome from "../components/NetIncome.vue";
import Categories from "../components/Categories.vue";
import { useHouseholdStore } from "../stores/household";
import { useAccountStore } from "../stores/account";
import { useTransactionStore } from "../stores/transaction";

const householdStore = useHouseholdStore();
const accountsStore = useAccountStore();
const transactionsStore = useTransactionStore();
const loading = ref(true);

onMounted(async () => {
  try {
    await Promise.all([
      householdStore.fetchHousehold(),
      accountsStore.fetchAccounts(),
      transactionsStore.fetchSummary(),
      transactionsStore.fetchTransactions(),
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
    <div v-if="!loading">
      <h1>{{ householdStore.household.household.name }} Transactions</h1>
      <div class="widgets">
        <NetIncome />
        <!-- <Categories /> -->
      </div>
      <!-- <Transactions /> -->
    </div>
    <div v-else><h1>Loading....</h1></div>
  </div>
</template>

<style>
#home {
  width: 100%;
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
