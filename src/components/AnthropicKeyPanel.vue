<script setup>
import { ref, computed } from "vue";
import { useHouseholdStore } from "../stores/household";

const householdStore = useHouseholdStore();

const anthropicKeyInput = ref("");
const savingSecrets = ref(false);
const secretsError = ref(null);
const showAnthropicHelp = ref(false);
const anthropicKeySet = computed(
  () => householdStore.household?.household?.anthropic_api_key_set
);
const anthropicKeySuffix = computed(
  () => householdStore.household?.household?.anthropic_api_key_suffix
);

async function saveSecrets() {
  if (!anthropicKeyInput.value.trim()) return;
  savingSecrets.value = true;
  secretsError.value = null;
  try {
    await householdStore.updateSecrets({
      anthropic_api_key: anthropicKeyInput.value.trim(),
    });
    anthropicKeyInput.value = "";
  } catch (err) {
    secretsError.value =
      err.response?.data?.message || "Failed to save integrations";
  } finally {
    savingSecrets.value = false;
  }
}
</script>

<template>
  <div class="anthropic-key-panel">
    <p class="pill mb-2">
      Anthropic API key
    </p>
    <p
      class="muted mb-2"
      style="font-size: 0.85rem"
    >
      {{
        anthropicKeySet
          ? `Configured (••••${anthropicKeySuffix}) — enter a new key to replace it`
          : "Not set — required before AI categorization and budget analysis will work"
      }}
    </p>
    <button
      type="button"
      class="text-primary mb-2"
      style="font-size: 0.85rem; background: none; border: none; padding: 0; cursor: pointer"
      @click="showAnthropicHelp = !showAnthropicHelp"
    >
      {{ showAnthropicHelp ? "Hide" : "How do I get an API key?" }}
    </button>
    <ol
      v-if="showAnthropicHelp"
      class="muted mb-3"
      style="font-size: 0.85rem; padding-left: 1.1rem"
    >
      <li class="mb-1">
        Go to
        <a
          href="https://console.anthropic.com/"
          target="_blank"
          rel="noopener"
        >
          console.anthropic.com
        </a>
        and sign in (or create an account).
      </li>
      <li class="mb-1">
        Add billing under Settings &rarr; Billing — the API is pay-as-you-go and
        won't work without a payment method on file, but usage for a personal
        budget app is typically a few cents a month.
      </li>
      <li class="mb-1">
        Go to Settings &rarr; API Keys and click "Create Key". Name it
        (e.g. "Budget App") and create it.
      </li>
      <li>
        Copy the key — it's only shown once — and paste it into the field
        below, then click Save.
      </li>
    </ol>
    <div class="d-flex flex-column ga-3">
      <v-text-field
        v-model="anthropicKeyInput"
        type="password"
        label="Anthropic API key"
        density="compact"
        variant="outlined"
        hide-details
        @keyup.enter="saveSecrets"
      />
      <v-btn
        color="primary"
        variant="flat"
        :loading="savingSecrets"
        :disabled="!anthropicKeyInput.trim()"
        @click="saveSecrets"
      >
        Save
      </v-btn>
    </div>
    <v-alert
      v-if="secretsError"
      type="error"
      density="compact"
      class="mt-3"
    >
      {{ secretsError }}
    </v-alert>
  </div>
</template>
