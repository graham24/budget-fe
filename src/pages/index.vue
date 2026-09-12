<template>
  <div class="landing-root">
    <header class="nav">
      <div class="wrap nav-in">
        <a
          class="mark"
          href="#top"
        ><span class="mark-glyph"><svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
        ><path d="M4 18h4M4 12h9M4 6h13" /></svg></span>Debrief</a>
        <div class="nav-links">
          <a href="#overview">Overview</a>
          <a href="#insights">Insights</a>
          <a href="#networth">Net worth</a>
          <a href="#transactions">Transactions</a>
        </div>
        <a
          class="btn btn-ghost"
          href="#signin"
          @click.prevent="loginDialog = true"
        >Log in</a>
      </div>
    </header>

    <main id="top">
      <!-- HERO -->
      <section class="hero">
        <div class="wrap hero-grid">
          <div>
            <p class="eyebrow">
              Household budgeting
            </p>
            <h1>See where your money goes, <em>then decide</em>.</h1>
            <p class="hero-sub">
              Debrief turns three months of your household's real spending into a clear
              picture: what you're keeping, what's worth celebrating, and where a small
              change frees up real money. Plans you make from facts tend to stick.
            </p>
            <div class="hero-cta">
              <a
                class="btn btn-key btn-lg"
                href="#signin"
                @click.prevent="loginDialog = true"
              >Get started</a>
              <a
                class="btn btn-ghost btn-lg"
                href="#signin"
                @click.prevent="handleDemoLogin"
              >View the demo</a>
            </div>
            <p class="hero-note">
              Free for {{ TRIAL_DAYS }} days, no card required — then $4.99/mo.
              Sign in with Google, no passwords to manage.
            </p>
          </div>

          <!-- signature: the written analysis — the real BudgetAnalysisCard,
               fed by the read-only demo account (see startPreview above) -->
          <div class="analysis">
            <div class="an-head">
              <p class="card-label">
                Your monthly debrief
              </p>
              <div class="an-tags">
                <span class="tag on">Live demo data</span>
              </div>
            </div>
            <div class="an-body">
              <BudgetAnalysisCard
                v-if="householdId"
                :household-id="householdId"
                max-height="420px"
              />
              <p
                v-else
                class="an-loading"
              >
                Loading the demo household's analysis…
              </p>
            </div>
            <div class="an-foot">
              <span>Rewrites itself when your <b>numbers or targets</b> change</span>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB STRIP -->
      <section class="strip">
        <div class="wrap strip-in">
          <span><i /> Overview</span>
          <span><i /> Insights</span>
          <span><i /> Net worth</span>
          <span><i /> Transactions</span>
          <span style="color: var(--text-3)">Four screens. One clear picture.</span>
        </div>
      </section>

      <!-- OVERVIEW -->
      <section
        id="overview"
        class="sec"
      >
        <div class="wrap">
          <div class="sec-head">
            <p class="eyebrow">
              Overview
            </p>
            <h2>Your month in four numbers you can act on</h2>
            <p>Income, spending, what you kept, and how that compares to a healthy 50/30/20 split — enough to know exactly where you stand before you make a single decision.</p>
          </div>

          <div class="feat">
            <div class="feat-copy">
              <p class="feat-tag">
                Headline numbers
              </p>
              <h3>Watch your savings rate climb month over month</h3>
              <p>Four figures at the top of every month, each with a month-over-month change, so progress is visible the moment you make it.</p>
              <ul class="feat-list">
                <li>A savings rate showing exactly what share of your income you kept</li>
                <li>A 12-month trend you can switch between net, income, needs, and wants to see the shape of a year</li>
                <li>A spending mix that shows at a glance which categories your money is really going to</li>
                <li>Net worth on the same screen, so a good month in cash flow shows up in what you're building</li>
              </ul>
            </div>
            <div class="card">
              <p class="card-label">
                This month — live demo data
              </p>
              <KpiStrip />
              <div class="rulecheck">
                <p
                  class="card-label"
                  style="margin-bottom: 12px"
                >
                  50/30/20 check
                </p>
                <FiftyThirtyTwenty />
              </div>
            </div>
          </div>

          <div class="feat feat-flip">
            <div class="feat-copy">
              <p class="feat-tag">
                Targets
              </p>
              <h3>Set a plan per category, then watch yourself hit it</h3>
              <p>Pick the categories that matter to you and set a number you believe in — informed by what you actually spend, not a guess. Progress sits right on the overview, updating as the month goes.</p>
              <ul class="feat-list">
                <li>One target per category, editable inline as your plans change</li>
                <li>Percentage used next to every bar, so a category on track looks like it</li>
                <li>Suggested starting numbers for categories you haven't set yet, drawn from your own history</li>
                <li>Change a target and your next debrief updates to match the new plan</li>
              </ul>
            </div>
            <div class="card">
              <p class="card-label">
                Plan vs actual — live demo data
              </p>
              <p class="card-title">
                This month against the demo household's plan
              </p>
              <BudgetTargets
                v-if="householdId"
                read-only
              />
              <p
                v-else
                class="an-loading"
              >
                Loading the demo household's targets…
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- INSIGHTS -->
      <section
        id="insights"
        class="sec"
        style="padding-top: 0"
      >
        <div class="wrap">
          <div class="sec-head">
            <p class="eyebrow">
              Insights
            </p>
            <h2>Three months side by side, so patterns stop being a mystery</h2>
            <p>Every category across the last three months with a running average, grouped into earnings, must-haves, and nice-to-haves — the numbers you need to build a plan you can actually keep.</p>
          </div>

          <div class="feat feat-stack">
            <div class="feat-copy">
              <p class="feat-tag">
                Spending by category
              </p>
              <h3>Know what's essential and what's your choice</h3>
              <p>Every expense is marked essential or optional as it comes in, so you can see how much of your month is genuinely yours to direct — and put more of it where you want it.</p>
              <ul class="feat-list">
                <li>Three months in columns with a fourth column for the average</li>
                <li>Expand any category to see exactly what's inside it</li>
                <li>Transaction counts next to each category, so one big purchase never gets mistaken for a habit</li>
                <li>Transfers and card payments kept out of spending totals, so your numbers reflect real spending</li>
              </ul>
            </div>
            <div class="card">
              <p class="tbl-cap">
                Live demo data
              </p>
              <Categories />
            </div>
          </div>

          <div class="feat feat-flip">
            <div class="feat-copy">
              <p class="feat-tag">
                Recurring charges
              </p>
              <h3>Spot the subscriptions you meant to cancel</h3>
              <p>Debrief finds every charge that lands three or more months in a row at a similar amount and totals them into one monthly baseline. It's the fastest money most households find — cancel two things you'd forgotten and the savings start immediately.</p>
              <ul class="feat-list">
                <li>Shows how many months running each charge has appeared</li>
                <li>Highlights any recurring charge that quietly went up in price</li>
                <li>Catches subscriptions billed under names you'd never think to search for</li>
                <li>Gives you one number for what your household costs to run — the baseline every plan starts from</li>
              </ul>
            </div>
            <div class="card">
              <p class="card-label">
                Fixed costs — live demo data
              </p>
              <RecurringCosts />
            </div>
          </div>
        </div>
      </section>

      <!-- NET WORTH -->
      <section
        id="networth"
        class="sec"
        style="padding-top: 0"
      >
        <div class="wrap">
          <div class="sec-head">
            <p class="eyebrow">
              Net worth
            </p>
            <h2>Watch the months add up to something</h2>
            <p>A good month is worth noticing. A year of them is worth celebrating — and net worth is where you see it accumulate.</p>
          </div>

          <div class="feat">
            <div class="feat-copy">
              <p class="feat-tag">
                Assets and debts
              </p>
              <h3>Everything you own and owe, in one growing picture</h3>
              <p>Add anything you own or owe. Because debts carry their real interest rate and minimum payment, the written analysis can tell you which one to clear first and what that saves you — using your numbers, not a rule of thumb.</p>
              <ul class="feat-list">
                <li>A 12-month trend you can view as net worth, assets, or debts — watch the lines separate</li>
                <li>Balances on linked accounts update themselves every night, so progress shows up without effort</li>
                <li>Manually tracked items show an "as of" date and a gentle nudge when it's time to refresh them</li>
                <li>Each month keeps its own snapshot, so your history is real history you can look back on</li>
              </ul>
            </div>
            <div class="card">
              <p class="card-label">
                Live demo data
              </p>
              <NetWorthKpis />
              <NetWorthTrend />
              <p
                class="card-label"
                style="margin: 16px 0 4px"
              >
                What you owe
              </p>
              <NetWorthItems
                kind="debt"
                read-only
              />
            </div>
          </div>
        </div>
      </section>

      <!-- TRANSACTIONS -->
      <section
        id="transactions"
        class="sec"
        style="padding-top: 0"
      >
        <div class="wrap">
          <div class="sec-head">
            <p class="eyebrow">
              Transactions
            </p>
            <h2>Every transaction, already sorted for you</h2>
            <p>Income, essentials, discretionary spending, and transfers in four clear tables — searchable, editable in place, and yours to export whenever you like.</p>
          </div>

          <div class="feat">
            <div class="feat-copy">
              <p class="feat-tag">
                Getting money in
              </p>
              <h3>Connect once and your spending keeps itself current</h3>
              <p>Link your accounts and new transactions arrive on their own each night — no monthly data-entry session. Prefer to keep banks disconnected? Drop in a CSV export instead; the formats your banks use are already handled.</p>
              <ul class="feat-list">
                <li>Ready-made support for Wells Fargo, Chase, US Bank, Apple Card and Savings</li>
                <li>An import-now button whenever you want today's numbers immediately</li>
                <li>Repeat imports never double up, and a genuine second charge goes through in one click</li>
                <li>A per-account, per-month grid confirming everything arrived, so you can trust the totals you're planning from</li>
              </ul>
            </div>
            <div class="card">
              <p class="card-label">
                Import status — live demo data
              </p>
              <p class="card-title">
                Everything accounted for
              </p>
              <TransactionCountTable />
            </div>
          </div>

          <div class="feat feat-flip feat-stack">
            <div class="feat-copy">
              <p class="feat-tag">
                Keeping it tidy
              </p>
              <h3>Categories arrive filled in — and your rules always win</h3>
              <p>New transactions arrive already categorized, sub-categorized, and marked essential or optional, which means the picture is ready the moment you open it. Where you want a guaranteed answer, write a rule — your rules run first and are never overridden.</p>
              <ul class="feat-list">
                <li>A short review queue gathers the handful worth a second look, with a count on the tab</li>
                <li>Rules match on any part of a description, so one rule covers every variation of a payee</li>
                <li>Search and recategorize without leaving the table</li>
                <li>Internal transfers and card payments are recognized as transfers, so they never inflate your spending</li>
                <li>Export to CSV any time you want your own copy of everything</li>
              </ul>
            </div>
            <div class="card">
              <p class="card-label">
                Live demo data — read-only preview
              </p>
              <Transactions read-only />
            </div>
          </div>
        </div>
      </section>

      <!-- SMALL FEATURES -->
      <section
        class="sec"
        style="padding-top: 0"
      >
        <div class="wrap">
          <div class="sec-head">
            <p class="eyebrow">
              Also included
            </p>
            <h2>The details that make it easy to keep up</h2>
          </div>
          <div class="grid">
            <div class="cell">
              <div class="cell-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                ><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
                  cx="9"
                  cy="7"
                  r="4"
                /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h3>One household, one picture</h3>
              <p>Invite your partner or roommates by email. Accounts are tagged with whose they are, and everyone works from the same targets, categories, and totals — one shared plan instead of two guesses.</p>
            </div>
            <div class="cell">
              <div class="cell-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                ><path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6z" /></svg>
              </div>
              <h3>Sign in with Google</h3>
              <p>No password to create, forget, or reuse from another site. Nothing about your Google account is kept beyond identifying you.</p>
            </div>
            <div class="cell">
              <div class="cell-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                ><circle
                  cx="12"
                  cy="12"
                  r="4"
                /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>
              </div>
              <h3>Light and dark</h3>
              <p>A full light theme and a full dark one, switchable from the header whenever the room changes.</p>
            </div>
            <div class="cell">
              <div class="cell-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                ><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
              </div>
              <h3>Always know your data is complete</h3>
              <p>Bank connections expire eventually. When one needs renewing you get a clear notice you can dismiss, so the numbers you plan from are always the full picture.</p>
            </div>
            <div class="cell">
              <div class="cell-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                ><path d="M12 3v13" /><path d="m7 12 5 5 5-5" /><path d="M5 21h14" /></svg>
              </div>
              <h3>Your data, portable</h3>
              <p>Every transaction table exports to CSV, ready for a spreadsheet, an accountant, or your own archive.</p>
            </div>
            <div class="cell">
              <div class="cell-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                ><rect
                  x="3"
                  y="11"
                  width="18"
                  height="10"
                  rx="2"
                /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <h3>Credentials stay private</h3>
              <p>Bank connections and API keys are encrypted and never sent back out — you see the last four characters, just enough to confirm which one is set.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- HOW -->
      <section
        id="how"
        class="sec"
        style="padding-top: 0"
      >
        <div class="wrap">
          <div class="sec-head">
            <p class="eyebrow">
              Getting set up
            </p>
            <h2>Ten minutes now, clarity from here on</h2>
          </div>
          <div class="steps">
            <div class="step">
              <span class="step-n">01</span>
              <h3>Sign in and name your household</h3>
              <p>One click with Google and your household exists. Add your partner or roommates now or whenever you're ready.</p>
            </div>
            <div class="step">
              <span class="step-n">02</span>
              <h3>Add your accounts</h3>
              <p>Link a bank for nightly syncing, or add the account and upload a CSV. Mix both freely — start with one account if you'd rather ease in.</p>
            </div>
            <div class="step">
              <span class="step-n">03</span>
              <h3>Confirm a few categories, then read your first debrief</h3>
              <p>Skim the review queue on your first import — your choices teach it, and everything after arrives sorted your way. Then generate your first debrief and read three months of your household explained back to you.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- DATA -->
      <section
        id="data"
        class="sec"
        style="padding-top: 0"
      >
        <div class="wrap">
          <div class="data-wrap">
            <div>
              <p class="eyebrow">
                Your data
              </p>
              <h2 style="margin-top: 13px">
                Your numbers, in your hands
              </h2>
              <p style="margin-top: 15px; color: var(--text-2)">
                Your transactions are never shared, sold, or used to advertise to you.
                They exist for one purpose: answering your household's questions about
                your own money.
              </p>
            </div>
            <ul class="data-list">
              <li>
                <h3>Credentials stay encrypted</h3>
                <p>Bank connections and API keys are encrypted in the database and never sent back out — you only ever see the last four characters to confirm which one is set.</p>
              </li>
              <li>
                <h3>Private to your household</h3>
                <p>Every request is checked against your membership, so your accounts, transactions, and balances are visible to your household and no one else.</p>
              </li>
              <li>
                <h3>Yours to take with you</h3>
                <p>Export every table to CSV at any time. Your history belongs to you, whatever you decide to do with it.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        id="signin"
        class="cta-final"
      >
        <div class="wrap">
          <p class="eyebrow">
            Start now
          </p>
          <h2>Get your first debrief this week</h2>
          <p>Connect one account and you'll have three months of sorted spending, your real monthly baseline, and a plan worth following — before you've finished your coffee. Your first {{ TRIAL_DAYS }} days are free.</p>
          <a
            class="btn btn-key btn-lg"
            href="#signin"
            @click.prevent="loginDialog = true"
          >Start {{ TRIAL_DAYS }} days free</a>
          <p class="fine">
            No card required. Then $4.99/mo. Sign in with Google — no
            passwords to manage.
          </p>
        </div>
      </section>
    </main>

    <footer>
      <div class="wrap foot-in">
        <span>&copy; {{ year }} Debrief</span>
        <nav>
          <a href="#overview">Overview</a>
          <a href="#insights">Insights</a>
          <a href="#networth">Net worth</a>
          <a href="#transactions">Transactions</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </footer>

    <v-dialog
      v-model="loginDialog"
      max-width="420"
      attach=".landing-root"
    >
      <div class="card login-card">
        <p class="eyebrow">
          Welcome
        </p>
        <h3>Sign in to Debrief</h3>
        <p class="login-sub">
          Use your Google account to sign in or create a new household.
        </p>
        <p
          v-if="loginError"
          class="login-error"
        >
          {{ loginError }}
        </p>
        <div class="google-login-wrap">
          <GoogleLogin :callback="handleGoogleLogin" />
        </div>
        <div class="demo-divider">
          <span>or</span>
        </div>
        <button
          type="button"
          class="btn btn-ghost demo-btn"
          @click="handleDemoLogin"
        >
          View the demo
        </button>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { GoogleLogin } from "vue3-google-login";
