<script setup>
import { computed, ref } from "vue";
import { useNetWorthStore } from "../stores/netWorth";
import { useAccountStore } from "../stores/account";

const props = defineProps({
  kind: {
    type: String,
    required: true, // "asset" | "debt"
  },
  item: {
    type: Object,
    default: null, // editing when set; creating when null
  },
});

const emit = defineEmits(["saved"]);

const netWorthStore = useNetWorthStore();
const accountStore = useAccountStore();
const isDebt = props.kind === "debt";
const isEdit = !!props.item;

if (!accountStore.accounts.accounts.length) {
  accountStore.fetchAccounts();
}

const accountOptions = computed(() =>
  accountStore.accounts.accounts.map((a) => ({
    title: a.description,
    value: a.id,
  }))
);

const typeOptions = isDebt
  ? ["Mortgage", "Auto Loan", "Credit Card", "Student Loan", "Personal Loan", "Other"]
  : ["Real Estate", "Vehicle", "Investment", "Retirement", "Cash", "Other"];

const name = ref(props.item?.name ?? "");
const type = ref(props.item?.type ?? "");
const accountId = ref(props.item?.account_id ?? null);
const interestRate = ref(props.item?.interest_rate ?? null);
const minimumPayment = ref(props.item?.minimum_payment ?? null);
const initialBalance = ref(null);
const balanceDate = ref(new Date().toISOString().slice(0, 10));

const saving = ref(false);
const error = ref(null);

function toNumberOrNull(value) {
  return value === null || value === "" ? null : Number(value);
}

async function save() {
  if (!name.value?.trim() || !type.value?.trim()) {
    error.value = "Name and type are required";
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    if (isEdit) {
      await netWorthStore.updateItem(props.item.id, {
        name: name.value.trim(),
        account_id: accountId.value,
        type: type.value.trim(),
        interest_rate: toNumberOrNull(interestRate.value),
        minimum_payment: toNumberOrNull(minimumPayment.value),
      });
    } else {
      await netWorthStore.createItem({
        name: name.value.trim(),
        account_id: accountId.value,
        kind: props.kind,
        type: type.value.trim(),
        interest_rate: toNumberOrNull(interestRate.value),
        minimum_payment: toNumberOrNull(minimumPayment.value),
        initial_balance: toNumberOrNull(initialBalance.value),
        balance_date: initialBalance.value ? balanceDate.value : null,
      });
    }
    emit("saved");
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      `Failed to save ${isDebt ? "debt" : "asset"}`;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="nw-form">
    <v-text-field
      v-model="name"
      label="Name"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-2"
    />
    <v-combobox
      v-model="type"
      label="Type"
      :items="typeOptions"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-2"
    />
    <v-select
      v-model="accountId"
      label="Linked account (optional)"
      :items="accountOptions"
      clearable
      density="compact"
      variant="outlined"
      hide-details
      class="mb-2"
    />
    <template v-if="isDebt">
      <v-text-field
        v-model="interestRate"
        label="Interest rate (% APR, optional)"
        type="number"
        min="0"
        step="0.01"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
      />
      <v-text-field
        v-model="minimumPayment"
        label="Minimum payment ($/mo, optional)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
      />
    </template>
    <template v-if="!isEdit">
      <v-text-field
        v-model="initialBalance"
        label="Current balance ($)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
      />
      <v-text-field
        v-model="balanceDate"
        label="As of date"
        type="date"
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
      />
    </template>
    <v-alert v-if="error" type="error" density="compact" class="mb-2">
      {{ error }}
    </v-alert>
    <div class="d-flex justify-end">
      <v-btn color="primary" variant="flat" :loading="saving" @click="save">
        Save
      </v-btn>
    </div>
  </div>
</template>
