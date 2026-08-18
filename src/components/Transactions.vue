<script setup>
import TransactionsTable from "./TransactionsTable.vue";

defineProps({
  readOnly: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <TransactionsTable :read-only="readOnly" />
</template>
