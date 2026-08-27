# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 + Vuetify frontend for a household budgeting dashboard. Consumes a Flask backend API to visualize transactions, cash flow, category spending, and CSV import workflows.

**Tech Stack**: Vue 3, TypeScript, Vuetify 3, Pinia, Axios, Vite, unplugin-vue-router (file-based routing)

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Dev server on port 5173
npm run type-check  # TypeScript check (pre-existing errors exist in main.ts / tsconfig — ignore them)
npm run build     # Production build
npm run lint      # Lint and auto-fix
```

### Local dev service (systemd user unit)

On this machine `npm run dev` also runs as a user systemd service instead of being started manually — `~/.config/systemd/user/budget-fe.service` runs `npm run dev` in this repo directory (Vite dev server, port 5173, auto-restart on crash). Vite's HMR usually picks up edits live, but restart it to confirm a clean start after config changes:

```bash
systemctl --user restart budget-fe.service
systemctl --user status budget-fe.service --no-pager
journalctl --user -u budget-fe.service -f
```

The backend (`budget` repo) has an equivalent `budget-api.service` — see that repo's `CLAUDE.md`.

## Architecture

### Time Window Navigation

The dashboard has a **3-month sliding window** controlled by `transactionStore.monthsAgo` (integer, 0–2). This is the central piece of state that all data components react to.

- `monthsAgo = 0` → focus month is last month; window covers months 1–3 ago
- `monthsAgo = 1` → focus month is 2 months ago; window covers months 2–4 ago
- Navigation buttons in `index.vue` increment/decrement `monthsAgo` and trigger a re-fetch

**When `monthsAgo` changes**, `index.vue` watches it and calls `transactionsStore.fetchTransactions()`, which computes a `from_date` of `monthsAgo + 12` months ago — 12 months of history feed the cash-flow sparkline and recurring-charge detection, while display components filter to their own windows.

### Transaction Store (`src/stores/transaction.ts`)

The store holds all fetched transactions and exposes:

- **Filtered getters**: `incomeTransactions`, `expenseNeedTransactions`, `expenseWantTransactions`, `transferTransactions` — filter the raw array by type/need flag
- **`net_incomes` getter**: Array where `net_incomes[n]` = `{ income, expensesNeed, expensesWant }` aggregated for the month that is `n` months ago from today (`[0]` = current partial month). The focus month is `net_incomes[monthsAgo + 1]`. Used by `NetIncome`, `NetTrend`, and `SavingsRate`.
- **`monthsAgo`**: The active window offset — all display components derive their date ranges from this

### API Layer (`src/api.ts`)

Axios instance pointed at `VITE_API_BASE_URL` (default `http://localhost:5000/api`). Key note: `getTransactions` accepts an optional `from_date` string (`YYYY-MM-DD`) which the store passes based on `monthsAgo`. Many calls still hardcode `user_id: 1` / `household_id: 1`.

### Component Data Flow

1. **`src/pages/index.vue`**: Orchestrates the dashboard. Fetches the household first (other fetches derive IDs from it), then the rest in parallel. Watches `monthsAgo` to re-fetch transactions. Contains navigation buttons that mutate `monthsAgo`. Content is split into three `v-tabs`/`v-window` tabs — **Overview** (AI budget analysis half-width on top with `CashFlow.vue` + spending mix stacked beside it, then 50/30/20 and targets below; the analysis markdown is rendered via `src/markdown.ts`. `CashFlow.vue` merges the old NetIncome/NetTrend cards: focus-month net with deltas vs. prior month and 3-month average, plus the mode-toggle sparkline. `SavingsRate.vue`, `NetIncome.vue`, and `NetTrend.vue` still exist but are no longer placed.), **Insights** (AI analysis, recurring charges, category tables), and **Transactions** (import status + transaction tables; the tab shows a warning badge with the uncategorized count). The window has `:touch="false"` so horizontal table scrolling doesn't switch tabs.
2. **`CategoryTable.vue`**: Derives `month1/month2/month3` as `computed` refs from `monthsAgo` (year-aware comparison). Headers and row data both react to navigation.
3. **`TransactionsTable.vue`**: `filteredItems` is a `computed` that filters to the active 3-month window using `windowStart`/`windowEnd` derived from `monthsAgo`.
4. **`CashFlow.vue`**: Reads `net_incomes[monthsAgo + 1]` for the focus-month headline/deltas and `net_incomes[monthsAgo + 1..12]` for the sparkline (up to 12 points ending at the focus month).

### Global Utilities

`formatDate(date)` and `formatCurrency(amount)` are registered on `app.config.globalProperties` in `src/main.ts` and are available in **templates only**. They are not importable. Using them in `<script setup lang="ts">` will cause TypeScript errors — keep logic that needs them in the template.

