# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 + Vuetify frontend for a household budgeting dashboard. Consumes a Flask backend API to visualize transactions, cash flow, category spending, and CSV import workflows.

**Tech Stack**: Vue 3, TypeScript, Vuetify 3, Pinia, Axios, Vite, unplugin-vue-router (file-based routing)

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Dev server on port 5173
npm run type-check  # TypeScript check (pre-existing errors exist in main.ts / tsconfig, ignore them)
npm run build     # Production build
npm run lint      # Lint and auto-fix
```

### Local dev service (systemd user unit)

On this machine `npm run dev` also runs as a user systemd service instead of being started manually, `~/.config/systemd/user/budget-fe.service` runs `npm run dev` in this repo directory (Vite dev server, port 5173, auto-restart on crash). Vite's HMR usually picks up edits live, but restart it to confirm a clean start after config changes:

```bash
systemctl --user restart budget-fe.service
systemctl --user status budget-fe.service --no-pager
journalctl --user -u budget-fe.service -f
```

The backend (`budget` repo) has an equivalent `budget-api.service`, see that repo's `CLAUDE.md`.

## Architecture

### Time Window Navigation

The dashboard has a **3-month sliding window** controlled by `transactionStore.monthsAgo` (integer, 0–2). This is the central piece of state that all data components react to.

- `monthsAgo = 0` → focus month is last month; window covers months 1–3 ago
- `monthsAgo = 1` → focus month is 2 months ago; window covers months 2–4 ago
- Navigation buttons in `index.vue` increment/decrement `monthsAgo` and trigger a re-fetch

**When `monthsAgo` changes**, `index.vue` watches it and calls `transactionsStore.fetchTransactions()`, which computes a `from_date` of `monthsAgo + 12` months ago, 12 months of history feed the cash-flow sparkline and recurring-charge detection, while display components filter to their own windows.

### Transaction Store (`src/stores/transaction.ts`)

The store holds all fetched transactions and exposes:

- **Filtered getters**: `incomeTransactions`, `expenseNeedTransactions`, `expenseWantTransactions`, `transferTransactions`, filter the raw array by type/need flag
- **`net_incomes` getter**: Array where `net_incomes[n]` = `{ income, expensesNeed, expensesWant }` aggregated for the month that is `n` months ago from today (`[0]` = current partial month). The focus month is `net_incomes[monthsAgo + 1]`. Used by `NetIncome`, `NetTrend`, and `SavingsRate`.
- **`monthsAgo`**: The active window offset, all display components derive their date ranges from this

### API Layer (`src/api.ts`)

Axios instance pointed at `VITE_API_BASE_URL` (default `http://localhost:5000/api`). Key note: `getTransactions` accepts an optional `from_date` string (`YYYY-MM-DD`) which the store passes based on `monthsAgo`. Many calls still hardcode `user_id: 1` / `household_id: 1`.

### Component Data Flow

