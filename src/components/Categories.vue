<script setup>
import CategoryTable from "./common/CategoryTable.vue";
import { useTransactionStore } from "../stores/transaction";

const transactionStore = useTransactionStore();
</script>
<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="auto">
          <v-card>
            {{
              formatDate(
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ).setMonth(
                  new Date().getMonth() - (transactionStore.monthsAgo + 1)
                )
              )
            }}
            Income
            <CategoryTable :type="'income'" />
          </v-card>
        </v-col>
        <v-col>
          <v-card>
            {{
              formatDate(
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ).setMonth(
                  new Date().getMonth() - (transactionStore.monthsAgo + 1)
                )
              )
            }}
            Expenses
            <CategoryTable :type="'expenses'" />
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.categories {
  display: flex;
  column-gap: 10px;
  text-align: left;
}
.category-rows {
  display: grid;
  grid-template-columns: 3fr 2fr 3fr;
  column-gap: 10px;
  text-align: left;
}
</style>
