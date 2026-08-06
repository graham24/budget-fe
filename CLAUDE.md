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

Email-only login (no password). `App.vue` shows a login card until `authStore.user` is set; the rest of the app only mounts after login, so stores can assume a user exists.

- `authStore.login(email)` → `POST /auth/login/` → user persisted to localStorage; restored on reload via `verifyUser`
- Unknown email (login 404) flips the card into signup mode (first/last name fields appear); `authStore.signup(...)` → `POST /auth/signup/` creates the user + their household and logs them in
- Users invited to a household before ever logging in are placeholders with empty `first_name`; `App.vue` watches `authStore.user` and auto-opens the Profile dialog (with a welcome hint) so they can fill in their name
- IDs are resolved dynamically: `household`/`account`/`transaction` stores read `user.id` from the auth store; `user`/`transaction`/`categoryRule` stores read `household.id` from the household store. `index.vue` fetches the household first, then the rest in parallel.
- Logout clears the auth store and `$reset()`s the per-user data stores
- This is identification, not security — the backend has no sessions or tokens

## Settings Dialogs

A `mdi-cog-outline` menu in the `App.vue` top bar opens three `common/Dialog.vue`-hosted dialogs:

- **Profile** (`ProfileForm.vue`): edit own name/email via `authStore.updateProfile` (refreshes the member list after save)
- **Household** (`HouseholdForm.vue`): rename via `householdStore.updateName`; member list (blank-name placeholders show an "Invited" pill) and add-member-by-email via `userStore.addMember`
- **Accounts** (`AccountsManager.vue` + `AccountForm.vue`): list/add/edit accounts via the account store; bank is a fixed select of the four importer keys, owner defaults to the logged-in user

## Known Constraints

- Pre-existing TypeScript errors in `main.ts` and `tsconfig.json` (node22 lib incompatibility) — do not attempt to fix unless specifically asked
- No frontend test suite
