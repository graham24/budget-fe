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

// Stripe bounces the browser back the instant payment succeeds, but
// subscription_status is only written when the webhook lands — a separate
// request that can arrive a second or two later. Without a wait, a
// just-paid user gets dropped on the paywall. `loading` stays true for the
// duration, so they see the normal loading state rather than the gate.
const CHECKOUT_POLL_ATTEMPTS = 5;
const CHECKOUT_POLL_DELAY_MS = 1500;

onMounted(async () => {
  // Captured before the query param is cleared below.
  const returningFromCheckout = route.query.checkout === "success";

  // Returning from Stripe Checkout — surface the result, then drop the
  // query param so a refresh doesn't re-show it.
  if (returningFromCheckout) {
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
    if (returningFromCheckout) {
      for (
        let attempt = 0;
        attempt < CHECKOUT_POLL_ATTEMPTS && needsSubscription.value;
        attempt++
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, CHECKOUT_POLL_DELAY_MS)
        );
        await householdStore.fetchHousehold();
      }
      if (needsSubscription.value) {
        // Webhook still hasn't landed. The payment did go through, so don't
        // imply otherwise — but don't promise access we can't show either.
        checkoutMessage.value =
          "Payment received — still finishing setup. Refresh in a moment.";
      }
    }
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
      <header class="board-head">
        <div class="board-head__pager">
          <div
            class="month-pager"
            :title="windowLabel"
          >
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              density="comfortable"
              aria-label="Previous month"
              :disabled="transactionsStore.monthsAgo >= 2"
              @click="transactionsStore.monthsAgo += 1"
            />
            <span class="month-pager__label">
              <v-icon
                icon="mdi-calendar-month-outline"
                size="16"
                color="primary"
              />
              {{ focusMonthLabel }}
            </span>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              density="comfortable"
              aria-label="Next month"
              :disabled="transactionsStore.monthsAgo <= -1"
              @click="transactionsStore.monthsAgo -= 1"
            />
          </div>
        </div>
        <div class="board-head__actions">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-tray-arrow-down"
            @click="showDialog = true"
          >
            Import
          </v-btn>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-flash-outline"
            @click="showAnalysisDialog = true"
          >
            {{ smAndDown ? "Analysis" : "Generate analysis" }}
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

      <!-- underline tabs on desktop; a fixed bottom bar on phones, where
           thumbs live at the bottom of the screen -->
      <v-tabs
        v-model="activeTab"
        color="primary"
        class="nav-tabs"
        :class="smAndDown ? 'nav-tabs--bottom' : 'mb-5'"
        :grow="smAndDown"
        :stacked="smAndDown"
        :hide-slider="smAndDown"
        :density="smAndDown ? 'default' : 'comfortable'"
      >
        <v-tab
          value="overview"
          prepend-icon="mdi-view-dashboard-outline"
        >
          Overview
        </v-tab>
        <v-tab
          value="net-worth"
          prepend-icon="mdi-scale-balance"
        >
          Net Worth
        </v-tab>
        <v-tab
          value="insights"
          prepend-icon="mdi-lightbulb-on-outline"
        >
          Insights
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
          <div
            class="board"
            :class="{ 'is-refreshing': transactionsStore.isRefreshing }"
          >
            <KpiStrip />
            <NetWorthSummaryBar
              v-if="netWorthStore.items.length"
              @details="activeTab = 'net-worth'"
            />

            <!-- full width: the sparkline is the one chart that wants room -->
            <SurfaceCard class="panel-card">
              <SectionHeader
                label="Cash flow"
                title="Net income & trend"
              />
              <CashFlow />
            </SurfaceCard>

            <div class="band">
              <SurfaceCard class="panel-card">
                <SectionHeader
                  label="Mix"
                  title="Where the money went"
                />
                <SpendingMix />
              </SurfaceCard>
              <SurfaceCard>
                <SectionHeader
                  label="50/30/20"
                  title="Budget rule check"
                />
                <FiftyThirtyTwenty />
              </SurfaceCard>
            </div>

            <!-- the written debrief, then the two reference panels under it -->
            <SurfaceCard
              class="analysis-card"
              padding="26px 30px"
            >
              <SectionHeader
                label="AI Insights"
                title="Budget Analysis"
                subtitle="AI-powered analysis of your spending patterns and recommendations."
              />
              <div class="analysis-card__rule" />
              <BudgetAnalysisCard
                v-if="householdStore.household"
                :household-id="householdStore.household.household.id"
                :refresh-trigger="analysisRefreshTrigger"
                hide-targets-section
              />
            </SurfaceCard>

            <div class="band">
              <SurfaceCard class="panel-card">
                <SectionHeader
                  label="Targets"
                  title="Budget vs. actual"
                  subtitle="Focus-month spending against your monthly limits."
                />
                <BudgetTargets />
              </SurfaceCard>
              <SurfaceCard class="panel-card">
                <SectionHeader
                  label="Fixed costs"
                  title="Recurring charges"
                  subtitle="Charges seen 3+ months in a row at a similar amount."
                />
                <RecurringCosts />
              </SurfaceCard>
            </div>
          </div>
        </v-window-item>

        <v-window-item value="net-worth">
          <div class="board">
            <NetWorthKpis />
            <SurfaceCard class="panel-card">
              <SectionHeader
                label="Trend"
                title="Net worth over time"
                subtitle="Monthly snapshots; balances carry forward between updates."
              />
              <NetWorthTrend />
            </SurfaceCard>
            <div class="band">
              <SurfaceCard class="panel-card">
                <SectionHeader
                  label="Assets"
                  title="What you own"
                />
                <NetWorthItems kind="asset" />
              </SurfaceCard>
              <SurfaceCard class="panel-card">
                <SectionHeader
                  label="Debts"
                  title="What you owe"
                />
                <NetWorthItems kind="debt" />
              </SurfaceCard>
            </div>
          </div>
        </v-window-item>

        <v-window-item value="insights">
          <div
            class="board"
            :class="{ 'is-refreshing': transactionsStore.isRefreshing }"
          >
            <SurfaceCard class="panel-card">
              <SectionHeader
                label="Categories"
                title="Where the money went"
                subtitle="Three months side by side. Drill into a category for its subcategories, then into a subcategory for the transactions behind all three months."
              />
              <Categories />
            </SurfaceCard>
          </div>
        </v-window-item>

        <v-window-item value="transactions">
          <div
            class="board"
            :class="{ 'is-refreshing': transactionsStore.isRefreshing }"
          >
            <SurfaceCard class="panel-card">
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

/* The desktop shell from the design: one centred measure, generous
   bottom padding, everything on a 16px rhythm. */
#home .v-container {
  max-width: var(--page-max);
  padding: 24px 32px 44px;
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

/* Tab content: a vertical stack of full-width cards and two-column bands */
.board {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

.band {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap);
  align-items: stretch;
}

/* Control row above the tabs: month pager left, page actions right */
.board-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.board-head__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Segmented month pager: ‹ 📅 June 2026 › */
.month-pager {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 2px 4px;
}

.month-pager__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13.5px;
  min-width: 132px;
  justify-content: center;
}

