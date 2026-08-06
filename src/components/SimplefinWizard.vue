<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useSimplefinStore } from "../stores/simplefin";
import { useAccountStore } from "../stores/account";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";

const props = defineProps({
  householdId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["done"]);

const simplefinStore = useSimplefinStore();
const accountStore = useAccountStore();
const authStore = useAuthStore();
const userStore = useUserStore();

const TYPES = ["Checking", "Savings", "Credit Card"];
// Must match the backend Bank literal (models/end_points/account.py)
const BANKS = ["SimpleFin", "Wells Fargo", "Chase", "US Bank", "Apple"];

const loading = ref(true);
const index = ref(0);
const busy = ref(false);
const error = ref(null);
const loadError = ref(null);

// Per-card working state
const mode = ref("existing"); // "existing" | "new"
const existingAccountId = ref(null);
const newDescription = ref("");
const newType = ref("");
const newBank = ref("SimpleFin");
const newUserId = ref(null);

const items = computed(() => simplefinStore.accounts);
const current = computed(() => items.value[index.value] ?? null);
const remaining = computed(() => items.value.length - index.value);

// Bank accounts already linked to a different SimpleFin account — excluded
// from the "link existing" options so the same account can't be double-linked.
// The current card's own linked account (if any) stays selectable.
const availableAccounts = computed(() => {
  const linkedElsewhere = new Set(
    items.value
      .filter((sf) => sf.id !== current.value?.id && sf.bank_account_id)
      .map((sf) => sf.bank_account_id)
  );
  return accountStore.accounts.accounts.filter(
    (account) => !linkedElsewhere.has(account.id)
  );
});

function ownerName(user) {
  const full = `${user.first_name} ${user.last_name}`.trim();
  return full || user.email;
}

function resetCardState() {
  error.value = null;
  if (current.value?.linked_account) {
    mode.value = "existing";
    existingAccountId.value = current.value.linked_account.id;
  } else {
    mode.value = "existing";
    existingAccountId.value = null;
  }
  newDescription.value = current.value?.name ?? "";
  newType.value = "";
  newBank.value = "SimpleFin";
  newUserId.value = authStore.user?.id ?? null;
}

watch(current, resetCardState);

onMounted(async () => {
  loading.value = true;
  loadError.value = null;
  try {
    await Promise.all([
      simplefinStore.fetchAccounts(props.householdId),
      accountStore.accounts.accounts.length ? Promise.resolve() : accountStore.fetchAccounts(),
      userStore.users.users.length ? Promise.resolve() : userStore.fetchUsers(),
    ]);
    resetCardState();
    if (!items.value.length) emit("done");
  } catch (err) {
    console.error("Error loading SimpleFin wizard data:", err);
    loadError.value = "Failed to load SimpleFin accounts";
  } finally {
    loading.value = false;
  }
});

function advance() {
  if (index.value < items.value.length - 1) {
    index.value += 1;
  } else {
    emit("done");
  }
}

function skip() {
  if (busy.value) return;
  advance();
}

async function save() {
  if (!current.value || busy.value) return;
  if (mode.value === "existing" && !existingAccountId.value) {
    error.value = "Choose an account to link";
    return;
  }
  if (mode.value === "new" && (!newDescription.value.trim() || !newType.value.trim() || !newBank.value || !newUserId.value)) {
    error.value = "Description, type, bank, and owner are required";
    return;
  }
  busy.value = true;
  error.value = null;
  try {
    const payload =
      mode.value === "existing"
        ? { bank_account_id: existingAccountId.value }
        : {
            new_account: {
              description: newDescription.value.trim(),
              type: newType.value.trim(),
              bank: newBank.value,
              user_id: newUserId.value,
            },
          };
    await simplefinStore.linkAccount(current.value.id, props.householdId, payload);
    advance();
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to save this link";
  } finally {
    busy.value = false;
  }
}

function formatBalance(account) {
  if (account.balance == null) return "";
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: account.currency || "USD",
  }).format(account.balance);
  return amount;
}
</script>

<template>
  <div class="simplefin-wizard">
    <div v-if="loading" class="d-flex justify-center py-6">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <v-alert v-else-if="loadError" type="error" density="compact">
      {{ loadError }}
    </v-alert>
    <div v-else-if="current" class="wizard-body">
      <div class="stack-header">
        <div>
          <div class="text-subtitle-1 font-weight-bold">Connect SimpleFin accounts</div>
          <div class="muted text-caption">
            Link each account to one you already track, or create a new one.
          </div>
        </div>
        <div class="counter muted">{{ index + 1 }} / {{ items.length }}</div>
      </div>

      <div class="wizard-card">
        <div class="card-top">
          <div class="card-desc">
            <span class="font-weight-bold">{{ current.name }}</span>
            <span class="muted text-caption">{{ current.org_name }}</span>
          </div>
          <div class="card-balance">{{ formatBalance(current) }}</div>
        </div>

        <v-btn-toggle v-model="mode" mandatory density="compact" class="mt-3 mb-3">
          <v-btn value="existing" size="small">Link existing</v-btn>
          <v-btn value="new" size="small">Create new</v-btn>
        </v-btn-toggle>

        <div v-if="mode === 'existing'">
          <v-select
            v-model="existingAccountId"
            :items="availableAccounts"
            item-title="description"
            item-value="id"
            label="Existing account"
            density="compact"
            variant="outlined"
            hide-details
          />
        </div>
        <div v-else class="d-flex flex-column ga-3">
          <v-text-field
            v-model="newDescription"
            label="Description"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-combobox
            v-model="newType"
            :items="TYPES"
            label="Type"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-select
            v-model="newBank"
            :items="BANKS"
            label="Bank"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-select
            v-model="newUserId"
            :items="userStore.users.users"
            :item-title="ownerName"
            item-value="id"
            label="Owner"
            density="compact"
            variant="outlined"
            hide-details
          />
        </div>

        <v-alert v-if="error" type="error" density="compact" class="mt-3">
          {{ error }}
        </v-alert>

        <div class="card-actions">
          <v-btn variant="text" :disabled="busy" @click="skip">
            {{ remaining > 1 ? "Skip" : "Skip & Finish" }}
          </v-btn>
          <v-btn color="primary" variant="flat" :loading="busy" @click="save">
            {{ remaining > 1 ? "Save & Next" : "Save & Finish" }}
          </v-btn>
        </div>
      </div>
    </div>
    <p v-else class="text-center muted py-4">No SimpleFin accounts found.</p>
  </div>
</template>

<style scoped>
.stack-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}
.counter {
  font-weight: 700;
  white-space: nowrap;
}
.wizard-card {
  border: 1px solid rgba(var(--v-theme-outline), 0.4);
  border-radius: 12px;
  padding: 14px 16px;
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
.card-balance {
  font-weight: 800;
  font-size: 1.1rem;
  white-space: nowrap;
}
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
