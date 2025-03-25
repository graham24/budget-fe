<script setup>
import { defineComponent } from "vue";
import { ref } from "vue";
import { onMounted } from "vue";
import Transactions from "../components/Transactions.vue";
import { useHouseholdStore } from "../stores/household";
import { useAccountStore } from "../stores/account";

const householdStore = useHouseholdStore();
const accountsStore = useAccountStore();
const loading = ref(true);

onMounted(async () => {
  await Promise.all([
    householdStore.fetchHousehold(),
    accountsStore.fetchAccounts(),
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
      <Transactions />
    </div>
    <div v-else><h1>Loading....</h1></div>
  </div>
</template>