/* Underline nav instead of a boxed tab card */
.nav-tabs {
  border-bottom: 1px solid var(--hairline);
}

/* Phone: the same tabs become a fixed bottom bar. Icons over labels, a
   hairline on top instead of the bottom, and the home-indicator inset added
   to the padding so the labels clear it. */
.nav-tabs--bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  background: rgb(var(--v-theme-surface));
  border-bottom: none;
  border-top: 1px solid var(--hairline);
  box-shadow: 0 -1px 2px rgba(16, 24, 40, 0.05);
  padding: 8px 4px 4px;
  padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));
}
.nav-tabs--bottom .v-tab {
  min-width: 0;
  min-height: 52px;
  padding: 0 4px;
  font-size: 11px;
  letter-spacing: 0;
  text-transform: none;
}
.nav-tabs--bottom .v-tab .v-icon {
  margin-bottom: 2px;
}

/* Full-width analysis card: prose at a fixed measure, table on the right */
.analysis-card__rule {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.8);
  margin: 6px 0 22px;
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

@media (max-width: 960px) {
  .band {
    grid-template-columns: 1fr;
  }
  /* bottom padding clears the fixed tab bar */
  #home .v-container {
    padding: 18px 20px calc(96px + env(safe-area-inset-bottom, 0px));
  }
}

@media (max-width: 600px) {
  #home .v-container {
    padding: 12px 12px calc(92px + env(safe-area-inset-bottom, 0px));
  }

  .board,
  .band {
    gap: 12px;
  }

  .board-head {
    align-items: stretch;
    flex-direction: column;
  }

  .month-pager {
    justify-content: space-between;
  }

  .month-pager__label {
    flex: 1;
  }

  .board-head__actions .v-btn {
    flex: 1;
  }

}
</style>
