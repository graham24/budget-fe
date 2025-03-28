<script setup>
import { ref, computed } from "vue";
import { onMounted } from "vue";
import { useTransactionStore } from "../stores/transaction";
const transactionStore = useTransactionStore();
const loading = ref(true);
let netIncomes = {
  firstMonth: { income: 0, expenses: 0 },
  secondMonth: { income: 0, expenses: 0 },
  thirdMonth: { income: 0, expenses: 0 },
};
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
    getMonthlyTotal(transactions, end_date) {
      const start_date = new Date(end_date);
      start_date.setMonth(start_date.getMonth() - 1);

      const income_transactions = transactions.filter(
        (transaction) =>
          new Date(
            new Date(transaction.date).setMinutes(
              new Date(transaction.date).getMinutes() +
                new Date(transaction.date).getTimezoneOffset()
            )
          ) < end_date &&
          new Date(
            new Date(transaction.date).setMinutes(
              new Date(transaction.date).getMinutes() +
                new Date(transaction.date).getTimezoneOffset()
            )
          ) >= start_date
      );
      return income_transactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
      );
    },
  },
});

onMounted(() => {
  const end_date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const start_date = new Date(end_date);
  start_date.setMonth(start_date.getMonth() - 1);

  const second_end_date = new Date(start_date);

  const second_start_date = new Date(second_end_date);
  second_start_date.setMonth(second_start_date.getMonth() - 1);

  const third_end_date = new Date(second_start_date);

  const third_start_date = new Date(third_end_date);
  third_start_date.setMonth(third_start_date.getMonth() - 1);

  transactionStore.transactions.all_transactions.forEach((transaction) => {
    try {
      const transaction_date = new Date(
        new Date(transaction.date).setMinutes(
          new Date(transaction.date).getMinutes() +
            new Date(transaction.date).getTimezoneOffset()
        )
      );
      if (transaction.category != "Transfer") {
        if (transaction_date < end_date && transaction_date >= start_date) {
          if (transaction.amount >= 0) {
            netIncomes["firstMonth"]["income"] += transaction.amount;
          }
          if (transaction.amount < 0) {
            netIncomes["firstMonth"]["expenses"] += transaction.amount;
          }
        }
        if (
          transaction_date < second_end_date &&
          transaction_date >= second_start_date
        ) {
          if (transaction.amount >= 0) {
            netIncomes["secondMonth"]["income"] += transaction.amount;
          }
          if (transaction.amount < 0) {
            netIncomes["secondMonth"]["expenses"] += transaction.amount;
          }
        }
        if (
          transaction_date < third_end_date &&
          transaction_date >= third_start_date
        ) {
          if (transaction.amount >= 0) {
            netIncomes["thirdMonth"]["income"] += transaction.amount;
          }
          if (transaction.amount < 0) {
            netIncomes["thirdMonth"]["expenses"] += transaction.amount;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
  loading.value = false;
});
</script>
<template>
  <div class="widget">
    <div class="widget-title">
      <span
        >{{
          formatDate(
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).setMonth(new Date().getMonth() - 1)
          )
        }}
        Net Income</span
      >
    </div>
    <div v-if="!loading">
      <div
        :class="[
          'net',
          netIncomes['firstMonth']['income'] +
            netIncomes['firstMonth']['expenses'] >=
          0
            ? 'net-positive'
            : 'net-negative',
        ]"
      >
        {{
          formatCurrency(
            netIncomes["firstMonth"]["income"] +
              netIncomes["firstMonth"]["expenses"]
          )
        }}
      </div>
      <div class="expenses-income">
        <span class="income">{{
          formatCurrency(netIncomes["firstMonth"]["income"])
        }}</span>
        <span class="expenses">{{
          formatCurrency(netIncomes["firstMonth"]["expenses"])
        }}</span>
      </div>
      <div
        :class="['previous-months']"
        v-for="(value, key) in Object.entries(netIncomes).filter(
          ([key]) => key !== 'firstMonth'
        )"
        :key="key"
      >
        <span>{{
          formatDate(
            new Date(
              new Date().getFullYear(),
              new Date().getMonth() - (key + 2),
              1
            )
          )
        }}</span
        >:
        {{ formatCurrency(value[1]["income"] + value[1]["expenses"]) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.net {
  font-size: 3em;
  font-weight: 700;
}
.expenses-income {
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