1. **`src/pages/dashboard.vue`**: Orchestrates the dashboard. Fetches the household first (other fetches derive IDs from it), then the rest in parallel. Watches `monthsAgo` to re-fetch transactions. Contains navigation buttons that mutate `monthsAgo`. Content is split into `v-tabs`/`v-window` tabs, **Overview**, **Insights**, **Net Worth**, and **Transactions** (the tab shows a warning badge with the uncategorized count). The window has `:touch="false"` so horizontal table scrolling doesn't switch tabs.

   Every tab body is a `.board` (a vertical flex stack on a 16px rhythm) holding full-width cards and `.band` two-column grids. **Overview** reads top to bottom: `KpiStrip` → `NetWorthSummaryBar` → full-width `CashFlow` → a band of `SpendingMix` + `FiftyThirtyTwenty` → the full-width **Budget Analysis** card (AI prose via `src/markdown.ts`, running the card's full width) → a band of `BudgetTargets` + `RecurringCosts`. **Insights** is a single full-width card holding the `Categories` drill-down. `CashFlow.vue` merges the old NetIncome/NetTrend cards: focus-month net with deltas vs. prior month and 3-month average, plus the mode-toggle sparkline. `SavingsRate.vue`, `NetIncome.vue`, and `NetTrend.vue` still exist but are no longer placed.

   Targets appear once on Overview, as `BudgetTargets` (the editable bars card). A read-only `TargetsTable` variant existed briefly and was removed as a duplicate, `BudgetAnalysisCard`'s `hide-targets-section` still suppresses the AI's prose version of the same section so it isn't stated twice.
2. **`CategoryTable.vue`**: A hand-rolled three-level drill-down grid, category → sub-category → transaction, where all three levels share one `26px | 1fr | minmax(72,104)px ×3 | share` grid so nothing shifts as rows open. Columns are the two prior months plus the focus month (highlighted via `.col-head--focus`) and a Share percentage (relative to the grand total at level 1, to the parent category at level 2). The number columns give ground before the name column does, so the table survives a narrow container. **Level 3 lists every transaction in the 3-month window**, each one's amount rendered in its own month's column (the other two cells stay blank), newest first, so a sub-category's three monthly totals decompose diagonally down the columns. Sorting is on the parsed date, not the string: the API's date strings are not lexicographically ordered. One category and one sub-category are open at a time; opening a category clears the open sub-category, and paging `monthsAgo` closes both. Transaction rows carry the category/sub-category editors and the need toggle on a second line under the merchant, since the month cells now hold data. Derives `month1/month2/month3` as `computed` refs from `monthsAgo` (year-aware comparison); headers and row data both react to navigation. Below 700px the whole table restacks (name + meta left, amount right, `.drill__narrow-only` swaps in the transaction's own figure since the month columns are gone) rather than scrolling horizontally.
3. **`TransactionsTable.vue`**: `filteredItems` is a `computed` that filters to the active 3-month window using `windowStart`/`windowEnd` derived from `monthsAgo`.
4. **`CashFlow.vue`**: Reads `net_incomes[monthsAgo + 1]` for the focus-month headline/deltas and `net_incomes[monthsAgo + 1..12]` for the sparkline (up to 12 points ending at the focus month).

### Global Utilities

`formatDate(date)` and `formatCurrency(amount)` are registered on `app.config.globalProperties` in `src/main.ts` and are available in **templates only**. They are not importable. Using them in `<script setup lang="ts">` will cause TypeScript errors, keep logic that needs them in the template.

### Component Organization

- **`src/pages/`**: Route pages, `index.vue` is the only page
- **`src/components/common/`**: Reusable primitives: `SurfaceCard`, `Dialog` (fullscreen on xs screens), `SectionHeader`, `CategoryTable` (`HeroBanner` exists but is no longer used, replaced by the page header in `index.vue`)
- **`src/stores/`**: Pinia stores: `auth`, `household`, `user`, `account`, `transaction`, `import`, `categoryRule`, `budgetTarget`

### Dashboard Cards

All focus-month cards read `transactionStore.focusMonthTransactions` (a getter for the month `monthsAgo + 1` back) so they react to window navigation:

- **`BudgetTargets.vue`**: per-category monthly limits vs. focus-month actuals with progress bars; upserts via the `budgetTarget` store. The single home for targets on Overview
- **`SpendingMix.vue`**: hand-rolled SVG donut of focus-month expense categories (top 6 + Other)
- **`FiftyThirtyTwenty.vue`**: needs/wants/savings share of income vs. the 50/30/20 rule, from `net_incomes`
- **`RecurringCosts.vue`**: client-side recurring-charge detection (same description normalization as the backend: digit tokens stripped; 3+ months, amounts within ±30%), with price-increase flags. Sits on **Overview** beside `BudgetTargets`, below the AI summary
- **`CategoryTable.vue`**: focus-month cells flag overspend (25%+ and ≥$25 above the prior two months' average). `Categories.vue` stacks three of them (Must-Haves / Nice-to-Haves / Income) inside a single full-width card on the Insights tab, no card-per-group nesting
- **`Transactions.vue`**: debounced search, CSV export of the active window, and a "Review (N)" queue that opens `TransactionReviewDialog` with a snapshot of `unknownTransactions`
- **`ImportReviewStack.vue`**: post-upload card stack shown by `ImportForm`, imported transactions first (editable category/sub-category/need; Enter or "Save & Next" persists and advances), duplicates at the back with warning styling and Force Import / Skip actions. A force-imported duplicate flips in place into an editable card.

### Category Rules

User-defined categorization rules ("description contains X → category/sub-category/need") that the backend applies during import before falling back to AI. Managed two ways:

- **`CategoryRulesManager.vue`**: list/add/delete rules, opened from the "Rules" button in the page header
- **`TransactionsTable.vue`**: per-row tag button opens a `CategoryRuleForm` pre-filled from that transaction

`CategoryRuleForm.vue` owns the create call via `useCategoryRuleStore`; the store resolves `household_id` from the household store. Rules are not retroactively applied to existing transactions.

### Vuetify & Design System

Configured in `src/plugins/vuetify.ts` with MDI icons, light/dark themes, and SCSS settings at `src/styles/settings.scss`. Components are auto-imported via `vite.config.mts`.

The visual language is deliberately restrained ("professional finance dashboard"): Inter Tight with global `tabular-nums`, Bricolage Grotesque for headings, IBM Plex Mono for numerals and column labels. Solid surfaces with 1px hairline borders (`--hairline`, `--hairline-soft`) and one shadow (`--shadow-sm`), 14px card radii, sentence-case buttons, and uppercase muted "eyebrow" labels via the global `.pill` class (defined in `global.css` alongside `.muted`). Table headers are mono 10px at `.16em` tracking and 50% opacity (`.col-head`, or the global `.v-table thead th` rule); header/total/nested rows use canvas tints (`--row-tint`, `--row-tint-strong`) and an open/hover row uses `--row-open`. No gradients, glassmorphism, or backdrop blur. Keep new components consistent with this. Tokens live in `src/styles/tokens.css`; global overrides in `src/styles/global.css`. The category chart palette (`--cat-1`…`--cat-7`) is Material 400s.

### Writing style

**Never use an em dash (`—`) in anything a user reads, or in code comments.** The owner does not use them, so every one in this repo was written by an AI and reads as such. Rewrite instead of substituting punctuation: usually the clause after the dash becomes its own sentence, or a comma works. Run `grep -rn ', ' src/ public/` before committing copy.

The only permitted use is the em dash as an empty-value glyph in a data cell (`AccountsManager.vue`, `KpiStrip.vue`), which is typography rather than writing.

Two related habits to avoid, both of which read as AI-authored:

- **Label stacking.** A small uppercase label above a heading that already says the same thing is noise. The page has two label systems on purpose: `.eyebrow` marks a section, `.card-label` states that a card holds live demo data. A third (`.feat-tag`) was removed for saying nothing the `<h3>` beneath it didn't.
- **Sentences that sound right but say nothing** ("Four screens. One clear picture."). Every claim should be one a competitor could not copy verbatim. Name the actual behaviour: three months side by side, one number for what the household costs to run.

The desktop shell is capped at `--page-max` (1312px) with `24px 32px 44px` padding.

App shell: `App.vue` renders a 64px sticky top bar, logo tile, "Debrief", a hairline divider, the household name, then notifications / theme / settings / a 32px initials avatar / logout, with the page below it. `dashboard.vue` opens with `.board-head`: the segmented month pager (`‹ 📅 Month ›`) left, Import / Generate analysis / Rules right, followed by the nav tabs in **Overview → Net Worth → Insights → Transactions** order.

The tabs are one `<v-tabs>` in two guises: underline-style below the header on desktop (`.nav-tabs`), and a fixed bottom bar on phones (`.nav-tabs--bottom`, `smAndDown`) with `stacked` icons over labels, `hide-slider`, a hairline on top and `env(safe-area-inset-bottom)` folded into its padding. Two gotchas if you touch it: the `mb-5` margin must be swapped off in the bottom guise (a bottom-margin on a `position: fixed` element pushes it up off the viewport edge), and `#home .v-container`'s bottom padding is what stops the last card hiding under the bar. The Overview tab leads with `KpiStrip.vue`: four stat tiles (Income, Spending, Net, Savings rate) for the focus month with dollar deltas vs. the prior month.

## Staying fresh (PWA)

`manifest.json` is `display: standalone` and there is **no service worker**, so nothing caches assets, but there is also no browser reload button once it's installed, and the SPA otherwise fetches once on mount and never again. Two things cover that, both in `dashboard.vue`:

- **Pull to refresh** (`common/PullToRefresh.vue`), enabled only under `smAndDown`. It claims the gesture only when `window.scrollY <= 0` and the drag is downward, applies a 0.45 rubber-band with a cap, and arms at 70px. Its `touchmove` listener must stay **non-passive** or `preventDefault()` can't suppress the native overscroll. `@refresh` hands over a `done` callback, the spinner stays up until the parent resolves it.
- **Refetch on foreground**: a `visibilitychange` handler refetches when the app becomes visible again and `lastLoadedAt` is older than `STALE_AFTER_MS` (5 min). This is the one that actually fixes "I came back to it tomorrow and the numbers were yesterday's".

Both route through `refreshAll()` → `fetchHouseholdData()`, which is the same parallel fetch the initial load uses. A refresh re-fetches data; it never reloads the page.

## Configuration

```
VITE_API_BASE_URL=http://localhost:5000/api   # in .env or .env.local
```

## Auth

**Google Sign-In only**, no passwords, no email/password forms. The backend verifies the Google ID token and returns its own session JWT, which is what every subsequent request carries.

- `authStore.loginWithGoogle(credential)` → `POST /auth/google/` → `{user, token}`; both persisted to localStorage. `authStore.restore()` reloads them, called from `main.ts` *before* the router's first navigation so the guard sees the right state.
- `api.ts` attaches `Authorization: Bearer <token>` from **the auth store, not localStorage**, a preview session (below) deliberately never touches localStorage but still needs authenticated calls. A 401 clears the session and reloads, except while previewing.
- **Routing, not conditional rendering, gates the app**: `router/index.ts`'s `beforeEach` bounces logged-out visitors to the landing page (`/`) and logged-in users off it to `/dashboard`. Pages behind the guard can assume a user exists.
- **Demo account**: `authStore.loginAsDemo()` → `POST /auth/demo/` mints a token for the seeded read-only demo household, a real, persisted session.
- **Preview session**: `authStore.startPreview()` authenticates as that same demo account *without* persisting, so the landing page can feed real dashboard components live data while staying on `/`. `previewing` keeps the app shell hidden. `authGeneration` guards `startPreview` itself against a slow preview fetch clobbering a real login that happened while it was in flight, don't remove it.
- **The preview shares the dashboard's stores**, which makes stale demo data a live hazard on first login. `resetHouseholdStores()` (`src/utils/session.ts`) wipes every household-scoped store; it's called on **login as well as logout** (`index.vue`'s login handlers, `App.vue`'s `logout()`), without it, signing in from the landing page carries the demo household straight into the new user's dashboard, and it only looks right after a refresh (by which point the router guard skips the landing page entirely, so no preview runs). Keep the store list in `resetHouseholdStores()` complete, a missed store is a data-leak-shaped bug between two accounts on the same browser.
  - A stricter version of this fix was tried once (`api.ts` stamping every request with `authGeneration` and rejecting stale in-flight responses via `axios.Cancel`) and broke login outright, so it was reverted, don't reintroduce response-level request cancellation here. `resetHouseholdStores()` on login covers the reported bug; the narrower race it doesn't cover (a preview fetch still in flight landing *after* the reset) is a much smaller risk than that outage was.
- Users invited to a household before ever logging in are placeholders with empty `first_name`; `App.vue` watches `authStore.user` and auto-opens the Profile dialog so they can fill it in.
- IDs resolve dynamically: `household`/`account`/`transaction` stores read `user.id` from the auth store; `user`/`transaction`/`categoryRule` stores read `household.id` from the household store. `dashboard.vue` fetches the household first, then the rest in parallel.
- Logout clears the auth store and calls `resetHouseholdStores()`.
- JWTs are stateless with a 30-day expiry and no revocation list, clearing the client copy on logout doesn't invalidate a leaked token.

## Billing

Stripe-hosted; the frontend never touches card details, it only redirects to a URL the backend returns.

- `SubscribeGate.vue` is the paywall `dashboard.vue` shows when `subscription_status` isn't `active`/`trialing`. Its `lapsed` prop splits the copy: unset = never subscribed (trial pitch), set = subscribed before and now canceled/past_due (resubscribe pitch, no trial).
- `BillingSettings.vue` is the settings-dialog panel, "Manage billing" (portal) once the household actually has a subscription, "Start free trial"/"Subscribe" otherwise. Key that off `subscription_status`, **not** `stripe_customer_id_set`: the backend creates the Stripe Customer when a Checkout session is *created*, not completed, so an abandoned checkout leaves a customer with nothing to manage.
- **Returning from Checkout**: Stripe redirects back to `/dashboard?checkout=success` immediately, but `subscription_status` is only written when the webhook lands, which can be a second or two later. `dashboard.vue` re-polls the household a few times (`CHECKOUT_POLL_*`) before falling through to the gate, so a just-paid user isn't shown the paywall. The redirect itself is never treated as proof of payment, only the webhook is.
- **Trial copy lives in `src/utils/billing.ts`** (`TRIAL_DAYS`, `isTrialEligible`). `TRIAL_DAYS` is copy only, the trial actually granted comes from `STRIPE_TRIAL_DAYS` in the backend's `routes/billing.py`, so change both together or the marketing will lie. `isTrialEligible` mirrors the backend's `is_first_subscription` check: the trial is granted once per household, so never advertise it to one that has subscribed before.
- The landing page (`pages/index.vue`) and `public/llms.txt` also quote the trial and price, grep for `TRIAL_DAYS` and `4.99` when either changes.

## Settings Dialogs

A `mdi-cog-outline` menu in the `App.vue` top bar opens `common/Dialog.vue`-hosted dialogs:

- **Profile** (`ProfileForm.vue`): edit own name/email via `authStore.updateProfile` (refreshes the member list after save)
- **Household** (`HouseholdForm.vue`): rename via `householdStore.updateName`; member list (blank-name placeholders show an "Invited" pill) and add-member-by-email via `userStore.addMember`
- **Accounts** (`AccountsManager.vue` + `AccountForm.vue`): list/add/edit accounts via the account store; bank is a fixed select of the importer keys, owner defaults to the logged-in user. SimpleFin-linked rows also get a per-account "Refresh Transactions" button.
- **Billing** (`BillingSettings.vue`): plan, status chip, and either the Stripe portal or a subscribe/trial button, see [Billing](#billing) above
- **SimpleFin wizard** (`SimplefinWizard.vue`) and **Import errors** (`ImportErrorsManager.vue`) are hosted the same way, opened from the household/integrations flow rather than the cog menu

## Known Constraints

- Pre-existing TypeScript errors in `main.ts` and `tsconfig.json` (node22 lib incompatibility), do not attempt to fix unless specifically asked
- No frontend test suite

## Landing page (`src/pages/index.vue`)

The marketing page embeds the **real** dashboard components as live previews (`KpiStrip`, `FiftyThirtyTwenty`, `BudgetTargets`, `Categories`, `RecurringCosts`, `NetWorthKpis`, `Transactions`, `BudgetAnalysisCard`), fed by the read-only demo account via `authStore.startPreview()`. **Any change to those components lands here too, check `/` after touching one.**

`index.vue` and `contact.vue` share a `.landing-root` block whose local names (`--card`, `--rule`, `--display`, …) are **thin aliases onto `tokens.css` and the Vuetify theme**, not a parallel system, so a token change reaches them. Rules when editing either page:

- **Never re-import the Google Fonts** or redefine the font stacks; `tokens.css` owns both. (Both pages used to, with a stale weight list that omitted Inter Tight 700.)
- Stay inside the app's visual language: no gradients, glass, or backdrop blur, one shadow (`--shadow-sm`), radii from `--radius`/`--radius-sm`/`--radius-xs`, hairlines from `--hairline`/`--hairline-soft`.
- Micro-labels come in exactly two flavours, matching the app: a section eyebrow (mono `0.7rem`/`0.19em`) and a column/data label (mono `10px`/`0.16em`, 50% text). Don't add a third.
- `--land-wrap` is deliberately 1200px, narrower than the app shell's `--page-max`, this page is prose-led and the wider measure breaks the hero headline's line breaks.
- `contact.vue` hides its own marketing nav when `authStore.user` is set, since `App.vue`'s top bar is already above it.

Two things it depends on:

- `BudgetAnalysisCard`'s `max-height` prop. The hero card is height-matched against the headline with `align-items: center`, so an unclamped analysis pushes the entire headline below the fold. The landing page passes `420px`; the Overview card runs unclamped.
- The KPI strips reflow on their **own** width (`container-type: inline-size` on a wrapper), not the viewport's, the landing preview card is ~500px wide inside a full-width viewport, which no media query can catch.
