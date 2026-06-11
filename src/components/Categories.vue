<script setup>
import CategoryTable from "./common/CategoryTable.vue";
import { useTransactionStore } from "../stores/transaction";
import SurfaceCard from "./common/SurfaceCard.vue";
import SectionHeader from "./common/SectionHeader.vue";

const transactionStore = useTransactionStore();
</script>
<template>
  <div class="category-stack">
    <SurfaceCard class="category-card" padding="14px 14px 10px">
      <SectionHeader
        label="Income"
        title="Primary earnings"
      />
      <CategoryTable :type="'income'" />
    </SurfaceCard>
    <SurfaceCard class="category-card" padding="14px 14px 10px">
      <SectionHeader
        label="Must-Haves"
        title="Rent, utilities, groceries"
      />
      <CategoryTable :type="'expenses'" :need="true" />
    </SurfaceCard>
    <SurfaceCard class="category-card" padding="14px 14px 10px">
      <SectionHeader
        label="Nice-to-Haves"
        title="Dining out, travel, fun"
      />
      <CategoryTable :type="'expenses'" :need="false" />
    </SurfaceCard>
  </div>
</template>

<style scoped>
.category-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
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
