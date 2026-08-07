<script setup>
import { ref, computed } from "vue";
import { useHouseholdStore } from "../stores/household";
import { useSimplefinStore } from "../stores/simplefin";

const emit = defineEmits(["open-simplefin-wizard"]);

const householdStore = useHouseholdStore();
const simplefinStore = useSimplefinStore();

const simplefinUrlSet = computed(
  () => householdStore.household?.household?.simplefin_access_url_set
);
const simplefinUrlSuffix = computed(
  () => householdStore.household?.household?.simplefin_access_url_suffix
);

const simplefinTokenInput = ref("");
const claimingSimplefin = ref(false);
const simplefinError = ref(null);
const showSimplefinHelp = ref(false);

async function claimSimplefin() {
  if (!simplefinTokenInput.value.trim()) return;
  claimingSimplefin.value = true;
  simplefinError.value = null;
  try {
    await householdStore.claimSimplefin(simplefinTokenInput.value.trim());
    simplefinTokenInput.value = "";
    const householdId = householdStore.household?.household?.id;
    if (householdId) {
      await simplefinStore.fetchAccounts(householdId);
      if (simplefinStore.firstFetch) emit("open-simplefin-wizard");
    }
  } catch (err) {
    simplefinError.value =
      err.response?.data?.message || "Failed to redeem setup token";
  } finally {
    claimingSimplefin.value = false;
  }
}

function openWizard() {
  emit("open-simplefin-wizard");
}
</script>

<template>
  <div class="simplefin-panel">
    <p class="pill mb-2">
      SimpleFin
    </p>
    <p
      class="muted mb-2"
      style="font-size: 0.85rem"
    >
      {{
        simplefinUrlSet
          ? `Connected (••••${simplefinUrlSuffix}) — redeem a new setup token to reconnect`
          : "Not connected — get a one-time setup token from your SimpleFin bridge and redeem it below"
      }}
    </p>
    <button
      type="button"
      class="text-primary mb-2"
      style="font-size: 0.85rem; background: none; border: none; padding: 0; cursor: pointer"
      @click="showSimplefinHelp = !showSimplefinHelp"
    >
      {{ showSimplefinHelp ? "Hide" : "How do I get a setup token?" }}
    </button>
    <ol
      v-if="showSimplefinHelp"
      class="muted mb-3"
      style="font-size: 0.85rem; padding-left: 1.1rem"
    >
      <li class="mb-1">
        Go to
        <a
          href="https://beta-bridge.simplefin.org/"
          target="_blank"
          rel="noopener"
        >
          beta-bridge.simplefin.org
        </a>
        and create a SimpleFin account (a small subscription fee applies).
      </li>
      <li class="mb-1">
        Under "Financial Institutions", add each bank account you want to sync.
      </li>
      <li class="mb-1">
        Go to "My Accounts" &rarr; Apps &rarr; New Connection, name it (e.g. "Budget App"),
        and click "Create Setup Token".
      </li>
      <li class="mb-1">
        Copy the token and paste it into the field below, then click Redeem —
        it's one-time use only, and once claimed you'll be walked through
        matching each SimpleFin account to one in this app.
      </li>
      <li>
        Lost or expired the token? Generate a new one from the same Apps page
        and redeem it again — this replaces the old connection.
      </li>
    </ol>
    <div class="d-flex ga-2">
      <v-text-field
        v-model="simplefinTokenInput"
        type="password"
        label="Setup token"
        density="compact"
        variant="outlined"
        hide-details
        @keyup.enter="claimSimplefin"
      />
      <v-btn
        color="primary"
        variant="flat"
        :loading="claimingSimplefin"
        :disabled="!simplefinTokenInput.trim()"
        @click="claimSimplefin"
      >
        Redeem
      </v-btn>
    </div>
    <v-alert
      v-if="simplefinError"
      type="error"
      density="compact"
      class="mt-3"
    >
      {{ simplefinError }}
    </v-alert>
    <v-btn
      v-if="simplefinUrlSet"
      variant="outlined"
      density="comfortable"
      prepend-icon="mdi-bank-transfer"
      class="mt-3"
      @click="openWizard"
    >
      Update Accounts
    </v-btn>
  </div>
</template>
