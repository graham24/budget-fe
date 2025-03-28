<script setup>
import { useTransactionStore } from "../stores/transaction";
import { useAccountStore } from "../stores/account";
import TransactionRow from "./TransactionRow.vue";

const transactionStore = useTransactionStore();

defineOptions({
  methods: {
    getAccount(account_id) {
      const accountsStore = useAccountStore();
      const account = accountsStore.accounts?.accounts?.find(
        (acc) => acc.id === account_id
      );
      return account ? account : "Unknown Account";
    },
  },
});
</script>

<template>
  <div>
    <!-- <div v-if="transactionStore.transactions">
      <div v-for="(type, key, index) in transactionStore.transactions">
        <div :class="key">
          <details>
            <summary class="transaction-name">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</summary>
            <div class="transaction-row-header">
              <div>Date</div>
              <div>Description</div>
              <div>Category</div>
              <div>Sub-category</div>
              <div>Amount</div>
              <div>Account</div>
            </div>
            <div>
              <TransactionRow
                v-for="transaction in type"
                :key="transaction.id"
                :transaction="transaction"
                :account="getAccount(transaction.account_id)"
                :categories="transactionStore.categories[key]"
                :sub_categories="transactionStore.sub_categories[key]"
                :type="key"
              />
            </div>
          </details>
        </div>
      </div>
    </div>
    <div v-else>
      <div>Loading Transactions......</div>
    </div> -->
  </div>
</template>

<style scoped>
.transaction-row-header {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr 1fr 1fr 1fr;
  padding: 10px;
  margin: 5px;
}
.transaction-row-header div {
  flex: 1;
  text-align: left;
  font-weight: 700;
}
.transaction-name {
  text-align: left;
  font-size: 1.5em;
}
</style>
