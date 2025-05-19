<script setup>
import { useTransactionStore } from "../../stores/transaction";

const transactionStore = useTransactionStore();
const props = defineProps({
  type: {
    type: String,
    required: true,
  },
});

function getSubCategoryTotalsComputed() {
  const type = props.type;
  console.log(type)
  const sub_categories = [];
  var transactions = null;
  transactions = transactionStore.transactions.all_transactions.filter(
    (transaction) =>
      transaction.type == type
  );

  const endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  endDate.setMonth(endDate.getMonth() - transactionStore.monthsAgo);
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 1);

  const previousEndDate = startDate;
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setMonth(previousStartDate.getMonth() - 1);

  transactions.forEach((transaction) => {
    const transactionDate = new Date(
      new Date(transaction.date).setMinutes(
        new Date(transaction.date).getMinutes() +
          new Date(transaction.date).getTimezoneOffset()
      )
    );
    if (transactionDate < endDate && transactionDate >= startDate) {
      const existingCategory = sub_categories.find(
        (item) => item.category === transaction.category
      );
      if (existingCategory) {
        const existingSubCategory = sub_categories.find(
          (item) => item.sub_category === transaction.sub_category
        );
        if (existingSubCategory) {
          existingSubCategory.value += transaction.amount;
        } else {
          sub_categories.push({
            category: transaction.category,
            sub_category: transaction.sub_category,
            value: transaction.amount,
            previous_value: 0,
          });
        }
      } else {
        sub_categories.push({
          category: transaction.category,
          sub_category: transaction.sub_category,
          value: transaction.amount,
          previous_value: 0,
        });
      }
    }

    if (
      transactionDate < previousEndDate &&
      transactionDate >= previousStartDate
    ) {
      const existingCategory = sub_categories.find(
        (item) => item.category === transaction.category
      );
      if (existingCategory) {
        const existingSubCategory = sub_categories.find(
          (item) => item.sub_category === transaction.sub_category
        );
        if (existingSubCategory) {
          existingSubCategory.previous_value += transaction.amount;
        } else {
          sub_categories.push({
            category: transaction.category,
            sub_category: transaction.sub_category,
            value: 0,
            previous_value: transaction.amount,
          });
        }
      } else {
        sub_categories.push({
          category: transaction.category,
          sub_category: transaction.sub_category,
          value: 0,
          previous_value: transaction.amount,
        });
      }
    }

    if (type == "Income") {
      sub_categories.sort((a, b) => b.value - a.value);
    } else {
      sub_categories.sort((a, b) => a.value - b.value);
    }
  });
  return sub_categories;
}

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
      :items="getSubCategoryTotalsComputed()"
      :headers="[
        { title: 'Category', value: 'category' },
        { title: 'Sub Category', value: 'sub_category' },
        { title: 'Current Month', value: 'value' },
        { title: 'Previous Month', value: 'previous_value' },
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
                  (total, currentItem) =>
                    total + currentItem.raw.previous_value,
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
                      total + currentItem.raw.previous_value,
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
                          total + currentItem.raw.previous_value,
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
      <template v-slot:item.previous_value="{ item }">
        {{ formatCurrency(item.previous_value) }}
      </template>
      <template v-slot:item.change="{ item }">
        <span
          :class="[
            props.type == 'income' ? 'income' : 'expense',
            item.value - item.previous_value >= 0 ? 'positive' : 'negative',
          ]"
          >{{ formatCurrency(item.value - item.previous_value) }}</span
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
