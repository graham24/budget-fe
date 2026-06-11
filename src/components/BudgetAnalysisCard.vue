<template>
  <div class="budget-analysis-card">
    <div v-if="!latestAnalysis && !loading" class="empty-state text-center py-6">
      <v-icon icon="mdi-chart-box-outline" size="48" class="mb-3" color="primary" />
      <p class="text-body-1 mb-2">No analysis yet</p>
      <p class="text-caption muted">Generate your first budget analysis to see insights here.</p>
    </div>

    <div v-else-if="loading" class="text-center py-4">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>

    <div v-else class="analysis-display">
      <div class="analysis-meta mb-3">
        <div class="d-flex align-center flex-wrap gap-2 mb-2">
          <v-chip size="small" color="primary" variant="tonal">
            {{ formatDate(latestAnalysis.from_date) }} - {{ formatDate(latestAnalysis.to_date) }}
          </v-chip>
          <v-chip size="small" variant="tonal">
            {{ latestAnalysis.transaction_count }} transactions
          </v-chip>
        </div>
        <p class="text-caption muted">
          Generated {{ formatDateTime(latestAnalysis.created) }}
        </p>
      </div>

      <div class="analysis-text" v-html="formattedAnalysis"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getLatestBudgetAnalysis } from "../api";
import { analysisToHtml } from "../markdown";

const props = defineProps({
  householdId: {
    type: Number,
    required: true,
  },
  refreshTrigger: {
    type: Number,
    default: 0,
  },
});

const loading = ref(false);
const latestAnalysis = ref(null);

const formattedAnalysis = computed(() => {
  if (!latestAnalysis.value) return "";
  return analysisToHtml(latestAnalysis.value.analysis);
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
  line-height: 1.7;
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-size: 0.9rem;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 6px;
}

.analysis-text :deep(p) {
  margin-bottom: 1em;
}

.analysis-text :deep(h4),
.analysis-text :deep(h5),
.analysis-text :deep(h6) {
  margin: 0.9em 0 0.4em;
  line-height: 1.3;
  color: rgba(var(--v-theme-on-surface), 1);
}

.analysis-text :deep(h4:first-child) {
  margin-top: 0;
}

.analysis-text :deep(h4) {
  font-size: 1.05rem;
}

.analysis-text :deep(h5) {
  font-size: 0.95rem;
}

.analysis-text :deep(h6) {
  font-size: 0.9rem;
}

.analysis-text :deep(ul) {
  margin: 0 0 1em;
  padding-left: 1.3em;
}

.analysis-text :deep(li) {
  margin-bottom: 0.3em;
}

.analysis-text :deep(hr) {
  border: none;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.3);
  margin: 1em 0;
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

.muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.empty-state {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.gap-2 {
  gap: 8px;
}
</style>
