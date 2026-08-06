<script setup>
import { ref, computed } from "vue";
import { useHouseholdStore } from "../stores/household";
import { useUserStore } from "../stores/user";

const emit = defineEmits(["saved"]);

const householdStore = useHouseholdStore();
const userStore = useUserStore();
const name = ref(householdStore.household?.household?.name ?? "");
const saving = ref(false);
const nameError = ref(null);
const memberEmail = ref("");
const adding = ref(false);
const memberError = ref(null);

const anthropicKeyInput = ref("");
const simplefinUrlInput = ref("");
const savingSecrets = ref(false);
const secretsError = ref(null);
const anthropicKeySet = computed(
  () => householdStore.household?.household?.anthropic_api_key_set
);
const simplefinUrlSet = computed(
  () => householdStore.household?.household?.simplefin_access_url_set
);

async function saveSecrets() {
  const updates = {};
  if (anthropicKeyInput.value.trim()) {
    updates.anthropic_api_key = anthropicKeyInput.value.trim();
  }
  if (simplefinUrlInput.value.trim()) {
    updates.simplefin_access_url = simplefinUrlInput.value.trim();
  }
  if (!Object.keys(updates).length) return;
  savingSecrets.value = true;
  secretsError.value = null;
  try {
    await householdStore.updateSecrets(updates);
    anthropicKeyInput.value = "";
    simplefinUrlInput.value = "";
  } catch (err) {
    secretsError.value =
      err.response?.data?.message || "Failed to save integrations";
  } finally {
    savingSecrets.value = false;
  }
}

async function saveName() {
  if (!name.value.trim()) {
    nameError.value = "Household name is required";
    return;
  }
  saving.value = true;
  nameError.value = null;
  try {
    await householdStore.updateName(name.value.trim());
    emit("saved");
  } catch (err) {
    nameError.value =
      err.response?.data?.message || "Failed to save household";
  } finally {
    saving.value = false;
  }
}

async function addMember() {
  if (!memberEmail.value.trim()) return;
  adding.value = true;
  memberError.value = null;
  try {
    await userStore.addMember(memberEmail.value.trim());
    memberEmail.value = "";
  } catch (err) {
    memberError.value =
      err.response?.data?.message || "Failed to add member";
  } finally {
    adding.value = false;
  }
}

function memberName(user) {
  const full = `${user.first_name} ${user.last_name}`.trim();
  return full || user.email;
}
</script>

<template>
  <div class="household-form">
    <div class="d-flex ga-2 mb-4">
      <v-text-field
        v-model="name"
        label="Household name"
        density="compact"
        variant="outlined"
        hide-details
        @keyup.enter="saveName"
      />
      <v-btn
        color="primary"
        variant="flat"
        :loading="saving"
        @click="saveName"
      >
        Save
      </v-btn>
    </div>
    <v-alert v-if="nameError" type="error" density="compact" class="mb-3">
      {{ nameError }}
    </v-alert>

    <p class="pill mb-2">Members</p>
    <v-list density="compact" class="mb-3">
      <v-list-item
        v-for="user in userStore.users.users"
        :key="user.id"
        :title="memberName(user)"
        :subtitle="user.first_name ? user.email : undefined"
      >
        <template #append>
          <span v-if="!user.first_name" class="pill">Invited</span>
        </template>
      </v-list-item>
    </v-list>

    <div class="d-flex ga-2">
      <v-text-field
        v-model="memberEmail"
        label="Add member by email"
        type="email"
        density="compact"
        variant="outlined"
        hide-details
        @keyup.enter="addMember"
      />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-account-plus-outline"
        :loading="adding"
        :disabled="!memberEmail.trim()"
        @click="addMember"
      >
        Add
      </v-btn>
    </div>
    <v-alert v-if="memberError" type="error" density="compact" class="mt-3">
      {{ memberError }}
    </v-alert>

    <p class="pill mb-2 mt-6">Integrations</p>
    <div class="d-flex flex-column ga-3">
      <v-text-field
        v-model="anthropicKeyInput"
        type="password"
        label="Anthropic API key"
        :placeholder="anthropicKeySet ? 'Configured — enter a new key to replace it' : 'Not set — required before AI categorization will work'"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-text-field
        v-model="simplefinUrlInput"
        type="password"
        label="SimpleFin access URL"
        :placeholder="simplefinUrlSet ? 'Configured — enter a new URL to replace it' : 'Not set — required before bank sync will work'"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-btn
        color="primary"
        variant="flat"
        :loading="savingSecrets"
        :disabled="!anthropicKeyInput.trim() && !simplefinUrlInput.trim()"
        @click="saveSecrets"
      >
        Save integrations
      </v-btn>
    </div>
    <v-alert v-if="secretsError" type="error" density="compact" class="mt-3">
      {{ secretsError }}
    </v-alert>
  </div>
</template>
