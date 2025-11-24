<script setup>
import CategoryTable from "./common/CategoryTable.vue";
import { useTransactionStore } from "../stores/transaction";
import SurfaceCard from "./common/SurfaceCard.vue";
import SectionHeader from "./common/SectionHeader.vue";

const transactionStore = useTransactionStore();
</script>
<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12">
          <SurfaceCard class="category-card" padding="14px 14px 10px">
            <SectionHeader
              label="Income"
              title="Primary earnings"
            />
            <CategoryTable :type="'Income'" />
          </SurfaceCard>
        </v-col>
        <v-col cols="12">
          <SurfaceCard class="category-card" padding="14px 14px 10px">
            <SectionHeader
              label="Must-Haves"
              title="Rent, utilities, groceries"
            />
            <CategoryTable :type="'Expenses'" :need="true" />
          </SurfaceCard>
        </v-col>
        <v-col cols="12">
          <SurfaceCard class="category-card" padding="14px 14px 10px">
            <SectionHeader
              label="Nice-to-Haves"
              title="Dining out, travel, fun"
            />
            <CategoryTable :type="'Expenses'" :need="false" />
          </SurfaceCard>
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
