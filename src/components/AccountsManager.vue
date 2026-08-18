<script setup>
import { computed, onMounted, ref } from "vue";
import { useAccountStore } from "../stores/account";
import { useHouseholdStore } from "../stores/household";
import { useSimplefinStore } from "../stores/simplefin";
import { useTransactionStore } from "../stores/transaction";
import { useUserStore } from "../stores/user";
import AccountForm from "./AccountForm.vue";

const accountStore = useAccountStore();
const householdStore = useHouseholdStore();
const simplefinStore = useSimplefinStore();
const transactionStore = useTransactionStore();
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
// show a "Refresh" action only for SimpleFin-synced accounts
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

// ---- import health: last 3 calendar months ending with the current month ----
const months = computed(() => {
  const result = [];
  const today = new Date();
  for (let i = 2; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    result.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString(undefined, { month: "short" }),
    });
  }
  return result;
});
const currentMonthKey = computed(() => months.value[months.value.length - 1]?.key);
const currentMonthLabel = computed(() =>
  new Date().toLocaleDateString(undefined, { month: "long" })
);

function relativeActivity(date) {
  if (!date) return "No activity";
  const now = new Date();
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today - day) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

const healthRows = computed(() => {
  if (!accountStore.accounts?.accounts) return [];

  return accountStore.accounts.accounts.map((account) => {
    const counts = {};
    for (const month of months.value) counts[month.key] = 0;

    let lastActivity = null;
    for (const transaction of transactionStore.transactions) {
      if (transaction.account_id !== account.id) continue;
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (Object.prototype.hasOwnProperty.call(counts, monthKey)) counts[monthKey] += 1;
      if (!lastActivity || date > lastActivity) lastActivity = date;
    }

    return {
      account,
      counts,
      lastActivity,
      stale: counts[currentMonthKey.value] === 0,
      simplefinAccount: simplefinByAccountId.value[account.id] ?? null,
    };
  });
});

function countColor(count) {
  if (count === 0) return "error";
  if (count <= 5) return "warning";
  return "success";
}

const healthSummary = computed(() => {
  const rows = healthRows.value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    total: rows.length,
    activeToday: rows.filter(
      (row) => row.lastActivity && row.lastActivity >= today
    ).length,
    stale: rows.filter((row) => row.stale).length,
    currentMonthCount: rows.reduce(
      (sum, row) => sum + (row.counts[currentMonthKey.value] ?? 0),
      0
    ),
  };
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
      Import health lives here — the transactions page only surfaces problems.
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

    <template v-if="healthRows.length">
      <div class="kpi-strip mb-4">
        <div class="kpi-tile">
          <div class="kpi-label muted">
            Accounts
          </div>
          <div class="kpi-value">
            {{ healthSummary.total }}
          </div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label muted">
            Active today
          </div>
          <div class="kpi-value kpi-value--success">
            {{ healthSummary.activeToday }}
          </div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label muted">
            Stale
          </div>
          <div
            class="kpi-value"
            :class="healthSummary.stale ? 'kpi-value--warning' : ''"
          >
            {{ healthSummary.stale }}
          </div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label muted">
            Transactions in {{ currentMonthLabel }}
          </div>
          <div class="kpi-value">
            {{ healthSummary.currentMonthCount }}
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <v-table
          density="compact"
          class="health-table"
        >
          <thead>
            <tr>
              <th>Account</th>
              <th>Bank</th>
              <th>Owner</th>
              <th
                v-for="month in months"
                :key="month.key"
                class="text-center"
              >
                {{ month.label }}
              </th>
              <th>Last activity</th>
              <th class="col-actions" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in healthRows"
              :key="row.account.id"
              :class="{ 'row--stale': row.stale }"
            >
              <td>
                <div class="font-weight-medium">
                  {{ row.account.description }}
                </div>
                <div class="text-caption muted">
                  {{ row.account.type }}
                </div>
              </td>
              <td>{{ row.account.bank }}</td>
              <td>{{ ownerNames[row.account.user_id] ?? "—" }}</td>
              <td
                v-for="month in months"
                :key="month.key"
                class="text-center"
              >
                <v-chip
                  :color="countColor(row.counts[month.key])"
                  :variant="row.counts[month.key] === 0 ? 'flat' : 'tonal'"
                  size="small"
                >
                  {{ row.counts[month.key] }}
                </v-chip>
              </td>
              <td :class="row.stale ? 'text-warning' : 'muted'">
                {{ relativeActivity(row.lastActivity) }}
              </td>
              <td class="col-actions text-right">
                <v-btn
                  v-if="row.simplefinAccount"
                  icon="mdi-refresh"
                  variant="text"
                  size="small"
                  :loading="simplefinStore.refreshingAccountId === row.simplefinAccount.id"
                  title="Refresh transactions"
                  @click="refreshAccount(row.account)"
                />
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="editAccount(row.account)">
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
      <div class="legend mt-3 text-caption muted">
        0 = nothing imported · 1-5 = few · 6+ = normal
      </div>
    </template>
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
.form-panel {
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: var(--radius-xs);
  padding: 16px;
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.kpi-tile {
  border: 1px solid rgba(var(--v-theme-outline), 0.4);
  border-radius: var(--radius-xs);
  padding: 10px 14px;
}
.kpi-label {
  font-size: 0.78rem;
  margin-bottom: 2px;
}
.kpi-value {
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 700;
}
.kpi-value--success {
  color: rgb(var(--v-theme-success));
}
.kpi-value--warning {
  color: rgb(var(--v-theme-warning));
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}
.health-table {
  min-width: 640px;
}
.row--stale {
  background: rgba(var(--v-theme-warning), 0.08);
}
.col-actions {
  width: 90px;
  white-space: nowrap;
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}

@media (max-width: 600px) {
  .kpi-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
