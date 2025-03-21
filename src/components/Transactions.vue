<script setup>
import { useTransactionStore } from '@/stores/transaction';
import { onMounted } from 'vue';

const transactionStore = useTransactionStore();

onMounted(() => {
  transactionStore.fetchTransactions();
});
</script>

<template>
  <div>
    <h2>Transactions</h2>
    <ul>
      <li v-for="tx in transactionStore.transactions" :key="tx.id">
        {{ tx.description }} - ${{ tx.amount }}
      </li>
    </ul>
  </div>
</template>
