<script setup>
import { ref } from "vue";
import { useAccountStore } from "../stores/account";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";

const props = defineProps({
  // Null = create a new account
  account: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["saved", "cancel"]);

// Must match the backend importer keys
const BANKS = ["Wells Fargo", "Chase", "US Bank", "Apple"];
const TYPES = ["Checking", "Savings", "Credit Card"];

const accountStore = useAccountStore();
const authStore = useAuthStore();
const userStore = useUserStore();
const description = ref(props.account?.description ?? "");
const type = ref(props.account?.type ?? "");
const bank = ref(props.account?.bank ?? null);
const userId = ref(props.account?.user_id ?? authStore.user?.id ?? null);
const saving = ref(false);
const error = ref(null);

function ownerName(user) {
  const full = `${user.first_name} ${user.last_name}`.trim();
  return full || user.email;
}

async function save() {
  if (!description.value.trim() || !type.value.trim() || !bank.value) {
    error.value = "Description, type, and bank are required";
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const payload = {
      description: description.value.trim(),
      type: type.value.trim(),
      bank: bank.value,
      user_id: userId.value,
    };
    if (props.account) {
      await accountStore.updateAccount(props.account.id, payload);
    } else {
      await accountStore.createAccount(payload);
    }
    emit("saved");
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to save account";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="account-form">
    <v-text-field
      v-model="description"
      label="Description"
      hint="Display name, e.g. Joint Checking"
      persistent-hint
      density="compact"
      variant="outlined"
      class="mb-3"
    />
    <div class="d-flex ga-3 mb-3 account-form__row">
      <v-combobox
        v-model="type"
        :items="TYPES"
        label="Type"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="bank"
        :items="BANKS"
        label="Bank"
        hint="Determines the CSV import format"
        persistent-hint
        density="compact"
        variant="outlined"
      />
    </div>
    <v-select
      v-model="userId"
      :items="userStore.users.users"
      :item-title="ownerName"
      item-value="id"
      label="Owner"
      density="compact"
      variant="outlined"
      class="mb-3"
      hide-details
    />
    <v-alert v-if="error" type="error" density="compact" class="mb-3">
      {{ error }}
    </v-alert>
    <div class="d-flex justify-end ga-2">
      <v-btn variant="text" :disabled="saving" @click="emit('cancel')">
        Cancel
      </v-btn>
      <v-btn color="primary" variant="flat" :loading="saving" @click="save">
        {{ props.account ? "Save Account" : "Add Account" }}
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 600px) {
  .account-form__row {
    flex-direction: column;
  }
}
</style>
