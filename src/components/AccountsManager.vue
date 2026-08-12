<script setup>
import { computed, onMounted, ref } from "vue";
import { useAccountStore } from "../stores/account";
import { useHouseholdStore } from "../stores/household";
import { useSimplefinStore } from "../stores/simplefin";
import { useUserStore } from "../stores/user";
import AccountForm from "./AccountForm.vue";

const accountStore = useAccountStore();
const householdStore = useHouseholdStore();
const simplefinStore = useSimplefinStore();
const userStore = useUserStore();
const showForm = ref(false);
const editingAccount = ref(null);
const refreshSummary = ref(null);
const refreshError = ref(null);

const ownerNames = computed(() => {
  const names = {};
  for (const user of userStore.users.users) {
    names[user.id] =
      `${user.first_name} ${user.last_name}`.trim() || user.email;
  }
  return names;
});

// Maps internal Account id -> linked SimplefinAccount, so the table can
// show a "Refresh Transactions" action only for SimpleFin-synced accounts
const simplefinByAccountId = computed(() => {
  const map = {};
  for (const sfAccount of simplefinStore.accounts) {
    if (sfAccount.bank_account_id) map[sfAccount.bank_account_id] = sfAccount;
  }
  return map;
});

onMounted(() => {
  const householdId = householdStore.household?.household?.id;
  if (householdId && householdStore.household?.household?.simplefin_access_url_set) {
    simplefinStore.fetchAccounts(householdId);
  }
});

function addAccount() {
  editingAccount.value = null;
  showForm.value = true;
}

function editAccount(account) {
  editingAccount.value = account;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingAccount.value = null;
}

async function refreshAccount(account) {
  const sfAccount = simplefinByAccountId.value[account.id];
  const householdId = householdStore.household?.household?.id;
  if (!sfAccount || !householdId) return;
  refreshSummary.value = null;
  refreshError.value = null;
  try {
    const result = await simplefinStore.refreshAccountTransactions(sfAccount.id, householdId);
    refreshSummary.value = `${account.description}: imported ${result.imported} new transaction${result.imported === 1 ? "" : "s"} (${result.duplicates} duplicate${result.duplicates === 1 ? "" : "s"} skipped)`;
  } catch (err) {
    refreshError.value =
      err.response?.data?.message || `Failed to refresh ${account.description}`;
  }
}
</script>

<template>
  <div class="accounts-manager">
    <p class="text-caption muted mb-4">
      Accounts hold imported transactions. The bank determines which CSV
      format the importer expects.
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
        @click="addAccount"
      >
        Add Account
      </v-btn>
    </div>
    <div
      v-else
      class="form-panel mb-4"
    >
      <AccountForm
        :key="editingAccount?.id ?? 'new'"
        :account="editingAccount"
        @saved="closeForm"
        @cancel="closeForm"
      />
    </div>

    <v-table
      v-if="accountStore.accounts.accounts.length"
      density="compact"
    >
      <thead>
        <tr>
          <th>Description</th>
          <th>Type</th>
          <th>Bank</th>
          <th>Owner</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="account in accountStore.accounts.accounts"
          :key="account.id"
        >
          <td class="font-weight-medium">
            {{ account.description }}
          </td>
          <td>{{ account.type }}</td>
          <td>{{ account.bank }}</td>
          <td>{{ ownerNames[account.user_id] ?? "—" }}</td>
          <td class="text-right">
            <v-btn
              v-if="simplefinByAccountId[account.id]"
              icon="mdi-refresh"
              variant="text"
              size="small"
              :loading="simplefinStore.refreshingAccountId === simplefinByAccountId[account.id].id"
              title="Refresh transactions"
              @click="refreshAccount(account)"
            />
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              size="small"
              @click="editAccount(account)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>
    <p
      v-else-if="!showForm"
      class="text-center muted py-4"
    >
      No accounts yet. Add one to start importing transactions.
    </p>
    <v-alert
      v-if="refreshSummary"
      type="success"
      density="compact"
      class="mt-3"
    >
      {{ refreshSummary }}
    </v-alert>
    <v-alert
      v-if="refreshError"
      type="error"
      density="compact"
      class="mt-3"
    >
      {{ refreshError }}
    </v-alert>
  </div>
</template>

<style scoped>
.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.form-panel {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: 8px;
  padding: 16px;
}
</style>
