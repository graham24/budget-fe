<script setup>
import { ref } from "vue";
import { createCheckoutSession } from "../api";
import { useHouseholdStore } from "../stores/household";
import { TRIAL_DAYS } from "../utils/billing";
import SurfaceCard from "./common/SurfaceCard.vue";

const props = defineProps({
  // Set when we know the household has subscribed before (now lapsed/
  // canceled/past_due) so the copy can say "Resubscribe" instead of a
  // generic pitch.
  lapsed: {
    type: Boolean,
    default: false,
  },
});

const householdStore = useHouseholdStore();
const loading = ref(false);
const error = ref(null);

async function subscribe() {
  const householdId = householdStore.household?.household?.id;
  if (!householdId) return;
  loading.value = true;
  error.value = null;
  try {
    const { url } = await createCheckoutSession(householdId);
    window.location.href = url;
  } catch (err) {
    error.value =
      err.response?.data?.message || "Couldn't start checkout. Try again";
    loading.value = false;
  }
}
</script>

<template>
  <div class="subscribe-gate">
    <SurfaceCard class="subscribe-card text-center">
      <p class="pill mb-2">
        {{ props.lapsed ? "Subscription inactive" : `Free for ${TRIAL_DAYS} days` }}
      </p>
      <h1 class="text-h5 mb-2">
        {{ props.lapsed ? "Your subscription needs attention" : `Start your ${TRIAL_DAYS}-day free trial` }}
      </h1>
      <p class="muted mb-6">
        {{
          props.lapsed
            ? "Your last payment didn't go through, or the subscription was canceled. Resubscribe to get back into your dashboard."
            : `Unlock your dashboard, imports, and AI budget analysis free for ${TRIAL_DAYS} days, no card required. After that it's $4.99/mo per household.`
        }}
      </p>
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        :loading="loading"
        @click="subscribe"
      >
        {{ props.lapsed ? "Resubscribe" : "Start free trial" }}
      </v-btn>
      <!-- Checkout collects no card for a trial (payment_method_collection
           "if_required"), and the trial cancels at the end if none was added
           (missing_payment_method "cancel"). Say both plainly, losing access
           shouldn't be the first time someone hears about it. -->
      <p
        v-if="!props.lapsed"
        class="muted mt-4"
        style="font-size: 0.8rem"
      >
        No payment method needed to start, and nothing is charged
        automatically. When the {{ TRIAL_DAYS }} days are up, access stops
        unless you've added a card.
      </p>
      <p
        v-if="error"
        class="text-error mt-4"
      >
        {{ error }}
      </p>
    </SurfaceCard>
  </div>
</template>

<style scoped>
.subscribe-gate {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.subscribe-card {
  max-width: 440px;
}
</style>
