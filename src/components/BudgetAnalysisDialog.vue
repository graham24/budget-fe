<template>
  <div class="budget-analysis">
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="mt-4 muted">
        Generating your budget analysis...
      </p>
    </div>
    <div
      v-else-if="error"
      class="error-state py-6"
    >
      <v-icon
        icon="mdi-alert-circle"
        color="error"
        size="48"
        class="mb-3"
      />
      <p class="text-body-1 mb-2">
        Failed to generate analysis
      </p>
      <p class="text-caption muted">
        {{ error }}
      </p>
    </div>
    <div
      v-else-if="analysis"
      class="analysis-content"
    >
      <div class="analysis-meta mb-4">
        <div class="d-flex align-center gap-2 mb-2">
          <v-chip
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ formatDate(analysis.from_date) }} - {{ formatDate(analysis.to_date) }}
          </v-chip>
          <v-chip
            size="small"
            variant="tonal"
          >
            {{ analysis.transaction_count }} transactions
          </v-chip>
          <v-chip
            v-if="cached"
            size="small"
            color="success"
            variant="tonal"
          >
            <v-icon
              icon="mdi-cached"
              start
              size="small"
            />
            Cached
          </v-chip>
          <v-btn
            v-if="cached"
            size="small"
            variant="text"
            color="primary"
            prepend-icon="mdi-refresh"
            @click="fetchAnalysis(true)"
          >
            Regenerate
          </v-btn>
        </div>
        <p class="text-caption muted">
          Generated {{ formatDateTime(analysis.created) }}
        </p>
      </div>
      <div
        class="analysis-text"
        v-html="formattedAnalysis"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { generateBudgetAnalysis } from "../api";
import { analysisToHtml } from "../markdown";

const props = defineProps({
  userId: {
    type: Number,
    required: true,
  },
  householdId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["close", "success"]);

const loading = ref(true);
const error = ref(null);
const analysis = ref(null);
const cached = ref(false);

const formattedAnalysis = computed(() => {
  if (!analysis.value) return "";
  return analysisToHtml(analysis.value.analysis);
});

// from/to are date-only boundaries — render in UTC so they don't shift a day
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const fetchAnalysis = async (force = false) => {
  loading.value = true;
  error.value = null;

  try {
    const result = await generateBudgetAnalysis(
      props.userId,
      props.householdId,
      undefined,
      undefined,
      force
    );
    analysis.value = result.analysis;
    cached.value = result.cached;
    emit("success");
  } catch (err) {
    console.error("Error generating budget analysis:", err);
    error.value = err.response?.data?.message || "An unexpected error occurred";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAnalysis();
});
</script>

<style scoped>
.budget-analysis {
  min-height: 200px;
}

.analysis-content {
  max-height: 500px;
  overflow-y: auto;
}

.analysis-text {
  line-height: 1.7;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.analysis-text :deep(p) {
  margin-bottom: 1em;
}

.analysis-text :deep(strong) {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 1);
}

.analysis-text :deep(em) {
  font-style: italic;
}

.error-state {
  text-align: center;
}

.gap-2 {
  gap: 8px;
}
</style>
