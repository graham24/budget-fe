<script setup>
import { ref } from "vue";
import { useNetWorthStore } from "../stores/netWorth";
import { useAccountStore } from "../stores/account";
import Dialog from "./common/Dialog.vue";
import NetWorthItemForm from "./NetWorthItemForm.vue";
import BalanceHistoryDialog from "./BalanceHistoryDialog.vue";

const props = defineProps({
  kind: {
    type: String,
    required: true, // "asset" | "debt"
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const netWorthStore = useNetWorthStore();
const accountStore = useAccountStore();

const showForm = ref(false);
const editingItem = ref(null);
const balanceItem = ref(null);
const showBalances = ref(false);
const deletingId = ref(null);

const isDebt = props.kind === "debt";
const addLabel = isDebt ? "Add debt" : "Add asset";

function rows() {
  return isDebt ? netWorthStore.debts : netWorthStore.assets;
}

function openCreate() {
  editingItem.value = null;
  showForm.value = true;
}

function openEdit(item) {
  editingItem.value = item;
  showForm.value = true;
}

function openBalances(item) {
  balanceItem.value = item;
  showBalances.value = true;
}

async function removeItem(item) {
  if (!confirm(`Delete "${item.name}" and its balance history?`)) return;
  deletingId.value = item.id;
  try {
    await netWorthStore.deleteItem(item.id);
  } catch (err) {
    console.error("Error deleting item:", err);
  } finally {
    deletingId.value = null;
  }
}

function formatShortDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Staleness tiers for the latest balance entry
const STALE_WARNING_DAYS = 45;
const STALE_ERROR_DAYS = 90;

function daysSinceUpdate(item) {
  if (!item.current_balance_date) return null;
  return Math.floor(
    (Date.now() - new Date(item.current_balance_date).getTime()) / 86400000
  );
}

function stalenessClass(item) {
  const days = daysSinceUpdate(item);
  if (days === null || days > STALE_ERROR_DAYS) return "stale--error";
  if (days > STALE_WARNING_DAYS) return "stale--warning";
  return "muted";
}

function stalenessTitle(item) {
  const days = daysSinceUpdate(item);
  if (days === null) return "No balance recorded yet";
  if (days <= STALE_WARNING_DAYS) return `Updated ${days} days ago`;
  return `Updated ${days} days ago. Use the balance button to refresh`;
}

function accountLabel(item) {
  if (!item.account_id) return null;
  const account = accountStore.accounts.accounts.find(
    (a) => a.id === item.account_id
  );
  return account?.description ?? null;
}
</script>

<template>
  <div class="nw-items">
    <div
      v-if="!readOnly"
      class="d-flex justify-end mb-2"
    >
      <v-btn
        size="small"
        variant="text"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openCreate"
      >
        {{ addLabel }}
      </v-btn>
    </div>

    <div
      v-if="rows().length"
      class="item-list"
    >
      <div
        v-for="item in rows()"
        :key="item.id"
        class="item-row"
      >
        <div class="item-row__main">
          <div class="item-row__name">
            {{ item.name }}
            <span class="pill">{{ item.type }}</span>
            <span
              v-if="accountLabel(item)"
              class="pill"
            >{{ accountLabel(item) }}</span>
          </div>
          <div
            v-if="isDebt && (item.interest_rate || item.minimum_payment)"
            class="item-row__debt muted"
          >
            <span v-if="item.interest_rate">{{ item.interest_rate }}% APR</span>
            <span v-if="item.minimum_payment">
              {{ formatCurrency(item.minimum_payment) }}/mo min
            </span>
          </div>
        </div>
        <div class="item-row__balance">
          <template v-if="item.current_balance !== null">
            <div class="item-row__amount">
              {{ formatCurrency(item.current_balance) }}
            </div>
            <div
              class="text-caption item-row__age"
              :class="stalenessClass(item)"
              :title="stalenessTitle(item)"
            >
              <v-icon
                v-if="stalenessClass(item) !== 'muted'"
                icon="mdi-clock-alert-outline"
                size="12"
              />
              as of {{ formatShortDate(item.current_balance_date) }}
            </div>
          </template>
          <v-btn
            v-else-if="!readOnly"
            size="x-small"
            variant="text"
            color="primary"
            @click="openBalances(item)"
          >
            Add balance
          </v-btn>
        </div>
        <div
          v-if="!readOnly"
          class="item-row__actions"
        >
          <v-btn
            icon="mdi-cash-edit"
            variant="text"
            size="x-small"
            title="Update balance"
            @click="openBalances(item)"
          />
          <v-btn
            icon="mdi-pencil-outline"
            variant="text"
            size="x-small"
            title="Edit"
            @click="openEdit(item)"
          />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="x-small"
            title="Delete"
            :loading="deletingId === item.id"
            @click="removeItem(item)"
          />
        </div>
      </div>
    </div>
    <p
      v-else-if="netWorthStore.loaded"
      class="muted text-caption text-center py-3"
    >
      {{ isDebt
        ? "No debts yet. Add your mortgage, loans, or cards to track payoff."
        : "No assets yet. Add your home, vehicles, or accounts to track value." }}
    </p>

    <Dialog
      v-model="showForm"
      :title="editingItem ? `Edit ${editingItem.name}` : addLabel"
      max-width="500"
    >
      <NetWorthItemForm
        v-if="showForm"
        :kind="kind"
        :item="editingItem"
        @saved="showForm = false"
      />
    </Dialog>

    <Dialog
      v-model="showBalances"
      :title="balanceItem ? `${balanceItem.name}: Balance history` : ''"
      max-width="500"
    >
      <BalanceHistoryDialog
        v-if="showBalances && balanceItem"
        :item="balanceItem"
      />
    </Dialog>
  </div>
</template>

<style scoped>
.item-list {
  display: grid;
}
.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.2);
}
.item-row:last-child {
  border-bottom: none;
}
.item-row__main {
  flex: 1;
  min-width: 0;
}
.item-row__name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.item-row__debt {
  font-size: 0.8rem;
  display: flex;
  gap: 10px;
  margin-top: 2px;
}
.item-row__balance {
  text-align: right;
  white-space: nowrap;
}
.item-row__amount {
  font-weight: 700;
}
.item-row__actions {
  display: flex;
  align-items: center;
}
.item-row__age {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.stale--warning {
  color: rgb(var(--v-theme-warning));
  font-weight: 600;
}
.stale--error {
  color: rgb(var(--v-theme-error));
  font-weight: 600;
}
</style>