import { useAuthStore } from "@/stores/auth";
import { useHouseholdStore } from "@/stores/household";
import { useAccountStore } from "@/stores/account";
import { useTransactionStore } from "@/stores/transaction";
import { useUserStore } from "@/stores/user";
import { useNetWorthStore } from "@/stores/netWorth";
import { TRIAL_DAYS } from "@/utils/billing";
import { resetHouseholdStores } from "@/utils/session";
import BudgetAnalysisCard from "@/components/BudgetAnalysisCard.vue";
import KpiStrip from "@/components/KpiStrip.vue";
import FiftyThirtyTwenty from "@/components/FiftyThirtyTwenty.vue";
import BudgetTargets from "@/components/BudgetTargets.vue";
import Categories from "@/components/Categories.vue";
import RecurringCosts from "@/components/RecurringCosts.vue";
import NetWorthKpis from "@/components/NetWorthKpis.vue";
import NetWorthTrend from "@/components/NetWorthTrend.vue";
import NetWorthItems from "@/components/NetWorthItems.vue";
import TransactionCountTable from "@/components/TransactionCountTable.vue";
import Transactions from "@/components/Transactions.vue";

const router = useRouter();
const authStore = useAuthStore();
const householdStore = useHouseholdStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionStore();
const userStore = useUserStore();
const netWorthStore = useNetWorthStore();

