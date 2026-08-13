<script setup>
import { computed, ref } from "vue";
import { useNetWorthStore } from "../stores/netWorth";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const netWorthStore = useNetWorthStore();

const newBalance = ref(null);
const newDate = ref(new Date().toISOString().slice(0, 10));
const saving = ref(false);
const error = ref(null);
const deletingId = ref(null);

// Entries are newest-first in the store; delta compares to the next-older entry
const rows = computed(() =>
  props.item.entries.map((entry, idx) => {
    const older = props.item.entries[idx + 1];
    return {
      ...entry,
      delta: older ? entry.balance - older.balance : null,
    };
  })
);

async function saveBalance() {
  const balance = Number(newBalance.value);
  if (newBalance.value === null || newBalance.value === "" || balance < 0) {
    error.value = "Enter a balance of 0 or more";
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await netWorthStore.addBalance(props.item.id, balance, newDate.value);
    newBalance.value = null;
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to save balance";
  } finally {
    saving.value = false;
  }
}

async function removeEntry(entry) {
  deletingId.value = entry.id;
  try {
    await netWorthStore.deleteBalance(props.item.id, entry.id);
  } catch (err) {
    console.error("Error deleting balance entry:", err);
  } finally {
    deletingId.value = null;
  }
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <div class="balance-history">
    <div class="entry-form mb-3">
      <v-text-field
        v-model="newBalance"
        label="New balance ($)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
        @keyup.enter="saveBalance"
      />
      <v-text-field
        v-model="newDate"
        label="As of date"
        type="date"
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
      <div class="d-flex justify-end">
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          :loading="saving"
          @click="saveBalance"
        >
          Save balance
        </v-btn>
      </div>
    </div>

    <div
      v-if="rows.length"
      class="entry-list"
    >
      <div
        v-for="row in rows"
        :key="row.id"
        class="entry-row"
      >
        <span class="entry-row__date muted">
          {{ formatShortDate(row.effective_date) }}
        </span>
        <span class="entry-row__balance">{{ formatCurrency(row.balance) }}</span>
        <span
          v-if="row.delta !== null"
          class="entry-row__delta"
          :class="row.delta >= 0 ? 'text-success' : 'text-error'"
        >
          {{ row.delta >= 0 ? "+" : "−" }}{{ formatCurrency(Math.abs(row.delta)) }}
        </span>
        <span
          v-else
          class="entry-row__delta muted"
        >first entry</span>
        <v-btn
          icon="mdi-delete-outline"
          variant="text"
          size="x-small"
          :loading="deletingId === row.id"
          @click="removeEntry(row)"
        />
      </div>
    </div>
    <p
      v-else
      class="muted text-caption text-center py-3"
    >
      No balance history yet.
    </p>
  </div>
</template>

<style scoped>
.entry-form {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: var(--radius-xs);
  padding: 12px;
}
.entry-list {
  display: grid;
}
.entry-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}
.entry-row:last-child {
  border-bottom: none;
}
.entry-row__date {
  flex: 1;
  font-size: 0.85rem;
}
.entry-row__balance {
  font-weight: 700;
}
.entry-row__delta {
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 70px;
  text-align: right;
}
</style>
