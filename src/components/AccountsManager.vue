<script setup>
import { computed, ref } from "vue";
import { useAccountStore } from "../stores/account";
import { useUserStore } from "../stores/user";
import AccountForm from "./AccountForm.vue";

const accountStore = useAccountStore();
const userStore = useUserStore();
const showForm = ref(false);
const editingAccount = ref(null);

const ownerNames = computed(() => {
  const names = {};
  for (const user of userStore.users.users) {
    names[user.id] =
      `${user.first_name} ${user.last_name}`.trim() || user.email;
  }
  return names;
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
</script>

<template>
  <div class="accounts-manager">
    <p class="text-caption muted mb-4">
      Accounts hold imported transactions. The bank determines which CSV
      format the importer expects.
    </p>

    <div v-if="!showForm" class="d-flex justify-end mb-3">
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
    <div v-else class="form-panel mb-4">
      <AccountForm
        :key="editingAccount?.id ?? 'new'"
        :account="editingAccount"
        @saved="closeForm"
        @cancel="closeForm"
      />
    </div>

    <v-table v-if="accountStore.accounts.accounts.length" density="compact">
      <thead>
        <tr>
          <th>Description</th>
          <th>Type</th>
          <th>Bank</th>
          <th>Owner</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="account in accountStore.accounts.accounts"
          :key="account.id"
        >
          <td class="font-weight-medium">{{ account.description }}</td>
          <td>{{ account.type }}</td>
          <td>{{ account.bank }}</td>
          <td>{{ ownerNames[account.user_id] ?? "—" }}</td>
          <td class="text-right">
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
    <p v-else-if="!showForm" class="text-center muted py-4">
      No accounts yet. Add one to start importing transactions.
    </p>
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