const loginDialog = ref(false);
const loginError = ref(null);
const year = computed(() => new Date().getFullYear());
const householdId = computed(() => householdStore.household?.household?.id ?? null);

async function handleGoogleLogin(response) {
  loginError.value = null;
  try {
    await authStore.loginWithGoogle(response.credential);
    // The preview above filled these stores with the demo household's data;
    // clear it so the dashboard starts empty and refetches as this user.
    resetHouseholdStores();
    loginDialog.value = false;
    router.push("/dashboard");
  } catch (error) {
    loginError.value = error.response?.data?.message || "Login failed";
  }
}

async function handleDemoLogin() {
  loginError.value = null;
  try {
    await authStore.loginAsDemo();
    resetHouseholdStores();
    loginDialog.value = false;
    router.push("/dashboard");
  } catch (error) {
    // Surface the failure in the login dialog (e.g. demo data not seeded yet)
    loginDialog.value = true;
    loginError.value = error.response?.data?.message || "Demo is unavailable right now";
  }
}

// Powers the live component previews below (KpiStrip, BudgetAnalysisCard,
// Categories, etc. — the actual dashboard components, reading from the
// same Pinia stores dashboard.vue uses) without a real login: authStore
// .startPreview() authenticates as the read-only demo account in memory
// only (never touches localStorage), so App.vue keeps the marketing chrome
// hidden and a page refresh cleanly drops back to a logged-out landing page.
onMounted(async () => {
  try {
    await authStore.startPreview();
    await householdStore.fetchHousehold();
    await Promise.all([
      accountStore.fetchAccounts(),
      transactionStore.fetchTransactions(),
      userStore.fetchUsers(),
      netWorthStore.fetchAll(),
    ]);
  } catch (error) {
    // Demo data not seeded, or the API is unreachable — preview sections
    // just show their normal empty states, the marketing copy still reads fine.
    console.error("Demo preview unavailable:", error);
  }
});

