<script setup>
import { computed, ref } from "vue";
import { createCheckoutSession, createPortalSession } from "../api";
import { useHouseholdStore } from "../stores/household";
import { TRIAL_DAYS, isTrialEligible } from "../utils/billing";

const householdStore = useHouseholdStore();
const loading = ref(false);
const error = ref(null);

const household = computed(() => householdStore.household?.household);
const isActive = computed(() =>
  ["active", "trialing"].includes(household.value?.subscription_status)
);
const showsTrial = computed(() => isTrialEligible(household.value));
const statusLabel = computed(() => {
  const status = household.value?.subscription_status;
  if (!status) return "Not subscribed";
  return status.charAt(0).toUpperCase() + status.slice(1);
});

async function goToPortal() {
  const householdId = household.value?.id;
  if (!householdId) return;
  loading.value = true;
  error.value = null;
  try {
    const { url } = await createPortalSession(householdId);
    window.location.href = url;
  } catch (err) {
    error.value = err.response?.data?.message || "Couldn't open billing portal";
    loading.value = false;
  }
}

async function subscribe() {
  const householdId = household.value?.id;
  if (!householdId) return;
  loading.value = true;
  error.value = null;
  try {
    const { url } = await createCheckoutSession(householdId);
    window.location.href = url;
  } catch (err) {
    error.value = err.response?.data?.message || "Couldn't start checkout";
    loading.value = false;
  }
}
</script>

<template>
  <div class="billing-settings">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <p class="pill mb-1">
          Plan
        </p>
        <p class="text-body-1 font-weight-medium">
          $4.99/mo
        </p>
        <p
          v-if="showsTrial"
          class="muted"
          style="font-size: 0.8rem"
        >
          Starts with a {{ TRIAL_DAYS }}-day free trial
        </p>
      </div>
      <v-chip
        :color="isActive ? 'success' : 'default'"
        size="small"
        variant="flat"
      >
        {{ statusLabel }}
      </v-chip>
    </div>

    <v-btn
      v-if="isActive || household?.stripe_customer_id_set"
      color="primary"
      variant="flat"
      block
      :loading="loading"
      @click="goToPortal"
    >
      Manage billing
    </v-btn>
    <v-btn
      v-else
      color="primary"
      variant="flat"
      block
      :loading="loading"
      @click="subscribe"
    >
      {{ showsTrial ? "Start free trial" : "Subscribe — $4.99/mo" }}
    </v-btn>

    <p
      v-if="error"
      class="text-error mt-3"
    >
      {{ error }}
    </p>
  </div>
</template>
