<script setup>
import { computed, nextTick, ref } from "vue";
import { forceImportTransaction } from "../api";
import { useTransactionStore } from "../stores/transaction";

const props = defineProps({
  // { kind: 'imported' | 'duplicate', transaction, accountLabel }
  items: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["done"]);

const transactionStore = useTransactionStore();
const index = ref(0);
const busy = ref(false);
const error = ref(null);

const current = computed(() => props.items[index.value] ?? null);
const remaining = computed(() => props.items.length - index.value);
const ghostLayers = computed(() => Math.min(remaining.value - 1, 2));

// Suggestions from the household's existing data
const categoryOptions = computed(() => {
  const names = new Set();
  for (const t of transactionStore.transactions) {
    if (t.category && t.category !== "Unknown") names.add(t.category);
  }
  return [...names].sort();
});

const subCategoryOptions = computed(() => {
  if (!current.value) return [];
  const names = new Set();
  for (const t of transactionStore.transactions) {
    if (
      t.category === current.value.transaction.category &&
      t.sub_category &&
      t.sub_category !== "Unknown"
    ) {
      names.add(t.sub_category);
    }
  }
  return [...names].sort();
});

function advance() {
  error.value = null;
  if (index.value < props.items.length - 1) {
    index.value += 1;
  } else {
    emit("done");
  }
}

async function saveCurrent() {
  if (!current.value || busy.value || current.value.kind !== "imported") return;
  // let the combobox commit its typed value before reading it
  await nextTick();
  busy.value = true;
  try {
    await transactionStore.saveTransaction(current.value.transaction);
    advance();
  } catch (err) {
    console.error("Error saving transaction:", err);
    error.value = "Failed to save — try again";
  } finally {
    busy.value = false;
  }
}

function skipCurrent() {
  if (busy.value) return;
  advance();
}

async function forceImport() {
  if (!current.value || busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    const created = await forceImportTransaction(current.value.transaction);
    // it's a real transaction now — flip the card to editable so it can be
    // categorized like any other import
    current.value.transaction = created;
    current.value.kind = "imported";
  } catch (err) {
    console.error("Force import failed:", err);
    error.value = err.response?.data?.message || "Force import failed";
  } finally {
    busy.value = false;
  }
}

function onEnter() {
  if (current.value?.kind === "imported") saveCurrent();
}
</script>

<template>
  <div v-if="current" class="review-stack" @keydown.enter.prevent="onEnter">
    <div class="stack-header">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Review imported transactions</div>
        <div class="muted text-caption">
          Edit and press Enter (or Save) to confirm each one.
          Duplicates are at the back of the stack.
        </div>
      </div>
      <div class="counter muted">{{ index + 1 }} / {{ items.length }}</div>
    </div>

    <div class="stack-area">
      <div
        v-for="n in ghostLayers"
        :key="n"
        class="ghost-card"
        :style="{
          transform: `translateY(${n * 8}px) scale(${1 - n * 0.025})`,
          zIndex: 2 - n,
        }"
      />
      <div
        class="review-card"
        :class="{ 'review-card--duplicate': current.kind === 'duplicate' }"
      >
        <div class="card-top">
          <div class="card-desc">
            <span class="font-weight-bold">{{ current.transaction.description }}</span>
            <span class="muted text-caption">
              {{ formatDate(current.transaction.date) }} · {{ current.accountLabel }}
            </span>
          </div>
          <div
            class="card-amount"
            :class="current.transaction.amount >= 0 ? 'positive' : 'negative'"
          >
            {{ formatCurrency(current.transaction.amount) }}
          </div>
        </div>

        <template v-if="current.kind === 'imported'">
          <div class="edit-grid">
            <v-combobox
              v-model="current.transaction.category"
              label="Category"
              :items="categoryOptions"
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-combobox
              v-model="current.transaction.sub_category"
              label="Sub-category"
              :items="subCategoryOptions"
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-checkbox
              v-model="current.transaction.need"
              label="Need?"
              density="compact"
              hide-details
            />
          </div>
          <v-alert v-if="error" type="error" density="compact" class="mt-2">
            {{ error }}
          </v-alert>
          <div class="card-actions">
            <v-btn variant="text" :disabled="busy" @click="skipCurrent">
              Skip
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              :loading="busy"
              @click="saveCurrent"
            >
              Save & Next
              <v-icon icon="mdi-keyboard-return" end size="small" />
            </v-btn>
          </div>
        </template>

        <template v-else>
          <v-chip color="warning" variant="tonal" size="small" class="mt-2">
            <v-icon icon="mdi-content-duplicate" start size="small" />
            Duplicate
          </v-chip>
          <p class="muted text-caption mt-2 mb-0">
            An identical transaction (same description, date, amount, and
            account) already exists, so this one was skipped. Force import it
            if it's a genuinely separate charge.
          </p>
          <v-alert v-if="error" type="error" density="compact" class="mt-2">
            {{ error }}
          </v-alert>
          <div class="card-actions">
            <v-btn variant="text" :disabled="busy" @click="skipCurrent">
              Skip
            </v-btn>
            <v-btn
              color="warning"
              variant="flat"
              :loading="busy"
              @click="forceImport"
            >
              Force Import
            </v-btn>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stack-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.counter {
  font-weight: 700;
  white-space: nowrap;
}
.stack-area {
  position: relative;
  /* room for the ghost layers peeking out below */
  padding-bottom: 18px;
}
.ghost-card {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  background: rgba(var(--v-theme-surface), 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.review-card {
  position: relative;
  z-index: 3;
  border: 1px solid rgba(var(--v-theme-outline), 0.4);
  border-radius: 12px;
  padding: 14px 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}
.review-card--duplicate {
  border-color: rgba(var(--v-theme-warning), 0.7);
  background: linear-gradient(
      rgba(var(--v-theme-warning), 0.06),
      rgba(var(--v-theme-warning), 0.06)
    ),
    rgb(var(--v-theme-surface));
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.card-desc {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.card-amount {
  font-weight: 800;
  font-size: 1.1rem;
  white-space: nowrap;
}
.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  margin-top: 12px;
  align-items: center;
}
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.positive {
  color: rgb(var(--v-theme-success));
}
.negative {
  color: rgb(var(--v-theme-error));
}
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

@media (max-width: 700px) {
  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