onUnmounted(() => {
  authStore.endPreview();
});
</script>

<style scoped>
/* Fonts and the shared design tokens both come from src/styles/tokens.css —
   this page is inside the same app shell, so it must not re-import either.
   The local names below are thin aliases onto those tokens and the active
   Vuetify theme, so the landing page tracks the light/dark toggle and any
   token change lands here too. */
.landing-root {
  --bg: rgb(var(--v-theme-background));
  --bg-2: rgb(var(--v-theme-surface-variant));
  --card: rgb(var(--v-theme-surface));
  --card-2: rgb(var(--v-theme-surface-variant));
  --rule: var(--hairline);
  --rule-soft: var(--hairline-soft);
  --text: rgb(var(--v-theme-on-background));
  --text-2: rgba(var(--v-theme-on-background), 0.65);
  --text-3: rgba(var(--v-theme-on-background), 0.5);
  --blue: rgb(var(--v-theme-primary));
  --blue-dim: rgba(var(--v-theme-primary), 0.35);
  --on-blue: rgb(var(--v-theme-on-primary));
  --blue-darken: rgb(var(--v-theme-primary-darken-1));
  --green: rgb(var(--v-theme-success));
  --red: rgb(var(--v-theme-error));
  --amber: rgb(var(--v-theme-warning));

  --display: var(--font-display);
  --body: var(--font-sans);
  --mono: var(--font-mono);

  /* deliberately narrower than the app shell's --page-max: this page is
     prose-led, and the wider measure broke the hero headline's line breaks */
  --land-wrap: 1200px;
  --land-pad: clamp(20px, 5vw, 48px);

  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  position: relative;
}
.wrap {
  width: 100%;
  max-width: var(--land-wrap);
  margin: 0 auto;
  padding: 0 var(--land-pad);
  position: relative;
  z-index: 1;
}
.landing-root h1,
.landing-root h2,
.landing-root h3,
.landing-root h4 {
  font-family: var(--display);
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.05;
  margin: 0;
  color: var(--text);
}
.landing-root h1 {
  font-size: clamp(2.45rem, 5.6vw, 4.05rem);
  font-weight: 800;
}
.landing-root h2 {
  font-size: clamp(1.8rem, 3.4vw, 2.6rem);
}
.landing-root h3 {
  font-size: 1.14rem;
  letter-spacing: -0.012em;
  line-height: 1.28;
}
.landing-root p {
  margin: 0;
}
.landing-root a {
  color: inherit;
}
.eyebrow {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.19em;
  text-transform: uppercase;
  color: var(--blue);
}
.mono {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}
.pos {
  color: var(--green);
}
.neg {
  color: var(--red);
}

