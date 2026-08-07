<script setup>
import { ref } from "vue";
import { useHouseholdStore } from "../stores/household";
import { useUserStore } from "../stores/user";
import IntegrationsPanel from "./IntegrationsPanel.vue";

const emit = defineEmits(["saved", "open-simplefin-wizard"]);

const householdStore = useHouseholdStore();
const userStore = useUserStore();
const name = ref(householdStore.household?.household?.name ?? "");
const saving = ref(false);
const nameError = ref(null);
const memberEmail = ref("");
const adding = ref(false);
const memberError = ref(null);

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
    <v-alert
      v-if="nameError"
      type="error"
      density="compact"
      class="mb-3"
    >
      {{ nameError }}
    </v-alert>

    <p class="pill mb-2">
      Members
    </p>
    <v-list
      density="compact"
      class="mb-3"
    >
      <v-list-item
        v-for="user in userStore.users.users"
        :key="user.id"
        :title="memberName(user)"
        :subtitle="user.first_name ? user.email : undefined"
      >
        <template #append>
          <span
            v-if="!user.first_name"
            class="pill"
          >Invited</span>
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
    <v-alert
      v-if="memberError"
      type="error"
      density="compact"
      class="mt-3"
    >
      {{ memberError }}
    </v-alert>

    <div class="mt-6">
      <IntegrationsPanel @open-simplefin-wizard="emit('open-simplefin-wizard')" />
    </div>
  </div>
</template>
