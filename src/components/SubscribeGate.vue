<script setup>
import { ref } from "vue";
import { createCheckoutSession } from "../api";
import { useHouseholdStore } from "../stores/household";
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
      err.response?.data?.message || "Couldn't start checkout — try again";
    loading.value = false;
  }
}
</script>

<template>
  <div class="subscribe-gate">
    <SurfaceCard class="subscribe-card text-center">
      <p class="pill mb-2">
        {{ props.lapsed ? "Subscription inactive" : "Subscribe to continue" }}
      </p>
      <h1 class="text-h5 mb-2">
        {{ props.lapsed ? "Your subscription needs attention" : "Start your subscription" }}
      </h1>
      <p class="muted mb-6">
        {{
          props.lapsed
            ? "Your last payment didn't go through, or the subscription was canceled. Resubscribe to get back into your dashboard."
            : "Debrief is $4.99/mo per household. Subscribe to unlock your dashboard, imports, and AI budget analysis."
        }}
      </p>
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        :loading="loading"
        @click="subscribe"
      >
        {{ props.lapsed ? "Resubscribe" : "Subscribe — $4.99/mo" }}
      </v-btn>
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