/* ---------- nav ---------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--rule);
}
.nav-in {
  display: flex;
  align-items: center;
  height: 66px;
}
.mark {
  display: flex;
  align-items: center;
  gap: 11px;
  font-family: var(--display);
  font-weight: 700;
  font-size: 1.12rem;
  letter-spacing: -0.02em;
  text-decoration: none;
}
/* the same tinted tile as the app's top-bar brand mark */
.mark-glyph {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-xs);
  flex: none;
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  display: grid;
  place-items: center;
  color: var(--blue);
}
.mark-glyph svg {
  display: block;
}
.nav-links {
  display: flex;
  gap: 24px;
  margin-left: auto;
  font-size: 0.92rem;
  color: var(--text-2);
}
.nav-links a {
  text-decoration: none;
}
.nav-links a:hover {
  color: var(--text);
}
.nav .btn {
  margin-left: 22px;
}
@media (max-width: 820px) {
  .nav-links {
    display: none;
  }
  .nav .btn {
    margin-left: auto;
  }
}

/* ---------- buttons ---------- */
.landing-root .btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--body);
  font-size: 0.96rem;
  font-weight: 600;
  padding: 11px 19px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.16s, background 0.16s, border-color 0.16s;
}
.landing-root .btn-key {
  background: var(--blue);
  color: var(--on-blue);
  box-shadow: var(--shadow-sm);
}
.landing-root .btn-key:hover {
  background: var(--blue-darken);
}
.landing-root .btn-ghost {
  border-color: var(--rule);
  color: var(--text-2);
}
.landing-root .btn-ghost:hover {
  border-color: var(--blue-dim);
  color: var(--text);
}
.landing-root .btn-lg {
  padding: 14px 24px;
  font-size: 1.02rem;
}

