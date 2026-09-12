<template>
  <div class="budget-analysis-card">
    <div
      v-if="!latestAnalysis && !loading"
      class="empty-state text-center py-6"
    >
      <v-icon
        icon="mdi-chart-box-outline"
        size="48"
        class="mb-3"
        color="primary"
      />
      <p class="text-body-1 mb-2">
        No analysis yet
      </p>
      <p class="text-caption muted">
        Generate your first budget analysis to see insights here.
      </p>
    </div>

    <div
      v-else-if="loading"
      class="text-center py-4"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="32"
      />
    </div>

    <div
      v-else
      class="analysis-display"
    >
      <div class="analysis-meta mb-3">
        <div class="d-flex align-center flex-wrap gap-2 mb-2">
          <v-chip
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ formatDate(latestAnalysis.from_date) }} - {{ formatDate(latestAnalysis.to_date) }}
          </v-chip>
          <v-chip
            size="small"
            variant="tonal"
          >
            {{ latestAnalysis.transaction_count }} transactions
          </v-chip>
        </div>
        <p class="text-caption muted">
          Generated {{ formatDateTime(latestAnalysis.created) }}
        </p>
      </div>

      <div
        class="analysis-text"
        :class="{ 'analysis-text--clamped': maxHeight }"
        :style="maxHeight ? { maxHeight } : undefined"
        v-html="formattedAnalysis"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getLatestBudgetAnalysis } from "../api";
import { analysisToHtml, dropSection } from "../markdown";

const props = defineProps({
  householdId: {
    type: Number,
    required: true,
  },
  refreshTrigger: {
    type: Number,
    default: 0,
  },
  // Overview already renders targets as a live card ("Budget vs. actual"),
  // so it hides the AI's prose version of that section rather than saying
  // the same thing twice with different numbers, the prose reads the whole
  // analysis window, the card reads the focus month. The dialog leaves it in.
  hideTargetsSection: {
    type: Boolean,
    default: false,
  },
  // Callers that can't absorb an arbitrarily long analysis (the landing
  // page's hero card, which is height-matched against the headline beside
  // it) cap it and let the prose scroll. The Overview card runs full height.
  maxHeight: {
    type: String,
    default: "",
  },
});

const loading = ref(false);
const latestAnalysis = ref(null);

const TARGETS_HEADING = /^spending\s+vs\.?\s+targets$/i;

const formattedAnalysis = computed(() => {
  if (!latestAnalysis.value) return "";
  const body = props.hideTargetsSection
    ? dropSection(latestAnalysis.value.analysis, TARGETS_HEADING)
    : latestAnalysis.value.analysis;
  return analysisToHtml(body);
});

// from/to are date-only boundaries, render in UTC so they don't shift a day
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

const fetchLatestAnalysis = async () => {
  loading.value = true;
  try {
    const analysis = await getLatestBudgetAnalysis(props.householdId);
    latestAnalysis.value = analysis;
  } catch (err) {
    console.error("Error fetching latest analysis:", err);
    latestAnalysis.value = null;
  } finally {
    loading.value = false;
  }
};

watch(() => props.refreshTrigger, () => {
  fetchLatestAnalysis();
});

onMounted(() => {
  fetchLatestAnalysis();
});
</script>

<style scoped>
.budget-analysis-card {
  min-height: 120px;
}

.analysis-display {
  position: relative;
}

.analysis-text {
  font-size: 15px;
  line-height: 1.75;
  color: rgba(var(--v-theme-on-surface), 0.87);
  text-wrap: pretty;
}

.analysis-text--clamped {
  overflow-y: auto;
  padding-right: 6px;
}

.analysis-text :deep(p) {
  margin-bottom: 1em;
}

.analysis-text :deep(h4),
.analysis-text :deep(h5),
.analysis-text :deep(h6) {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
  margin: 1.2em 0 0.45em;
  line-height: 1.3;
  color: rgba(var(--v-theme-on-surface), 1);
}

.analysis-text :deep(h4:first-child) {
  margin-top: 0;
}

.analysis-text :deep(h4) {
  font-size: 18px;
}

.analysis-text :deep(h5) {
  font-size: 16px;
}

.analysis-text :deep(h6) {
  font-size: 15px;
}

.analysis-text :deep(ul) {
  margin: 0 0 1.4em;
  padding-left: 20px;
  display: grid;
  gap: 12px;
}

.analysis-text :deep(li) {
  margin-bottom: 0;
}

.analysis-text :deep(hr) {
  border: none;
  border-top: 1px solid var(--hairline);
  margin: 1.4em 0;
}

.analysis-text :deep(p:last-child) {
  margin-bottom: 0;
}

.analysis-text :deep(strong) {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 1);
}

.analysis-text :deep(em) {
  font-style: italic;
}

.empty-state {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.gap-2 {
  gap: 8px;
}
</style>
