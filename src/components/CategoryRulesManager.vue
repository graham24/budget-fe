<script setup>
import { onMounted, ref } from "vue";
import { useCategoryRuleStore } from "../stores/categoryRule";
import CategoryRuleForm from "./CategoryRuleForm.vue";

const ruleStore = useCategoryRuleStore();
const showForm = ref(false);
const deletingId = ref(null);

onMounted(() => {
  ruleStore.fetchRules();
});

async function removeRule(rule) {
  deletingId.value = rule.id;
  try {
    await ruleStore.deleteRule(rule.id);
  } catch (error) {
    console.error("Error deleting rule:", error);
  } finally {
    deletingId.value = null;
  }
}
</script>

<template>
  <div class="rules-manager">
    <p class="text-caption muted mb-4">
      Rules categorize imported transactions whose description contains the
      match text. They run before (and instead of) AI categorization.
      The newest matching rule wins.
    </p>

    <div
      v-if="!showForm"
      class="d-flex justify-end mb-3"
    >
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        prepend-icon="mdi-plus"
        @click="showForm = true"
      >
        Add Rule
      </v-btn>
    </div>
    <div
      v-else
      class="form-panel mb-4"
    >
      <CategoryRuleForm
        @saved="showForm = false"
        @cancel="showForm = false"
      />
    </div>

    <v-table
      v-if="ruleStore.rules.length"
      density="compact"
    >
      <thead>
        <tr>
          <th>Match text</th>
          <th>Category</th>
          <th>Sub-category</th>
          <th>Need</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="rule in ruleStore.rules"
          :key="rule.id"
        >
          <td class="font-weight-medium">
            {{ rule.match_text }}
          </td>
          <td>{{ rule.category }}</td>
          <td>{{ rule.sub_category }}</td>
          <td>
            <v-icon
              :icon="rule.need ? 'mdi-check' : 'mdi-minus'"
              size="small"
              :color="rule.need ? 'success' : undefined"
            />
          </td>
          <td class="text-right">
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              :loading="deletingId === rule.id"
              @click="removeRule(rule)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>
    <p
      v-else-if="ruleStore.loaded && !showForm"
      class="text-center muted py-4"
    >
      No rules yet. Add one here, or use the tag button on any transaction row.
    </p>
  </div>
</template>

<style scoped>
.form-panel {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: var(--radius-xs);
  padding: 16px;
}
</style>
