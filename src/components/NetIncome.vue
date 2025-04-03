<script setup>
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();

defineOptions({
  methods: {
    formatDate(date) {
      const options = { year: "numeric", month: "long" };
      return new Date(date).toLocaleDateString(undefined, options);
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    },
  },
});
</script>
<template>
  <div class="widget">
    <div>
      <div
        :class="['previous-months']"
        v-for="(value, key) in transactionStore.net_incomes"
        :key="key"
      >
        <div>
          <span :class="key === 0 ? 'widget-title' : ''">
            <span
              >{{
                formatDate(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ).setMonth(new Date().getMonth() - (key + 2))
                )
              }}
              <span v-if="key === 0">Net Income<br /></span>
              <span v-else>: </span>
            </span>
          </span>
          <span
            :class="[
              key === 0 ? 'net' : '',
              transactionStore.net_incomes[key]['income'] +
                transactionStore.net_incomes[key]['expenses'] >=
              0
                ? 'net-positive'
                : 'net-negative',
            ]"
          >
            {{
              formatCurrency(
                transactionStore.net_incomes[key]["income"] +
                  transactionStore.net_incomes[key]["expenses"]
              )
            }}
          </span>
          <div class="income-expenses" v-if="key === 0">
            <span class="income">{{
              formatCurrency(transactionStore.net_incomes[key]["income"])
            }}</span>
            <span class="expenses">{{
              formatCurrency(transactionStore.net_incomes[key]["expenses"])
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.net {
  font-size: 3em;
  font-weight: 700;
}
.income-expenses {
  display: flex;
  justify-content: center;
  column-gap: 10px;
  font-size: 1.2em;
}
.income,
.net-positive {
  color: green;
}
.expenses,
.net-negative {
  color: red;
}
.previous-months {
  font-size: 0.9em;
}
</style>
