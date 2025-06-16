<script setup>
import { computed } from "vue";

import { useTransactionStore } from "../../stores/transaction";
import { ca } from "vuetify/locale";

const transactionStore = useTransactionStore();
const props = defineProps({
  type: {
    type: String,
    required: true,
  },
});

function getTransactions() {
  const type = props.type;
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  endDate.setMonth(endDate.getMonth() - transactionStore.monthsAgo);
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 1);
  const previousStartDate = new Date(startDate);
  previousStartDate.setMonth(previousStartDate.getMonth() - 1);

  let transactions = [];
  let previousTransactions = [];
  let all_transactions = transactionStore.transactions.all_transactions;
  all_transactions.forEach((transaction) => {
    if (transaction.type == type) {
      const transactionDate = new Date(
        new Date(transaction.date).setMinutes(
          new Date(transaction.date).getMinutes() +
            new Date(transaction.date).getTimezoneOffset()
        )
      );
      if (startDate <= transactionDate && transactionDate < endDate) {
        transactions.push(transaction);
      }
      if (previousStartDate <= transactionDate && transactionDate < startDate) {
        previousTransactions.push(transaction);
      }
    }
  });
  return { transactions, previousTransactions };
}

function getCategoryTotals() {
  const { transactions, previousTransactions } = getTransactions();
  const allTransactions = [...transactions, ...previousTransactions];
  let totals = [];

  // Add Categories
  allTransactions.forEach((transaction) => {
    const category = transaction.category;
    const subCategory = transaction.sub_category;

    let categoryObj = totals.find(
      (cat) => cat.category === category && cat.subCategory === subCategory
    );

    if (!categoryObj) {
      categoryObj = {
        category: category,
        subCategory: subCategory,
        value: 0,
        previousValue: 0,
      };
      totals.push(categoryObj);
    }
  });

  transactions.forEach((transaction) => {
    const category = transaction.category;
    const subCategory = transaction.sub_category;
    const amount = transaction.amount;

    let categoryObj = totals.find(
      (cat) => cat.category === category && cat.subCategory === subCategory
    );

    categoryObj.value += amount;
  });

  previousTransactions.forEach((transaction) => {
    const category = transaction.category;
    const subCategory = transaction.sub_category;
    const amount = transaction.amount;

    let categoryObj = totals.find(
      (cat) => cat.category === category && cat.subCategory === subCategory
    );

    categoryObj.previousValue += amount;
  });
  return totals;
}

const categoryTotals = computed(() => getCategoryTotals());

function getChange(total) {
  if (props.type == "Income") {
    return total;
  } else {
    return -total;
  }
}
</script>
<template>
  <div>
    <v-data-table
      :items="categoryTotals"
      :headers="[
        { title: 'Category', value: 'category' },
        { title: 'Sub Category', value: 'subCategory' },
        { title: 'Current Month', value: 'value' },
        { title: 'Previous Month', value: 'previousValue' },
        { title: 'Change', value: 'change' },
      ]"
      :group-by="[{ key: 'category' }]"
      hide-default-footer
      :items-per-page="-1"
      density="compact"
    >
      <template
        v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }"
      >
        <tr>
          <td>
            <div class="d-flex align-center">
              <v-btn
                :icon="isGroupOpen(item) ? '$expand' : '$next'"
                color="medium-emphasis"
                density="comfortable"
                size="small"
                variant="outlined"
                @click="toggleGroup(item)"
              ></v-btn>
              <span class="ms-4"
                >{{ item.value }} <span>({{ item.items.length }})</span></span
              >
            </div>
          </td>
          <td>
            <!-- <span v-if="item.items.length === 1">{{ item.value }}</span> -->
          </td>
          <td>
            <!-- <span v-if="item.items.length === 1">{{
              item.items[0].raw.sub_category
            }}</span> -->
          </td>
          <td>
            {{
              formatCurrency(
                item.items.reduce(
                  (total, currentItem) => total + currentItem.raw.value,
                  0
                )
              )
            }}
          </td>
          <td>
            {{
              formatCurrency(
                item.items.reduce(
                  (total, currentItem) => total + currentItem.raw.previousValue,
                  0
                )
              )
            }}
          </td>
          <td>
            <span
              :class="[
                props.type == 'income' ? 'income' : 'expense',
                item.items.reduce(
                  (total, currentItem) => total + currentItem.raw.value,
                  0
                ) -
                  item.items.reduce(
                    (total, currentItem) =>
                      total + currentItem.raw.previousValue,
                    0
                  ) >=
                0
                  ? 'positive'
                  : 'negative',
              ]"
              >{{
                formatCurrency(
                  getChange(
                    item.items.reduce(
                      (total, currentItem) => total + currentItem.raw.value,
                      0
                    ) -
                      item.items.reduce(
                        (total, currentItem) =>
                          total + currentItem.raw.previousValue,
                        0
                      )
                  )
                )
              }}
            </span>
          </td>
        </tr>
      </template>
      <template v-slot:item.value="{ item }">
        {{ formatCurrency(item.value) }}
      </template>
      <template v-slot:item.previousValue="{ item }">
        {{ formatCurrency(item.previousValue) }}
      </template>
      <template v-slot:item.change="{ item }">
        <span
          :class="[
            props.type == 'income' ? 'income' : 'expense',
            item.value - item.previousValue >= 0 ? 'positive' : 'negative',
          ]"
          >{{ formatCurrency(item.value - item.previousValue) }}</span
        >
      </template>
    </v-data-table>
  </div>
</template>
<style scoped>
.income.negative,
.expense.negative {
  color: red;
}
.income.positive,
.expense.positive {
  color: green;
}
</style>
