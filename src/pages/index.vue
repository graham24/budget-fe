<script setup>
import { defineComponent } from "vue";
import { ref, computed, watch } from "vue";
import { onMounted } from "vue";
import Transactions from "../components/Transactions.vue";
import ImportForm from "../components/ImportForm.vue";
import BudgetAnalysisDialog from "../components/BudgetAnalysisDialog.vue";
import BudgetAnalysisCard from "../components/BudgetAnalysisCard.vue";
import CategoryRulesManager from "../components/CategoryRulesManager.vue";
import TransactionCountTable from "../components/TransactionCountTable.vue";
import Dialog from "../components/common/Dialog.vue";
import CashFlow from "../components/CashFlow.vue";
import Categories from "../components/Categories.vue";
import BudgetTargets from "../components/BudgetTargets.vue";
import SpendingMix from "../components/SpendingMix.vue";
import FiftyThirtyTwenty from "../components/FiftyThirtyTwenty.vue";
import RecurringCosts from "../components/RecurringCosts.vue";
import HeroBanner from "../components/common/HeroBanner.vue";
import SurfaceCard from "../components/common/SurfaceCard.vue";
import SectionHeader from "../components/common/SectionHeader.vue";
import { useHouseholdStore } from "../stores/household";
import { useAccountStore } from "../stores/account";
import { useTransactionStore } from "../stores/transaction";
import { useUserStore } from "../stores/user";
import { useAuthStore } from "../stores/auth";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();

const householdStore = useHouseholdStore();
const accountsStore = useAccountStore();
const transactionsStore = useTransactionStore();
const userStore = useUserStore();
const authStore = useAuthStore();
const loading = ref(true);
const activeTab = ref("overview");
const showDialog = ref(false);
const showAnalysisDialog = ref(false);
const showRulesDialog = ref(false);
const analysisRefreshTrigger = ref(0);
const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

// Refresh the overview card; leave the dialog open so the result can be read
const handleAnalysisGenerated = () => {
  analysisRefreshTrigger.value++;
};

onMounted(async () => {
  try {
    // Household first — users and transactions derive their IDs from it
    await householdStore.fetchHousehold();
    await Promise.all([
      accountsStore.fetchAccounts(),
      transactionsStore.fetchTransactions(),
      userStore.fetchUsers(),
    ]);
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
});
defineOptions({
  components: {
    Transactions,
  },
});

const windowLabel = computed(() => {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth() - (transactionsStore.monthsAgo + 3),
    1
  );
  const end = new Date(
    today.getFullYear(),
    today.getMonth() - transactionsStore.monthsAgo,
    0
  );
  return `${monthFormatter.format(start)} - ${monthFormatter.format(end)}`;
});

watch(
  () => transactionsStore.monthsAgo,
  async () => {
    loading.value = true;
    try {
      await transactionsStore.fetchTransactions();
    } finally {
      loading.value = false;
    }
  }
);

const focusMonthLabel = computed(() => {
  const today = new Date();
  const month = new Date(
    today.getFullYear(),
    today.getMonth() - (transactionsStore.monthsAgo + 1),
    1
  );
  return monthFormatter.format(month);
});
</script>