/* ---------- hero ---------- */
.hero {
  padding: clamp(52px, 8vw, 96px) 0 clamp(44px, 6vw, 72px);
}
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(34px, 5vw, 64px);
  align-items: center;
}
.hero h1 {
  margin: 18px 0 0;
}
.hero h1 em {
  font-style: normal;
  color: var(--blue);
}
.hero-sub {
  margin-top: 20px;
  font-size: 1.08rem;
  color: var(--text-2);
  max-width: 46ch;
}
.hero-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}
.hero-note {
  margin-top: 15px;
  font-size: 0.86rem;
  color: var(--text-3);
}
@media (max-width: 960px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

/* ---------- generic card ---------- */
.card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: none;
}
.card-label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 6px;
  font-weight: 500;
}
/* the embedded dashboard components bring their own eyebrow + title, so the
   card's own label needs room rather than butting straight into theirs */
.card-label + .kpi-strip-wrap,
.card-label + .section-header,
.card-label + .rec {
  margin-top: 16px;
}
.card-title {
  font-family: var(--display);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
  margin-bottom: 14px;
}

/* ---------- signature: the analysis ---------- */
.analysis {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.an-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 16px 20px;
  border-bottom: 1px solid var(--rule-soft);
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.an-head .card-label {
  margin: 0;
}
.an-tags {
  margin-left: auto;
  display: flex;
  gap: 7px;
}
.tag {
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--rule);
  color: var(--text-3);
  white-space: nowrap;
}
.tag.on {
  border-color: rgba(var(--v-theme-primary), 0.32);
  color: var(--blue);
  background: rgba(var(--v-theme-primary), 0.1);
}
.an-body {
  padding: 20px;
}
.an-body h4 {
  font-family: var(--display);
  font-size: 1.22rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  margin: 0 0 4px;
}
.an-when {
  font-family: var(--mono);
  font-size: 0.7rem;
  color: var(--text-3);
  margin-bottom: 16px;
}
.an-sec {
  margin-bottom: 16px;
}
.an-sec:last-child {
  margin-bottom: 0;
}
.an-sec .h {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 6px;
  font-weight: 500;
}
.an-sec p {
  font-size: 0.94rem;
  color: var(--text-2);
}
.an-sec p + p {
  margin-top: 9px;
}
.an-sec strong {
  color: var(--text);
  font-weight: 600;
}
.an-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 13px 20px;
  border-top: 1px solid var(--rule-soft);
  background: rgb(var(--v-theme-surface-variant));
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--text-3);
}
.an-foot b {
  color: var(--text-2);
  font-weight: 500;
}
.an-loading {
  color: var(--text-3);
  font-size: 0.9rem;
}

/* ---------- tab strip ---------- */
.strip {
  border-top: 1px solid var(--rule-soft);
  border-bottom: 1px solid var(--rule-soft);
  background: rgba(var(--v-theme-on-surface), 0.012);
}
.strip-in {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 26px;
  padding: 18px 0;
  font-family: var(--mono);
  font-size: 0.79rem;
  color: var(--text-2);
  letter-spacing: 0.03em;
}
.strip-in span {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}
.strip-in i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--blue);
  flex: none;
  display: inline-block;
}

/* ---------- sections ---------- */
.sec {
  padding: clamp(56px, 7.5vw, 92px) 0;
}
.sec-head {
  max-width: 58ch;
  margin-bottom: clamp(32px, 4.5vw, 50px);
}
.sec-head h2 {
  margin-top: 13px;
}
.sec-head p {
  margin-top: 15px;
  color: var(--text-2);
  font-size: 1.05rem;
}

.feat {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.06fr);
  gap: clamp(26px, 4.5vw, 60px);
  align-items: center;
  padding: clamp(32px, 4.5vw, 52px) 0;
  border-top: 1px solid var(--rule-soft);
}
.feat:first-of-type {
  border-top: 0;
  padding-top: 0;
}
.feat-flip .feat-copy {
  order: 2;
}
/* wide-table demos (Categories, Transactions) need the full wrap width
   to avoid clipping columns — stack copy above the card instead of
   splitting the row into two narrow columns */
