<script setup>
import { computed, onMounted, ref } from "vue";
import { useDisplay } from "vuetify";
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
const { xs } = useDisplay();
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

// Label each progress line with the internal account's description, which
// is what the table shows, rather than the raw SimpleFin name.
function labelForSimplefinAccount(sfAccount) {
  const linked = accountStore.accounts?.accounts?.find(
    (a) => a.id === sfAccount.bank_account_id
  );
  return linked?.description ?? sfAccount.name ?? `Account ${sfAccount.id}`;
}

const linkedAccountCount = computed(
  () => simplefinStore.accounts.filter((a) => a.bank_account_id).length
);

async function refreshAllAccounts() {
  const householdId = householdStore.household?.household?.id;
  if (!householdId) return;
  refreshSummary.value = null;
  refreshError.value = null;
  await simplefinStore.refreshAllAccounts(householdId, labelForSimplefinAccount);
}

async function refreshAccount(account) {
  const sfAccount = simplefinByAccountId.value[account.id];
  const householdId = householdStore.household?.household?.id;
  if (!sfAccount || !householdId) return;
  refreshSummary.value = null;
  refreshError.value = null;
  simplefinStore.clearRefreshAllProgress();
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
      Import health lives here. The transactions page only surfaces problems.
    </p>

    <div
      v-if="!showForm"
      class="d-flex justify-end ga-2 mb-3"
    >
      <v-btn
        v-if="linkedAccountCount"
        variant="outlined"
        size="small"
        prepend-icon="mdi-refresh"
        :loading="simplefinStore.refreshAllRunning"
        @click="refreshAllAccounts"
      >
        Refresh all ({{ linkedAccountCount }})
      </v-btn>
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

    <!-- One line per account, filled in as the run walks through them -->
    <div
      v-if="simplefinStore.refreshAllProgress.length"
      class="refresh-run mb-4"
    >
      <div class="refresh-run__head">
        <span class="col-head">Refresh run</span>
        <v-btn
          v-if="!simplefinStore.refreshAllRunning"
          variant="text"
          size="x-small"
          @click="simplefinStore.clearRefreshAllProgress()"
        >
          Dismiss
        </v-btn>
      </div>
      <div
        v-for="line in simplefinStore.refreshAllProgress"
        :key="line.simplefinAccountId"
        class="refresh-run__row"
      >
        <v-progress-circular
          v-if="line.status === 'running'"
          indeterminate
          size="14"
          width="2"
          color="primary"
        />
        <v-icon
          v-else
          :icon="{
            pending: 'mdi-circle-small',
            done: 'mdi-check-circle-outline',
            error: 'mdi-alert-circle-outline',
          }[line.status]"
          :color="{ done: 'success', error: 'error' }[line.status]"
          size="16"
        />
        <span class="refresh-run__name">{{ line.label }}</span>
        <span
          v-if="line.status === 'done'"
          class="refresh-run__result mono"
        >
          +{{ line.imported }} new · {{ line.duplicates }} dupe{{ line.duplicates === 1 ? "" : "s" }}
        </span>
        <span
          v-else-if="line.status === 'error'"
          class="refresh-run__result text-error"
        >{{ line.error }}</span>
        <span
          v-else-if="line.status === 'running'"
          class="refresh-run__result muted"
        >Refreshing…</span>
        <span
          v-else
          class="refresh-run__result muted"
        >Waiting</span>
      </div>
    </div>
    <div
      v-if="showForm"
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

      <!-- Phones: one card per account instead of a sideways-scrolling table -->
      <div
        v-if="xs"
        class="account-cards"
      >
        <div
          v-for="row in healthRows"
          :key="row.account.id"
          class="account-card"
          :class="{ 'row--stale': row.stale }"
        >
          <div class="account-card__head">
            <div class="account-card__title">
              <div class="font-weight-medium account-card__name">
                {{ row.account.description }}
              </div>
              <div class="text-caption muted">
                {{ [row.account.type, row.account.bank, ownerNames[row.account.user_id]].filter(Boolean).join(" · ") }}
              </div>
            </div>
            <div class="account-card__actions">
              <v-btn
                v-if="row.simplefinAccount"
                icon="mdi-refresh"
                variant="text"
                size="small"
                :loading="simplefinStore.refreshingAccountId === row.simplefinAccount.id"
                title="Refresh transactions"
                @click="refreshAccount(row.account)"
              />
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                title="Edit account"
                @click="editAccount(row.account)"
              />
            </div>
          </div>
          <div class="account-card__foot">
            <div class="account-card__months">
              <div
                v-for="month in months"
                :key="month.key"
                class="account-card__month"
              >
                <span class="col-head">{{ month.label }}</span>
                <v-chip
                  :color="countColor(row.counts[month.key])"
                  :variant="row.counts[month.key] === 0 ? 'flat' : 'tonal'"
                  size="small"
                >
                  {{ row.counts[month.key] }}
                </v-chip>
              </div>
            </div>
            <div
              class="account-card__activity text-caption"
              :class="row.stale ? 'text-warning' : 'muted'"
            >
              {{ relativeActivity(row.lastActivity) }}
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="table-wrapper"
      >
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
.refresh-run {
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  background: var(--row-tint);
  padding: 10px 12px;
}
.refresh-run__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.refresh-run__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}
.refresh-run__row + .refresh-run__row {
  border-top: 1px solid var(--hairline-soft);
}
.refresh-run__name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.refresh-run__result {
  font-size: 12.5px;
  white-space: nowrap;
}

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
.account-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.account-card {
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 10px 6px 10px 12px;
}
.account-card__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.account-card__title {
  flex: 1;
  min-width: 0;
}
.account-card__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.account-card__actions {
  display: flex;
  flex-shrink: 0;
  margin-top: -4px;
}
.account-card__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding-right: 6px;
}
.account-card__months {
  display: flex;
  gap: 12px;
}
.account-card__month {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.account-card__activity {
  text-align: right;
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
