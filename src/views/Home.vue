<script setup>
import { defineComponent } from "vue";
import { onMounted } from "vue";
import Transactions from "../components/Transactions.vue";
import { useHouseholdStore } from "../stores/household";

const householdStore = useHouseholdStore()

onMounted(() => {
  householdStore.fetchHousehold()
})
defineOptions({
  components: {
    Transactions,
  },
});
</script>

<template>
  <div>
    <h1>{{ householdStore.household.household.name }} Transactions</h1>
    <Transactions />
  </div>
</template>