.feat-stack {
  grid-template-columns: 1fr;
}
.feat-stack.feat-flip .feat-copy {
  order: 0;
}
.feat-stack .card {
  max-width: 100%;
}
.feat-tag {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.19em;
  text-transform: uppercase;
  color: var(--text-3);
  font-weight: 500;
}
.feat-copy h3 {
  font-size: clamp(1.32rem, 2.3vw, 1.7rem);
  margin: 11px 0 0;
}
.feat-copy p {
  margin-top: 13px;
  color: var(--text-2);
}
.feat-list {
  margin: 17px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 9px;
  font-size: 0.95rem;
  color: var(--text-2);
}
.feat-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.feat-list li::before {
  content: "";
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--blue);
  margin-top: 0.62em;
}
@media (max-width: 920px) {
  .feat {
    grid-template-columns: 1fr;
    gap: 26px;
  }
  .feat-flip .feat-copy {
    order: 0;
  }
}

/* ---------- overview visual ---------- */
.kpi {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.kpi div {
  padding: 12px 13px;
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  background: rgba(var(--v-theme-on-surface), 0.018);
}
.kpi span {
  display: block;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 5px;
  font-weight: 500;
}
.kpi b {
  font-family: var(--mono);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  display: block;
}
.kpi em {
  font-style: normal;
  font-family: var(--mono);
  font-size: 0.68rem;
  color: var(--text-3);
  display: block;
  margin-top: 3px;
}

.rulecheck {
  padding-top: 16px;
  border-top: 1px solid var(--rule-soft);
}
.rc-row {
  margin-bottom: 13px;
}
.rc-row:last-child {
  margin-bottom: 0;
}
.rc-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.84rem;
  margin-bottom: 6px;
}
.rc-top .mono {
  font-size: 0.78rem;
  color: var(--text-3);
}
.track {
  position: relative;
  height: 7px;
  border-radius: 999px;
  background: var(--card-2);
}
.fill {
  height: 100%;
  border-radius: 999px;
  background: var(--blue);
}
.fill.g {
  background: var(--green);
}
.fill.r {
  background: var(--red);
}
.tick {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  background: var(--text-2);
  opacity: 0.6;
  border-radius: 2px;
}
.rc-note {
  margin-top: 14px;
  font-size: 0.8rem;
  color: var(--text-3);
}

/* ---------- insights visual: category table ---------- */
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.tbl th {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  font-weight: 500;
  text-align: right;
  padding: 0 0 9px;
  border-bottom: 1px solid var(--rule);
}
.tbl th:first-child {
  text-align: left;
}
.tbl td {
  padding: 9px 0;
  border-bottom: 1px solid var(--rule-soft);
  text-align: right;
  font-family: var(--mono);
  font-size: 0.81rem;
  color: var(--text-2);
}
.tbl td:first-child {
  text-align: left;
  font-family: var(--body);
  font-size: 0.88rem;
  color: var(--text);
}
.tbl tr:last-child td {
  border-bottom: 0;
  color: var(--text);
  font-weight: 600;
}
.tbl-cap {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  margin: 16px 0 8px;
  font-weight: 500;
}
.tbl-cap:first-of-type {
  margin-top: 0;
  margin-bottom: 18px;
}

/* ---------- recurring visual ---------- */
.rec {
  display: grid;
  gap: 0;
}
.rec-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--rule-soft);
}
.rec-row:last-child {
  border-bottom: 0;
}
.rec-name {
  min-width: 0;
  flex: 1;
}
.rec-name b {
  display: block;
  font-size: 0.87rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rec-name span {
  font-family: var(--mono);
  font-size: 0.68rem;
  color: var(--text-3);
}
.rec-amt {
  font-family: var(--mono);
  font-size: 0.86rem;
  white-space: nowrap;
}
.rec-amt i {
  font-style: normal;
  font-size: 0.7rem;
  color: var(--text-3);
}
.rec-base {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--rule);
}
.rec-base b {
  font-family: var(--mono);
  font-size: 1.2rem;
  font-weight: 600;
}
.rec-base span {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  font-weight: 500;
}
.up {
  color: var(--red);
}

/* ---------- net worth visual ---------- */
.nw-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
  margin-bottom: 16px;
  text-align: left;
}
.nw-3 div {
  padding: 11px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  background: rgba(var(--v-theme-on-surface), 0.018);
}
.nw-3 span {
  display: block;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 5px;
  font-weight: 500;
}
.nw-3 b {
  font-family: var(--mono);
  font-size: 0.95rem;
  font-weight: 600;
  display: block;
}
.nw-3 em {
  font-style: normal;
  font-family: var(--mono);
  font-size: 0.66rem;
  display: block;
  margin-top: 3px;
}
.debt-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--rule-soft);
}
.debt-row:last-child {
  border-bottom: 0;
}
.debt-row div {
  flex: 1;
  min-width: 0;
}
.debt-row b {
  display: block;
  font-size: 0.88rem;
  font-weight: 500;
}
.debt-row span {
  font-family: var(--mono);
  font-size: 0.68rem;
  color: var(--text-3);
}
.debt-row .bal {
  font-family: var(--mono);
  font-size: 0.87rem;
  white-space: nowrap;
}
.stale {
  color: var(--amber);
}

