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

  // Convert markdown-style formatting to HTML
  let html = latestAnalysis.value.analysis
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  return `<p>${html}</p>`;
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
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
  max-height: 280px;
  overflow-y: auto;
}

.analysis-text :deep(p) {
  margin-bottom: 1em;
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
