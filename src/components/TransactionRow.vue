<script>
export default {
  name: "TransactionRow",
  props: {
    transaction: {
      type: Object,
      required: true,
    },
  },
  computed: {
    formattedDate() {
      const date = new Date(this.transaction.date);
      return date.toLocaleDateString();
    },
  },
};
</script>

<template>
  <div class="transaction-row">
    <div>{{ formattedDate }}</div>
    <div>{{ transaction.description }}</div>
    <div>{{ transaction.category }}</div>
    <div>{{ transaction.sub_category }}</div>
    <div>{{ transaction.amount }}</div>
    <div>{{ transaction.account_id }}</div>
  </div>
</template>

<style scoped>
.transaction-row {
  display: grid;
  grid-template-columns: 1fr 3fr 2fr 2fr 1fr 1fr;
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
