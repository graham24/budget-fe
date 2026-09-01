<script setup>
import CategoryTable from "./common/CategoryTable.vue";
import SectionHeader from "./common/SectionHeader.vue";

// One card, three stacked tables — the design keeps the drill-down flat
// rather than nesting a card per group inside the section card.
// Income first: what came in, then what it had to cover, then what was
// left to choose. Reads top-to-bottom the way the month actually works.
const groups = [
  { label: "Income", title: "Primary earnings", type: "income", need: false },
  { label: "Must-Haves", title: "Rent, utilities, groceries", type: "expenses", need: true },
  { label: "Nice-to-Haves", title: "Dining out, travel, fun", type: "expenses", need: false },
];
</script>

<template>
  <div class="category-stack">
    <section
      v-for="group in groups"
      :key="group.label"
      class="category-group"
    >
      <SectionHeader
        :label="group.label"
        :title="group.title"
      />
      <CategoryTable
        :type="group.type"
        :need="group.need"
      />
    </section>
    <p class="category-caption muted">
      Click a category for its subcategories, then a subcategory for its
      transactions.
    </p>
  </div>
</template>

<style scoped>
.category-stack {
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.category-caption {
  margin: 0 4px;
  font-size: 11.5px;
  line-height: 1.5;
}
.category-group + .category-group {
  border-top: 1px solid var(--hairline);
  padding-top: 22px;
}
</style>
