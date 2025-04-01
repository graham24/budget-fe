<script setup>
import { computed } from "vue";
import { useTransactionStore } from "../stores/transaction";
import { useUserStore } from "../stores/user";

const transactionStore = useTransactionStore();
const userStore = useUserStore();

defineOptions({
  name: "TransactionRow",
});
const props = defineProps({
  transaction: {
    type: Object,
    required: true,
  },
  account: {
    type: Object,
    required: true,
  },
  categories: {
    type: Object,
    required: true,
  },
  sub_categories: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});
const formattedDate = computed(() => {
  return new Date(props.transaction.date).toLocaleDateString();
});

function getUser(userId) {
  return userStore.users.users.find(user => user.id === userId);
}
</script>

<template>
  <div class="transaction-row">
    <div>{{ formattedDate }}</div>
    <div>{{ transaction.description }}</div>
    <div>
      <input
        :list="`${type}-category`"
        v-model="transaction.category"
        @blur="transactionStore.saveTransaction(transaction)"
      />
      <datalist :id="`${type}-category`">
        <option
          v-for="category in categories"
          :value="category.description"
        ></option>
      </datalist>
    </div>
    <div>
      <input
        :list="`${type}-sub-category`"
        v-model="transaction.sub_category"
        @blur="transactionStore.saveTransaction(transaction)"
      />
      <datalist :id="`${type}-sub-category`">
        <option
          v-for="sub_category in sub_categories"
          :value="sub_category.description"
        ></option>
      </datalist>
    </div>
    <div>{{ transaction.amount }}</div>
    <div>{{ account.description }}</div>
  </div>
</template>

<style scoped>
.transaction-row {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr 1fr 1fr 1fr;
  border: 1px solid lightslategray;
  background-color: gray;
  color: whitesmoke;
  column-gap: 10px;
  padding: 10px;
  margin: 5px;
  border-radius: 5px;
}
.transaction-row div {
  flex: 1;
  text-align: left;
}
</style>