<template>
  <div id="home" class="page-shell">
    <v-container v-if="!loading" fluid>
      <HeroBanner
        class="mb-6"
        label="Last 3 months"
        :title="`${householdStore.household?.household?.name ?? 'Household'} overview`"
        :subtitle="`${windowLabel} · Focusing on ${focusMonthLabel}`"
      >
        <template #actions>
          <v-btn
            v-if="smAndDown"
            icon="mdi-chevron-left"
            variant="tonal"
            color="primary"
            density="comfortable"
            aria-label="Previous month"
            :disabled="transactionsStore.monthsAgo >= 2"
            @click="transactionsStore.monthsAgo += 1"
          />
          <v-btn
            v-else
            variant="text"
            color="primary"
            prepend-icon="mdi-chevron-left"
            :disabled="transactionsStore.monthsAgo >= 2"
            @click="transactionsStore.monthsAgo += 1"
            >Previous</v-btn
          >
          <v-btn
            v-if="smAndDown"
            icon="mdi-chevron-right"
            variant="tonal"
            color="primary"
            density="comfortable"
            aria-label="Next month"
            :disabled="transactionsStore.monthsAgo <= -1"
            @click="transactionsStore.monthsAgo -= 1"
          />
          <v-btn
            v-else
            variant="text"
            color="primary"
            prepend-icon="mdi-chevron-right"
            :disabled="transactionsStore.monthsAgo <= -1"
            @click="transactionsStore.monthsAgo -= 1"
            >Next</v-btn
          >
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-upload"
            @click="showDialog = true"
            >Import</v-btn
          >
          <v-btn
            color="secondary"
            variant="flat"
            prepend-icon="mdi-chart-line"
            @click="showAnalysisDialog = true"
            >{{ smAndDown ? "Analysis" : "Generate Analysis" }}</v-btn
          >
          <v-btn
            color="secondary"
            variant="tonal"
            prepend-icon="mdi-tag-multiple"
            @click="showRulesDialog = true"
            >Rules</v-btn
          >
          <Dialog v-model="showDialog" title="Import Transactions" max-width="900">
            <ImportForm @update:isOpen="showDialog = $event" />
          </Dialog>
          <Dialog v-model="showRulesDialog" title="Category Rules">
            <CategoryRulesManager v-if="showRulesDialog" />
          </Dialog>
          <Dialog v-model="showAnalysisDialog" title="Budget Analysis" max-width="800">
            <BudgetAnalysisDialog
              v-if="showAnalysisDialog && authStore.user && householdStore.household"
              :user-id="authStore.user.id"
              :household-id="householdStore.household.household.id"
              @success="handleAnalysisGenerated"
            />
          </Dialog>
        </template>
      </HeroBanner>

      <v-tabs
        v-model="activeTab"
        color="primary"
        class="dashboard-tabs mb-4"
        :grow="smAndDown"
        density="comfortable"
      >
        <v-tab value="overview" prepend-icon="mdi-view-dashboard-outline">
          Overview
        </v-tab>
        <v-tab value="insights" prepend-icon="mdi-lightbulb-on-outline">
          Insights
        </v-tab>
        <v-tab value="transactions" prepend-icon="mdi-format-list-bulleted">
          Transactions
          <v-badge
            v-if="transactionsStore.unknownTransactions.length"
            color="warning"
            :content="transactionsStore.unknownTransactions.length"
            inline
          />
        </v-tab>
      </v-tabs>

      <!-- touch disabled so swiping inside scrollable tables doesn't switch tabs -->
      <v-window v-model="activeTab" :touch="false">
        <v-window-item value="overview">
          <v-row dense>
            <v-col cols="12" md="6">
              <SurfaceCard class="panel-card fill-height" padding="14px 16px">
                <SectionHeader
                  label="AI Insights"
                  title="Budget Analysis"
                  subtitle="AI-powered analysis of your spending patterns and recommendations."
                />
                <BudgetAnalysisCard
                  v-if="householdStore.household"
                  :household-id="householdStore.household.household.id"
                  :refresh-trigger="analysisRefreshTrigger"
                />
              </SurfaceCard>
            </v-col>
            <v-col cols="12" md="6">
              <div class="stack gap-md stack-fill fill-height">
                <SurfaceCard class="panel-card" padding="14px 16px">
                  <SectionHeader label="Cash flow" title="Net income & trend" />
                  <CashFlow />
                </SurfaceCard>
                <SurfaceCard class="panel-card" padding="14px 16px">
                  <SectionHeader label="Mix" title="Where the money went" />
                  <SpendingMix />
                </SurfaceCard>
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="6">
              <SurfaceCard class="fill-height" padding="14px 16px">
                <SectionHeader label="50/30/20" title="Budget rule check" />
                <FiftyThirtyTwenty />
              </SurfaceCard>
            </v-col>
            <v-col cols="12" sm="6" md="6">
              <SurfaceCard class="panel-card fill-height" padding="14px 16px">
                <SectionHeader
                  label="Targets"
                  title="Budget vs. actual"
                  subtitle="Focus-month spending against your monthly limits."
                />
                <BudgetTargets />
              </SurfaceCard>
            </v-col>
          </v-row>
        </v-window-item>

        <v-window-item value="insights">
          <v-row dense>
            <v-col cols="12" md="4">
              <div class="stack gap-md">
                <SurfaceCard padding="12px 14px">
                  <SectionHeader
                    label="Fixed costs"
                    title="Recurring charges"
                    subtitle="Charges seen 3+ months in a row at a similar amount."
                  />
                  <RecurringCosts />
                </SurfaceCard>
              </div>
            </v-col>
            <v-col cols="12" md="8">
              <SurfaceCard class="panel-card" padding="14px 16px">
                <SectionHeader label="Categories" title="Spending by category" />
                <Categories />
              </SurfaceCard>
            </v-col>
          </v-row>
        </v-window-item>

        <v-window-item value="transactions">
          <div class="stack gap-md">
            <SurfaceCard padding="14px 16px">
              <SectionHeader
                label="Import status"
                title="Transactions by Account"
                subtitle="Red = no transactions imported yet."
              />
              <TransactionCountTable />
            </SurfaceCard>
            <SurfaceCard class="panel-card" padding="14px 16px">
              <SectionHeader
                label="All activity"
                title="Transactions"
                subtitle="Search and update categories without leaving the table."
              />
              <Transactions />
            </SurfaceCard>
          </div>
        </v-window-item>
      </v-window>
    </v-container>
    <v-container v-else>
      <SurfaceCard class="text-center">
        <h1 class="text-h5 mb-2">Loading your dashboard…</h1>
        <p class="muted">Fetching households, accounts, and recent activity.</p>
      </SurfaceCard>
    </v-container>
  </div>
</template>

<style>
#home {
  width: 100%;
}
.page-shell {
  position: relative;
}
.muted {
  color: rgba(var(--v-theme-on-background), 0.65);
}
.stack {
  display: flex;
  flex-direction: column;
}
.gap-md {
  gap: 12px;
}
/* children share the column height evenly */
.stack-fill > * {
  flex: 1 1 0;
}
.dashboard-tabs {
  background: rgba(var(--v-theme-surface), 0.95);
  border-radius: var(--radius);
  border: 1px solid rgba(var(--v-theme-outline), 0.3);
  box-shadow: var(--shadow);
}
/* let card shadows breathe inside the window */
#home .v-window {
  padding: 2px;
  margin: -2px;
}

@media (max-width: 600px) {
  #home .v-container {
    padding: 6px 4px;
  }
  .dashboard-tabs .v-tab {
    min-width: 0;
    padding: 0 8px;
  }
}
</style>
