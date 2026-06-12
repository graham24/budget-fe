<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";

const props = defineProps({
  // Shown when auto-opened for a placeholder user who has no name yet
  prompt: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["saved", "cancel"]);

const authStore = useAuthStore();
const userStore = useUserStore();
const firstName = ref(authStore.user?.first_name ?? "");
const lastName = ref(authStore.user?.last_name ?? "");
const email = ref(authStore.user?.email ?? "");
const saving = ref(false);
const error = ref(null);

async function save() {
  if (!firstName.value.trim() || !lastName.value.trim() || !email.value.trim()) {
    error.value = "First name, last name, and email are required";
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await authStore.updateProfile({
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim(),
    });
    await userStore.fetchUsers();
    emit("saved");
  } catch (err) {
    error.value = err.response?.data?.message || "Failed to save profile";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="profile-form">
    <p v-if="prompt" class="text-caption muted mb-4">
      Welcome! Tell us your name so your household knows who you are.
    </p>
    <div class="d-flex ga-3 mb-3 profile-form__names">
      <v-text-field
        v-model="firstName"
        label="First name"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-text-field
        v-model="lastName"
        label="Last name"
        density="compact"
        variant="outlined"
        hide-details
      />
    </div>
    <v-text-field
      v-model="email"
      label="Email"
      type="email"
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
        Save
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 600px) {
  .profile-form__names {
    flex-direction: column;
  }
}
</style>
