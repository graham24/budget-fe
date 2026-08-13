<script setup>
import { computed, reactive, ref, watch } from "vue";
import SurfaceCard from "./common/SurfaceCard.vue";
import { useTransactionStore } from "../stores/transaction";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  transactions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

const transactionStore = useTransactionStore();
const statusMap = reactive({});
const currentIndex = ref(0);
const busy = ref(false);

const sortedTransactions = computed(() =>
  [...(props.transactions ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
);

const currentTransaction = computed(
  () => sortedTransactions.value[currentIndex.value] ?? null
);

const categoryItems = computed(() => {
  if (!currentTransaction.value) return [];
  const type =
    (currentTransaction.value.type ??
      (currentTransaction.value.amount >= 0 ? "Income" : "Expenses"))
      .toLowerCase();
  return transactionStore.categories[type] ?? [];
});

const subCategoryItems = computed(() => {
  if (!currentTransaction.value) return [];
  const currentCategory = categoryItems.value.find(
    (cat) => cat.name === currentTransaction.value.category
  );
  return currentCategory?.sub_categories ?? [];
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      currentIndex.value = 0;
    }
  }
);

function close() {
  emit("update:modelValue", false);
}

function advance() {
  if (currentIndex.value < sortedTransactions.value.length - 1) {
    currentIndex.value += 1;
  } else {
    close();
  }
}

function normalizeType(tx) {
  if (tx.category === "Transfer") {
    tx.type = "Transfer";
  } else if (tx.amount >= 0) {
    tx.type = "Income";
  } else if (tx.amount < 0) {
    tx.type = "Expenses";
  }
}

async function persistCurrent() {
  if (!currentTransaction.value) return;
  normalizeType(currentTransaction.value);
  await transactionStore.saveTransaction(currentTransaction.value);
}

async function mark(status) {
  if (!currentTransaction.value || busy.value) return;
  busy.value = true;
  statusMap[currentTransaction.value.id] = status;
  await persistCurrent();
  busy.value = false;
  advance();
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="700"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <SurfaceCard padding="16px">
      <div class="header">
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            Review transactions
          </div>
          <div class="muted text-caption">
            Swipe-style: X to ignore, Check to mark reviewed. Newest first.
          </div>
        </div>
        <div class="muted text-caption">
          {{ currentIndex + 1 }} / {{ sortedTransactions.length || 0 }}
        </div>
        <v-btn
          icon
          variant="text"
          aria-label="Close review dialog"
          @click="close"
        >
          <v-icon icon="mdi-close" />
        </v-btn>
      </div>

      <div
        v-if="currentTransaction"
        class="card"
      >
        <div class="row">
          <div class="primary">
            <div class="text-subtitle-2">
              {{ currentTransaction.description }}
            </div>
            <div class="muted text-caption">
              {{ formatDate(currentTransaction.date) }}
            </div>
          </div>
          <div
            class="amount"
            :class="currentTransaction.amount >= 0 ? 'positive' : 'negative'"
          >
            {{ formatCurrency(currentTransaction.amount) }}
          </div>
        </div>

        <div class="edit-grid">
          <v-combobox
            v-model="currentTransaction.category"
            label="Category"
            :items="categoryItems.map((category) => category.name)"
            density="compact"
            variant="outlined"
            hide-details
            @blur="normalizeType(currentTransaction)"
          />
          <v-combobox
            v-model="currentTransaction.sub_category"
            label="Sub-category"
            :items="subCategoryItems"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-checkbox
            v-model="currentTransaction.need"
            label="Need?"
            density="compact"
            hide-details
          />
        </div>

        <div class="meta">
          <span class="pill muted">Type: {{ currentTransaction.type }}</span>
          <span class="pill muted">
            Need: {{ currentTransaction.need ? "Need" : "Want" }}
          </span>
          <span class="pill muted">Account: {{ currentTransaction.account_name ?? currentTransaction.account_id }}</span>
        </div>

        <div class="actions">
          <v-btn
            color="error"
            variant="tonal"
            icon="mdi-close"
            size="large"
            :disabled="busy"
            aria-label="Ignore transaction"
            @click="mark('ignored')"
          />
          <v-btn
            color="success"
            variant="flat"
            icon="mdi-check"
            size="large"
            :disabled="busy"
            aria-label="Mark transaction reviewed"
            @click="mark('reviewed')"
          />
        </div>
      </div>

      <div
        v-else
        class="muted text-caption"
      >
        No transactions to review.
      </div>
    </SurfaceCard>
  </v-dialog>
</template>

<style scoped>
.header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.card {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: rgba(var(--v-theme-surface), 0.9);
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.primary {
  display: grid;
  gap: 2px;
}
.amount {
  font-weight: 700;
}
.positive {
  color: rgb(var(--v-theme-success));
}
.negative {
  color: rgb(var(--v-theme-error));
}
.edit-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-outline), 0.15);
  font-size: 0.85rem;
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}
.actions {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
@media (max-width: 800px) {
  .edit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .row {
    flex-direction: column;
    align-items: flex-start;
  }
  .edit-grid {
    grid-template-columns: 1fr;
  }
  .actions {
    justify-content: space-evenly;
  }
}
</style>
