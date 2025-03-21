<script setup>
import { useTransactionStore } from '../stores/transaction';
import { onMounted } from 'vue';
import TransactionRow from './TransactionRow.vue'

const transactionStore = useTransactionStore();

onMounted(() => {
  transactionStore.fetchTransactions();
});
</script>

<template>
  <div>
    <div class="transaction-row-header">
      <div>Date</div>
      <div>Description</div>
      <div>Category</div>
      <div>Sub-category</div>
      <div>Amount</div>
      <div>Account</div>
    </div>
    <TransactionRow
      v-for="transaction in transactionStore.transactions.transactions"
      :key="transaction.id"
      :transaction="transaction"
    />
  </div>
</template>

<style scoped>
.transaction-row-header {
  display: grid;
  grid-template-columns: 1fr 3fr 2fr 2fr 1fr 1fr;
  padding: 10px;
  margin: 5px;
}
.transaction-row-header div {
  flex: 1;
  text-align: left;
  font-weight: 700;
}
</style>
