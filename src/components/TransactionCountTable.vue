<template>
  <div class="transaction-count-table">
    <v-table density="compact">
      <thead>
        <tr>
          <th class="text-left">Account</th>
          <th
            v-for="month in months"
            :key="month.key"
            class="text-center"
          >
            {{ month.label }}
          </th>
          <th class="text-center">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in accountRows"
          :key="row.accountId"
        >
          <td class="account-name">
            <div class="text-subtitle-2">{{ row.accountName }}</div>
            <div class="text-caption muted">{{ row.bankInfo }}</div>
          </td>
          <td
            v-for="month in months"
            :key="month.key"
            class="text-center count-cell"
          >
            <v-chip
              :color="getCountColor(row.counts[month.key])"
              :variant="row.counts[month.key] === 0 ? 'flat' : 'tonal'"
              size="small"
            >
              {{ row.counts[month.key] }}
            </v-chip>
          </td>
          <td class="text-center">
            <v-chip
              color="primary"
              variant="tonal"
              size="small"
            >
              {{ row.total }}
            </v-chip>
          </td>
        </tr>
        <tr class="total-row">
          <td class="font-weight-bold">Total</td>
          <td
            v-for="month in months"
            :key="month.key"
            class="text-center"
          >
            <v-chip
              color="primary"
              variant="flat"
              size="small"
            >
              {{ monthTotals[month.key] }}
            </v-chip>
          </td>
          <td class="text-center">
            <v-chip
              color="primary"
              variant="flat"
              size="small"
            >
              {{ grandTotal }}
            </v-chip>
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="legend mt-4">
      <div class="d-flex gap-3 flex-wrap">
        <div class="d-flex align-center gap-1">
          <v-chip color="error" variant="flat" size="x-small">0</v-chip>
          <span class="text-caption">No transactions</span>
        </div>
        <div class="d-flex align-center gap-1">
          <v-chip color="warning" variant="tonal" size="x-small">1-5</v-chip>
          <span class="text-caption">Few transactions</span>
        </div>
        <div class="d-flex align-center gap-1">
          <v-chip color="success" variant="tonal" size="x-small">6+</v-chip>
          <span class="text-caption">Normal activity</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAccountStore } from "../stores/account";
import { useTransactionStore } from "../stores/transaction";
import { useUserStore } from "../stores/user";

const accountStore = useAccountStore();
const transactionStore = useTransactionStore();
const userStore = useUserStore();

// Generate the 3 complete months ending at the focus month set by
// transactionStore.monthsAgo (0 = the 3 months before the current month)
const months = computed(() => {
  const result = [];
  const today = new Date();
  const monthsAgo = transactionStore.monthsAgo;

  for (let i = 3; i >= 1; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - (monthsAgo + i), 1);
    result.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      date: date,
    });
  }

  return result;
});

// Build account rows with transaction counts
const accountRows = computed(() => {
  if (!accountStore.accounts?.accounts || !transactionStore.transactions) {
    return [];
  }

  const rows = accountStore.accounts.accounts.map(account => {
    const user = userStore.users.users.find(u => u.id === account.user_id);
    const userName = user?.first_name || 'Unknown';
    const counts = {};
    let total = 0;

    // Initialize counts for each month
    months.value.forEach(month => {
      counts[month.key] = 0;
    });

    // Count transactions for this account by month
    transactionStore.transactions.forEach(transaction => {
      if (transaction.account_id === account.id) {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (counts.hasOwnProperty(monthKey)) {
          counts[monthKey]++;
          total++;
        }
      }
    });

    return {
      accountId: account.id,
      accountName: account.description,
      userName,
      bankName: account.bank,
      bankInfo: `${userName} - ${account.bank} ${account.type}`,
      counts,
      total,
    };
  });

  return rows.sort((a, b) =>
    a.userName.localeCompare(b.userName) || a.bankName.localeCompare(b.bankName)
  );
});

// Calculate totals for each month
const monthTotals = computed(() => {
  const totals = {};

  months.value.forEach(month => {
    totals[month.key] = accountRows.value.reduce((sum, row) => {
      return sum + row.counts[month.key];
    }, 0);
  });

  return totals;
});

// Calculate grand total
const grandTotal = computed(() => {
  return accountRows.value.reduce((sum, row) => sum + row.total, 0);
});

// Determine color based on count
function getCountColor(count) {
  if (count === 0) return 'error';
  if (count <= 5) return 'warning';
  return 'success';
}
</script>

<style scoped>
.transaction-count-table {
  width: 100%;
}

.account-name {
  min-width: 200px;
}

.count-cell {
  min-width: 80px;
}

.total-row {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  font-weight: 600;
}

.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.legend {
  padding: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
}

.gap-3 {
  gap: 12px;
}

.gap-1 {
  gap: 4px;
}
</style>