### Component Organization

- **`src/pages/`**: Route pages — `index.vue` is the only page
- **`src/components/common/`**: Reusable primitives: `SurfaceCard`, `Dialog` (fullscreen on xs screens), `SectionHeader`, `CategoryTable` (`HeroBanner` exists but is no longer used — replaced by the page header in `index.vue`)
- **`src/stores/`**: Pinia stores: `auth`, `household`, `user`, `account`, `transaction`, `import`, `categoryRule`, `budgetTarget`

### Dashboard Cards

All focus-month cards read `transactionStore.focusMonthTransactions` (a getter for the month `monthsAgo + 1` back) so they react to window navigation:

- **`BudgetTargets.vue`**: per-category monthly limits vs. focus-month actuals with progress bars; upserts via the `budgetTarget` store
- **`SpendingMix.vue`**: hand-rolled SVG donut of focus-month expense categories (top 6 + Other)
- **`FiftyThirtyTwenty.vue`**: needs/wants/savings share of income vs. the 50/30/20 rule, from `net_incomes`
- **`RecurringCosts.vue`**: client-side recurring-charge detection (same description normalization as the backend: digit tokens stripped; 3+ months, amounts within ±30%), with price-increase flags
- **`CategoryTable.vue`**: focus-month cells flag overspend (25%+ and ≥$25 above the prior two months' average)
- **`Transactions.vue`**: debounced search, CSV export of the active window, and a "Review (N)" queue that opens `TransactionReviewDialog` with a snapshot of `unknownTransactions`
- **`ImportReviewStack.vue`**: post-upload card stack shown by `ImportForm` — imported transactions first (editable category/sub-category/need; Enter or "Save & Next" persists and advances), duplicates at the back with warning styling and Force Import / Skip actions. A force-imported duplicate flips in place into an editable card.

### Category Rules

User-defined categorization rules ("description contains X → category/sub-category/need") that the backend applies during import before falling back to AI. Managed two ways:

- **`CategoryRulesManager.vue`**: list/add/delete rules, opened from the "Rules" button in the page header
- **`TransactionsTable.vue`**: per-row tag button opens a `CategoryRuleForm` pre-filled from that transaction

`CategoryRuleForm.vue` owns the create call via `useCategoryRuleStore`; the store resolves `household_id` from the household store. Rules are not retroactively applied to existing transactions.

### Vuetify & Design System

Configured in `src/plugins/vuetify.ts` with MDI icons, light/dark themes, and SCSS settings at `src/styles/settings.scss`. Components are auto-imported via `vite.config.mts`.

The visual language is deliberately restrained ("professional finance dashboard"): Inter with global `tabular-nums`, solid surfaces with 1px outline borders and hairline shadows (`--shadow-sm`), 12px radii, sentence-case buttons, neutral (not primary-tinted) table stripes/group rows, and uppercase muted "eyebrow" labels via the global `.pill` class (defined in `global.css` alongside `.muted`). No gradients, glassmorphism, or backdrop blur — keep new components consistent with this. Tokens live in `src/styles/tokens.css`; global overrides in `src/styles/global.css`.

App shell: `App.vue` renders a slim sticky top bar (brand + theme toggle + logout) with the page below it. `index.vue` opens with a page header — large household title, segmented month pager (`‹ Month ›`), and Import / Generate analysis / Rules actions — followed by underline-style nav tabs (`.nav-tabs`, no box). The Overview tab leads with `KpiStrip.vue`: four stat tiles (Income, Spending, Net, Savings rate) for the focus month with dollar deltas vs. the prior month.

## Configuration

```
VITE_API_BASE_URL=http://localhost:5000/api   # in .env or .env.local
```

## Auth

**Google Sign-In only** — no passwords, no email/password forms. The backend verifies the Google ID token and returns its own session JWT, which is what every subsequent request carries.

- `authStore.loginWithGoogle(credential)` → `POST /auth/google/` → `{user, token}`; both persisted to localStorage. `authStore.restore()` reloads them, called from `main.ts` *before* the router's first navigation so the guard sees the right state.
- `api.ts` attaches `Authorization: Bearer <token>` from **the auth store, not localStorage** — a preview session (below) deliberately never touches localStorage but still needs authenticated calls. A 401 clears the session and reloads, except while previewing.
- **Routing, not conditional rendering, gates the app**: `router/index.ts`'s `beforeEach` bounces logged-out visitors to the landing page (`/`) and logged-in users off it to `/dashboard`. Pages behind the guard can assume a user exists.
- **Demo account**: `authStore.loginAsDemo()` → `POST /auth/demo/` mints a token for the seeded read-only demo household — a real, persisted session.
- **Preview session**: `authStore.startPreview()` authenticates as that same demo account *without* persisting, so the landing page can feed real dashboard components live data while staying on `/`. `previewing` keeps the app shell hidden. `authGeneration` guards `startPreview` itself against a slow preview fetch clobbering a real login that happened while it was in flight — don't remove it.
- **The preview shares the dashboard's stores**, which makes stale demo data a live hazard on first login. `resetHouseholdStores()` (`src/utils/session.ts`) wipes every household-scoped store; it's called on **login as well as logout** (`index.vue`'s login handlers, `App.vue`'s `logout()`) — without it, signing in from the landing page carries the demo household straight into the new user's dashboard, and it only looks right after a refresh (by which point the router guard skips the landing page entirely, so no preview runs). Keep the store list in `resetHouseholdStores()` complete — a missed store is a data-leak-shaped bug between two accounts on the same browser.
  - A stricter version of this fix was tried once (`api.ts` stamping every request with `authGeneration` and rejecting stale in-flight responses via `axios.Cancel`) and broke login outright, so it was reverted — don't reintroduce response-level request cancellation here. `resetHouseholdStores()` on login covers the reported bug; the narrower race it doesn't cover (a preview fetch still in flight landing *after* the reset) is a much smaller risk than that outage was.
- Users invited to a household before ever logging in are placeholders with empty `first_name`; `App.vue` watches `authStore.user` and auto-opens the Profile dialog so they can fill it in.
- IDs resolve dynamically: `household`/`account`/`transaction` stores read `user.id` from the auth store; `user`/`transaction`/`categoryRule` stores read `household.id` from the household store. `dashboard.vue` fetches the household first, then the rest in parallel.
- Logout clears the auth store and calls `resetHouseholdStores()`.
- JWTs are stateless with a 30-day expiry and no revocation list — clearing the client copy on logout doesn't invalidate a leaked token.

## Billing

Stripe-hosted; the frontend never touches card details, it only redirects to a URL the backend returns.

- `SubscribeGate.vue` is the paywall `dashboard.vue` shows when `subscription_status` isn't `active`/`trialing`. Its `lapsed` prop splits the copy: unset = never subscribed (trial pitch), set = subscribed before and now canceled/past_due (resubscribe pitch, no trial).
- `BillingSettings.vue` is the settings-dialog panel — "Manage billing" (portal) once the household actually has a subscription, "Start free trial"/"Subscribe" otherwise. Key that off `subscription_status`, **not** `stripe_customer_id_set`: the backend creates the Stripe Customer when a Checkout session is *created*, not completed, so an abandoned checkout leaves a customer with nothing to manage.
- **Returning from Checkout**: Stripe redirects back to `/dashboard?checkout=success` immediately, but `subscription_status` is only written when the webhook lands, which can be a second or two later. `dashboard.vue` re-polls the household a few times (`CHECKOUT_POLL_*`) before falling through to the gate, so a just-paid user isn't shown the paywall. The redirect itself is never treated as proof of payment — only the webhook is.
- **Trial copy lives in `src/utils/billing.ts`** (`TRIAL_DAYS`, `isTrialEligible`). `TRIAL_DAYS` is copy only — the trial actually granted comes from `STRIPE_TRIAL_DAYS` in the backend's `routes/billing.py`, so change both together or the marketing will lie. `isTrialEligible` mirrors the backend's `is_first_subscription` check: the trial is granted once per household, so never advertise it to one that has subscribed before.
- The landing page (`pages/index.vue`) and `public/llms.txt` also quote the trial and price — grep for `TRIAL_DAYS` and `4.99` when either changes.

## Settings Dialogs

A `mdi-cog-outline` menu in the `App.vue` top bar opens `common/Dialog.vue`-hosted dialogs:

- **Profile** (`ProfileForm.vue`): edit own name/email via `authStore.updateProfile` (refreshes the member list after save)
- **Household** (`HouseholdForm.vue`): rename via `householdStore.updateName`; member list (blank-name placeholders show an "Invited" pill) and add-member-by-email via `userStore.addMember`
- **Accounts** (`AccountsManager.vue` + `AccountForm.vue`): list/add/edit accounts via the account store; bank is a fixed select of the importer keys, owner defaults to the logged-in user. SimpleFin-linked rows also get a per-account "Refresh Transactions" button.
- **Billing** (`BillingSettings.vue`): plan, status chip, and either the Stripe portal or a subscribe/trial button — see [Billing](#billing) above
- **SimpleFin wizard** (`SimplefinWizard.vue`) and **Import errors** (`ImportErrorsManager.vue`) are hosted the same way, opened from the household/integrations flow rather than the cog menu

## Known Constraints

- Pre-existing TypeScript errors in `main.ts` and `tsconfig.json` (node22 lib incompatibility) — do not attempt to fix unless specifically asked
- No frontend test suite