/* ---------- transactions visual: import heatmap ---------- */
.hm {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.hm th {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  font-weight: 500;
  padding: 0 0 9px;
  text-align: center;
}
.hm th:first-child {
  text-align: left;
}
.hm td {
  padding: 6px 0;
  text-align: center;
  border-bottom: 1px solid var(--rule-soft);
}
.hm td:first-child {
  text-align: left;
  font-size: 0.83rem;
  color: var(--text-2);
}
.hm tr:last-child td {
  border-bottom: 0;
}
.chip {
  display: inline-block;
  min-width: 26px;
  padding: 2px 7px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 0.72rem;
  border: 1px solid transparent;
}
.c-none {
  color: var(--red);
  border-color: rgba(var(--v-theme-error), 0.3);
  background: rgba(var(--v-theme-error), 0.12);
}
.c-few {
  color: var(--amber);
  border-color: rgba(var(--v-theme-warning), 0.28);
  background: rgba(var(--v-theme-warning), 0.1);
}
.c-ok {
  color: var(--green);
  border-color: rgba(var(--v-theme-success), 0.28);
  background: rgba(var(--v-theme-success), 0.1);
}
.c-tot {
  color: var(--blue);
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-primary), 0.12);
}
.hm-key {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--rule-soft);
  font-family: var(--mono);
  font-size: 0.7rem;
  color: var(--text-3);
}

/* ---------- small grid ---------- */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--rule-soft);
  border: 1px solid var(--rule-soft);
  border-radius: var(--radius);
  overflow: hidden;
}
.cell {
  background: var(--bg-2);
  padding: 24px 22px;
  transition: background 0.18s;
}
.cell:hover {
  background: var(--card);
}
.cell h3 {
  margin-bottom: 9px;
}
.cell p {
  font-size: 0.91rem;
  color: var(--text-2);
}
.cell-ico {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-xs);
  margin-bottom: 14px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-primary), 0.11);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  color: var(--blue);
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 580px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* ---------- steps ---------- */
.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 32px);
}
.step {
  position: relative;
  padding-top: 26px;
  border-top: 2px solid var(--rule);
}
.step:first-child {
  border-top-color: var(--blue);
}
.step-n {
  position: absolute;
  top: -14px;
  left: 0;
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 5px;
  background: var(--bg);
  border: 1px solid var(--rule);
  color: var(--text-3);
}
.step:first-child .step-n {
  border-color: var(--blue-dim);
  color: var(--blue);
}
.step h3 {
  margin-bottom: 9px;
}
.step p {
  font-size: 0.93rem;
  color: var(--text-2);
}
@media (max-width: 840px) {
  .steps {
    grid-template-columns: 1fr;
    gap: 26px;
  }
}

/* ---------- data block ---------- */
.data-wrap {
  /* a surface card on the canvas, like every panel in the app */
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background: var(--card);
  box-shadow: var(--shadow-sm);
  padding: clamp(24px, 4vw, 40px);
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(24px, 4vw, 46px);
}
.data-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 18px;
}
.data-list h3 {
  font-size: 1rem;
  margin-bottom: 6px;
}
.data-list p {
  font-size: 0.92rem;
  color: var(--text-2);
}
@media (max-width: 900px) {
  .data-wrap {
    grid-template-columns: 1fr;
  }
}

.cta-final {
  text-align: center;
  padding: clamp(60px, 8vw, 104px) 0;
}
.cta-final h2 {
  max-width: 22ch;
  margin: 13px auto 0;
}
.cta-final p {
  margin: 17px auto 0;
  max-width: 50ch;
  color: var(--text-2);
}
.cta-final .btn {
  margin-top: 28px;
}
.cta-final .fine {
  margin-top: 15px;
  font-size: 0.84rem;
  color: var(--text-3);
}

footer {
  border-top: 1px solid var(--rule-soft);
  padding: 26px 0;
  background: rgb(var(--v-theme-surface-variant));
}
.foot-in {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
  font-size: 0.87rem;
  color: var(--text-3);
}
.foot-in nav {
  margin-left: auto;
  display: flex;
  gap: 20px;
}
.foot-in a {
  text-decoration: none;
}
.foot-in a:hover {
  color: var(--text-2);
}

/* ---------- login modal ---------- */
.login-card {
  text-align: center;
}
.login-card h3 {
  margin: 10px 0 0;
}
.login-sub {
  margin-top: 10px;
  color: var(--text-2);
  font-size: 0.93rem;
}
.login-error {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(var(--v-theme-error), 0.3);
  background: rgba(var(--v-theme-error), 0.1);
  color: var(--red);
  font-size: 0.85rem;
}
.google-login-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.demo-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.19em;
  text-transform: uppercase;
  color: var(--text-3);
  font-weight: 500;
}
.demo-divider::before,
.demo-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--rule);
}
.demo-btn {
  width: 100%;
  justify-content: center;
}
</style>
