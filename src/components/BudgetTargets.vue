<script setup>
import { computed, onMounted, ref } from "vue";
import { useBudgetTargetStore } from "../stores/budgetTarget";
import { useTransactionStore } from "../stores/transaction";

defineProps({
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const targetStore = useBudgetTargetStore();
const transactionStore = useTransactionStore();

const showForm = ref(false);
const formCategory = ref("");
const formLimit = ref(null);
const saving = ref(false);
const error = ref(null);
const deletingId = ref(null);

onMounted(() => {
  targetStore.fetchTargets();
});

// Suggest categories seen in the loaded expense transactions
const categoryOptions = computed(() => transactionStore.knownExpenseCategories);

// Focus-month spend (absolute) per category
const spentByCategory = computed(() => {
  const spent = new Map();
  for (const t of transactionStore.focusMonthTransactions) {
    if (t.amount < 0 && t.category !== "Transfer") {
      spent.set(t.category, (spent.get(t.category) ?? 0) - t.amount);
    }
  }
  return spent;
});

const rows = computed(() =>
  [...targetStore.targets]
    .map((target) => {
      const spent = spentByCategory.value.get(target.category) ?? 0;
      const pct = target.monthly_limit > 0 ? (spent / target.monthly_limit) * 100 : 0;
      return {
        ...target,
        spent,
        pct,
        color: pct < 80 ? "success" : pct <= 100 ? "warning" : "error",
      };
    })
    .sort((a, b) => b.pct - a.pct)
);

function editTarget(row) {
  formCategory.value = row.category;
  formLimit.value = row.monthly_limit;
  showForm.value = true;
}

async function saveTarget() {
  const limit = Number(formLimit.value);
  if (!formCategory.value?.trim() || !limit || limit <= 0) {
    error.value = "Pick a category and a positive monthly limit";
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await targetStore.saveTarget(formCategory.value.trim(), limit);
    showForm.value = false;
    formCategory.value = "";
    formLimit.value = null;
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to save target";
  } finally {
    saving.value = false;
  }
}

async function removeTarget(row) {
  deletingId.value = row.id;
  try {
    await targetStore.deleteTarget(row.id);
  } catch (err) {
    console.error("Error deleting target:", err);
  } finally {
    deletingId.value = null;
  }
}
</script>

<template>
  <div class="budget-targets">
    <div
      v-if="!readOnly && !showForm"
      class="d-flex justify-end mb-2"
    >
      <v-btn
        size="small"
        variant="text"
        color="primary"
        prepend-icon="mdi-plus"
        @click="showForm = true"
      >
        Add Target
      </v-btn>
    </div>
    <div
      v-else-if="showForm"
      class="target-form mb-3"
    >
      <v-combobox
        v-model="formCategory"
        label="Category"
        :items="categoryOptions"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
      />
      <v-text-field
        v-model="formLimit"
        label="Monthly limit ($)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
      />
      <v-alert
        v-if="error"
        type="error"
        density="compact"
        class="mb-2"
      >
        {{ error }}
      </v-alert>
      <div class="d-flex justify-end ga-2">
        <v-btn
          size="small"
          variant="text"
          :disabled="saving"
          @click="showForm = false"
        >
          Cancel
        </v-btn>
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          :loading="saving"
          @click="saveTarget"
        >
          Save
        </v-btn>
      </div>
    </div>

    <div
      v-if="rows.length"
      class="target-list"
    >
      <div
        v-for="row in rows"
        :key="row.id"
        class="target-row"
      >
        <div class="target-row__top">
          <span class="target-row__category">{{ row.category }}</span>
          <span
            class="target-row__numbers"
            :class="row.pct > 100 ? 'over' : ''"
          >
            {{ formatCurrency(row.spent) }} / {{ formatCurrency(row.monthly_limit) }}
          </span>
        </div>
        <div class="target-row__bar">
          <v-progress-linear
            :model-value="Math.min(row.pct, 100)"
            :color="row.color"
            height="8"
            rounded
          />
          <span class="target-row__pct">{{ row.pct.toFixed(0) }}%</span>
          <template v-if="!readOnly">
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              size="x-small"
              @click="editTarget(row)"
            />
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="x-small"
              :loading="deletingId === row.id"
              @click="removeTarget(row)"
            />
          </template>
        </div>
      </div>
    </div>
    <p
      v-else-if="targetStore.loaded && !showForm"
      class="muted text-caption text-center py-3"
    >
      No targets yet. Set a monthly limit per category to track plan vs. actual.
    </p>
  </div>
</template>

<style scoped>
.target-form {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: var(--radius-xs);
  padding: 12px;
}
.target-list {
  display: grid;
  gap: 12px;
}
.target-row__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.target-row__category {
  font-weight: 600;
}
.target-row__numbers {
  font-size: 0.85rem;
  white-space: nowrap;
}
.target-row__numbers.over {
  color: rgb(var(--v-theme-error));
  font-weight: 700;
}
.target-row__bar {
  display: flex;
  align-items: center;
  gap: 6px;
}
.target-row__bar .v-progress-linear {
  flex: 1;
}
.target-row__pct {
  font-size: 0.8rem;
  min-width: 36px;
  text-align: right;
}
</style>
