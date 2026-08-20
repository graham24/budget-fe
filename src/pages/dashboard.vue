<script setup>
import { defineComponent } from "vue";
import { ref, computed, watch } from "vue";
import { onMounted } from "vue";
import Transactions from "../components/Transactions.vue";
import ImportForm from "../components/ImportForm.vue";
import BudgetAnalysisDialog from "../components/BudgetAnalysisDialog.vue";
import BudgetAnalysisCard from "../components/BudgetAnalysisCard.vue";
import CategoryRulesManager from "../components/CategoryRulesManager.vue";
import Dialog from "../components/common/Dialog.vue";
import CashFlow from "../components/CashFlow.vue";
import Categories from "../components/Categories.vue";
import BudgetTargets from "../components/BudgetTargets.vue";
import SpendingMix from "../components/SpendingMix.vue";
import FiftyThirtyTwenty from "../components/FiftyThirtyTwenty.vue";
import RecurringCosts from "../components/RecurringCosts.vue";
import KpiStrip from "../components/KpiStrip.vue";
import NetWorthKpis from "../components/NetWorthKpis.vue";
import NetWorthTrend from "../components/NetWorthTrend.vue";
import NetWorthItems from "../components/NetWorthItems.vue";
import NetWorthSummaryBar from "../components/NetWorthSummaryBar.vue";
import SurfaceCard from "../components/common/SurfaceCard.vue";
import SectionHeader from "../components/common/SectionHeader.vue";
import OnboardingWizard from "../components/OnboardingWizard.vue";
import SubscribeGate from "../components/SubscribeGate.vue";
import { useHouseholdStore } from "../stores/household";
import { useAccountStore } from "../stores/account";
import { useTransactionStore } from "../stores/transaction";
import { useUserStore } from "../stores/user";
import { useAuthStore } from "../stores/auth";
import { useNetWorthStore } from "../stores/netWorth";
import { useDisplay } from "vuetify";
import { useRoute, useRouter } from "vue-router";

const { smAndDown } = useDisplay();

const householdStore = useHouseholdStore();
const accountsStore = useAccountStore();
const transactionsStore = useTransactionStore();
const userStore = useUserStore();
const authStore = useAuthStore();
const netWorthStore = useNetWorthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(true);
const activeTab = ref("overview");
const showDialog = ref(false);
const showAnalysisDialog = ref(false);
const showRulesDialog = ref(false);
const showOnboarding = ref(false);
const analysisRefreshTrigger = ref(0);
const checkoutSnackbar = ref(false);
const checkoutMessage = ref("");

// Mirrors auth_utils.DEMO_USER_ID on the backend — the seeded demo
// household is always exempt from the subscription gate.
const DEMO_HOUSEHOLD_ID = -1;

const activeSubscriptionStatuses = ["active", "trialing"];
const needsSubscription = computed(() => {
  const household = householdStore.household?.household;
  if (!household || household.id === DEMO_HOUSEHOLD_ID) return false;
  return !activeSubscriptionStatuses.includes(household.subscription_status);
});
// Distinguishes "never subscribed" (generic pitch) from "subscribed once,
// now lapsed" (payment failed / canceled) copy in SubscribeGate.
const subscriptionLapsed = computed(() => {
  const household = householdStore.household?.household;
  return !!household?.subscription_status && needsSubscription.value;
});
const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

// Refresh the overview card; leave the dialog open so the result can be read
const handleAnalysisGenerated = () => {
  analysisRefreshTrigger.value++;
};

onMounted(async () => {
  // Returning from Stripe Checkout — surface the result, then drop the
  // query param so a refresh doesn't re-show it.
  if (route.query.checkout === "success") {
    checkoutMessage.value = "Subscription active — welcome aboard!";
    checkoutSnackbar.value = true;
    router.replace({ query: {} });
  } else if (route.query.checkout === "cancelled") {
    checkoutMessage.value = "Checkout cancelled — no charge was made.";
    checkoutSnackbar.value = true;
    router.replace({ query: {} });
  }

  try {
    // Household first — users and transactions derive their IDs from it
    await householdStore.fetchHousehold();
    if (needsSubscription.value) {
      // Gated: nothing else is reachable until they subscribe (the backend
      // 402s every one of these calls anyway) — skip straight to the gate.
      return;
    }
    await Promise.all([
      accountsStore.fetchAccounts(),
      transactionsStore.fetchTransactions(),
      userStore.fetchUsers(),
      netWorthStore.fetchAll(),
    ]);
    if (!accountsStore.accounts.accounts.length) {
      showOnboarding.value = true;
    }
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

// Only the transaction-dependent panels react to this (via
// transactionsStore.isRefreshing) — the rest of the dashboard stays mounted
// so paging the month pager doesn't rebuild every KPI/chart/table.
watch(
  () => transactionsStore.monthsAgo,
  () => {
    transactionsStore.fetchTransactions();
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
  <div
    id="home"
    class="page-shell"
  >
    <v-container v-if="!loading && needsSubscription">
      <SubscribeGate :lapsed="subscriptionLapsed" />
    </v-container>
    <v-container
      v-else-if="!loading"
      fluid
    >
      <header class="page-header">
        <div class="page-header__text">
          <p class="pill mb-1">
            {{ windowLabel }}
          </p>
          <h1 class="page-title">
            {{ householdStore.household?.household?.name ?? "Household" }}
          </h1>
        </div>
        <div class="page-header__actions">
          <div class="month-pager">
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              density="comfortable"
              aria-label="Previous month"
              :disabled="transactionsStore.monthsAgo >= 2"
              @click="transactionsStore.monthsAgo += 1"
            />
            <span class="month-pager__label">{{ focusMonthLabel }}</span>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              density="comfortable"
              aria-label="Next month"
              :disabled="transactionsStore.monthsAgo <= -1"
              @click="transactionsStore.monthsAgo -= 1"
            />
          </div>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-upload"
            @click="showDialog = true"
          >
            Import
          </v-btn>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-chart-line"
            @click="showAnalysisDialog = true"
          >
            {{ smAndDown ?
              "Analysis" : "Generate analysis" }}
          </v-btn>
          <v-btn
            variant="text"
            prepend-icon="mdi-tag-multiple"
            @click="showRulesDialog = true"
          >
            Rules
          </v-btn>
        </div>
      </header>

      <Dialog
        v-model="showDialog"
        title="Import Transactions"
        max-width="900"
      >
        <ImportForm @update:is-open="showDialog = $event" />
      </Dialog>
      <Dialog
        v-model="showRulesDialog"
        title="Category Rules"
      >
        <CategoryRulesManager v-if="showRulesDialog" />
      </Dialog>
      <Dialog
        v-model="showAnalysisDialog"
        title="Budget Analysis"
        max-width="800"
      >
        <BudgetAnalysisDialog
          v-if="showAnalysisDialog && authStore.user && householdStore.household"
          :user-id="authStore.user.id"
          :household-id="householdStore.household.household.id"
          @success="handleAnalysisGenerated"
        />
      </Dialog>
      <Dialog
        v-model="showOnboarding"
        title="Set up your household"
        max-width="640"
      >
        <OnboardingWizard
          v-if="showOnboarding"
          @done="showOnboarding = false"
        />
      </Dialog>

      <v-tabs
        v-model="activeTab"
        color="primary"
        class="nav-tabs mb-5"
        :grow="smAndDown"
        density="comfortable"
      >
        <v-tab
          value="overview"
          prepend-icon="mdi-view-dashboard-outline"
        >
          Overview
        </v-tab>
        <v-tab
          value="insights"
          prepend-icon="mdi-lightbulb-on-outline"
        >
          Insights
        </v-tab>
        <v-tab
          value="net-worth"
          prepend-icon="mdi-scale-balance"
        >
          Net Worth
        </v-tab>
        <v-tab
          value="transactions"
          prepend-icon="mdi-format-list-bulleted"
        >
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
      <v-window
        v-model="activeTab"
        :touch="false"
      >
        <v-window-item value="overview">
          <v-row
            dense
            :class="{ 'is-refreshing': transactionsStore.isRefreshing }"
          >
            <v-col cols="12">
              <KpiStrip />
            </v-col>
            <v-col
              v-if="netWorthStore.items.length"
              cols="12"
            >
              <NetWorthSummaryBar @details="activeTab = 'net-worth'" />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <SurfaceCard
                class="panel-card fill-height"
                padding="14px 16px"
              >
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
            <v-col
              cols="12"
              md="6"
            >
              <div class="stack gap-md stack-fill fill-height">
                <SurfaceCard
                  class="panel-card"
                  padding="14px 16px"
                >
                  <SectionHeader
                    label="Cash flow"
                    title="Net income & trend"
                  />
                  <CashFlow />
                </SurfaceCard>
                <SurfaceCard
                  class="panel-card"
                  padding="14px 16px"
                >
                  <SectionHeader
                    label="Mix"
                    title="Where the money went"
                  />
                  <SpendingMix />
                </SurfaceCard>
              </div>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="6"
            >
              <SurfaceCard
                class="fill-height"
                padding="14px 16px"
              >
                <SectionHeader
                  label="50/30/20"
                  title="Budget rule check"
                />
                <FiftyThirtyTwenty />
              </SurfaceCard>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="6"
            >
              <SurfaceCard
                class="panel-card fill-height"
                padding="14px 16px"
              >
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
          <v-row
            dense
            :class="{ 'is-refreshing': transactionsStore.isRefreshing }"
          >
            <v-col
              cols="12"
              md="8"
            >
              <SurfaceCard
                class="panel-card fill-height"
                padding="14px 16px"
              >
                <SectionHeader
                  label="Categories"
                  title="Spending by category"
                />
                <Categories />
              </SurfaceCard>
            </v-col>
            <v-col
              cols="12"
              md="4"
            >
              <SurfaceCard
                class="fill-height"
                padding="12px 14px"
              >
                <SectionHeader
                  label="Fixed costs"
                  title="Recurring charges"
                  subtitle="Charges seen 3+ months in a row at a similar amount."
                />
                <RecurringCosts />
              </SurfaceCard>
            </v-col>
          </v-row>
        </v-window-item>

        <v-window-item value="net-worth">
          <v-row dense>
            <v-col cols="12">
              <NetWorthKpis />
            </v-col>
            <v-col cols="12">
              <SurfaceCard
                class="panel-card"
                padding="14px 16px"
              >
                <SectionHeader
                  label="Trend"
                  title="Net worth over time"
                  subtitle="Monthly snapshots; balances carry forward between updates."
                />
                <NetWorthTrend />
              </SurfaceCard>
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <SurfaceCard
                class="panel-card fill-height"
                padding="14px 16px"
              >
                <SectionHeader
                  label="Assets"
                  title="What you own"
                />
                <NetWorthItems kind="asset" />
              </SurfaceCard>
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <SurfaceCard
                class="panel-card fill-height"
                padding="14px 16px"
              >
                <SectionHeader
                  label="Debts"
                  title="What you owe"
                />
                <NetWorthItems kind="debt" />
              </SurfaceCard>
            </v-col>
          </v-row>
        </v-window-item>

        <v-window-item value="transactions">
          <div
            class="stack gap-md"
            :class="{ 'is-refreshing': transactionsStore.isRefreshing }"
          >
            <SurfaceCard
              class="panel-card"
              padding="14px 16px"
            >
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
        <h1 class="text-h5 mb-2">
          Loading your dashboard…
        </h1>
        <p class="muted">
          Fetching households, accounts, and recent activity.
        </p>
      </SurfaceCard>
    </v-container>
    <v-snackbar
      v-model="checkoutSnackbar"
      timeout="5000"
    >
      {{ checkoutMessage }}
    </v-snackbar>
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
.stack-fill>* {
  flex: 1 1 0;
}

/* Page header: big title left, pager + actions right */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin: 12px 4px 18px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Segmented month pager: ‹ June 2026 › */
.month-pager {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.9);
  border-radius: var(--radius-sm);
  padding: 2px 4px;
}

.month-pager__label {
  font-weight: 700;
  font-size: 0.875rem;
  min-width: 110px;
  text-align: center;
}

/* Underline nav instead of a boxed tab card */
.nav-tabs {
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.9);
}

/* let card shadows breathe inside the window */
#home .v-window {
  padding: 2px;
  margin: -2px;
}

/* Transaction-dependent panels fade in place while the month pager triggers
   a refetch, instead of the whole dashboard unmounting. */
.is-refreshing {
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

@media (max-width: 600px) {
  #home .v-container {
    padding: 6px 4px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
    margin: 8px 4px 14px;
  }

  .month-pager {
    justify-content: space-between;
    flex: 1 1 100%;
  }

  .month-pager__label {
    flex: 1;
  }

  .nav-tabs .v-tab {
    min-width: 0;
    padding: 0 8px;
  }
}
</style>
