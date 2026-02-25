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

## Architecture

### Time Window Navigation

The dashboard has a **3-month sliding window** controlled by `transactionStore.monthsAgo` (integer, 0–2). This is the central piece of state that all data components react to.

- `monthsAgo = 0` → focus month is last month; window covers months 1–3 ago
- `monthsAgo = 1` → focus month is 2 months ago; window covers months 2–4 ago
- Navigation buttons in `index.vue` increment/decrement `monthsAgo` and trigger a re-fetch

**When `monthsAgo` changes**, `index.vue` watches it and calls `transactionsStore.fetchTransactions()`, which computes a `from_date` of `monthsAgo + 4` months ago and passes it to the API so enough data is returned for the window plus the trend sparkline.

### Transaction Store (`src/stores/transaction.ts`)

The store holds all fetched transactions and exposes:

- **Filtered getters**: `incomeTransactions`, `expenseNeedTransactions`, `expenseWantTransactions`, `transferTransactions` — filter the raw array by type/need flag
- **`net_incomes` getter**: Array where `net_incomes[n]` = `{ income, expensesNeed, expensesWant }` aggregated for the month that is `n+1` months ago from today. Used by `NetIncome`, `NetTrend`, and `SavingsRate`.
- **`monthsAgo`**: The active window offset — all display components derive their date ranges from this

### API Layer (`src/api.ts`)

Axios instance pointed at `VITE_API_BASE_URL` (default `http://localhost:5000/api`). Key note: `getTransactions` accepts an optional `from_date` string (`YYYY-MM-DD`) which the store passes based on `monthsAgo`. Many calls still hardcode `user_id: 1` / `household_id: 1`.

### Component Data Flow

1. **`src/pages/index.vue`**: Orchestrates the dashboard. Fetches all data on mount in parallel. Watches `monthsAgo` to re-fetch transactions. Contains navigation buttons that mutate `monthsAgo`.
2. **`CategoryTable.vue`**: Derives `month1/month2/month3` as `computed` refs from `monthsAgo` (year-aware comparison). Headers and row data both react to navigation.
3. **`TransactionsTable.vue`**: `filteredItems` is a `computed` that filters to the active 3-month window using `windowStart`/`windowEnd` derived from `monthsAgo`.
4. **`NetIncome.vue`** / **`SavingsRate.vue`**: Read `net_incomes[monthsAgo]` for the focus month.
5. **`NetTrend.vue`**: Reads `net_incomes[monthsAgo]` through `net_incomes[monthsAgo + 2]` to build a 3-point sparkline.

### Global Utilities

`formatDate(date)` and `formatCurrency(amount)` are registered on `app.config.globalProperties` in `src/main.ts` and are available in **templates only**. They are not importable. Using them in `<script setup lang="ts">` will cause TypeScript errors — keep logic that needs them in the template.

### Component Organization

- **`src/pages/`**: Route pages — `index.vue` is the only page
- **`src/components/common/`**: Reusable primitives: `SurfaceCard`, `Dialog`, `HeroBanner`, `SectionHeader`, `CategoryTable`
- **`src/stores/`**: Pinia stores: `auth`, `household`, `user`, `account`, `transaction`, `import`

### Vuetify

Configured in `src/plugins/vuetify.ts` with MDI icons, light/dark themes, and SCSS settings at `src/styles/settings.scss`. Components are auto-imported via `vite.config.mts`.

## Configuration

```
VITE_API_BASE_URL=http://localhost:5000/api   # in .env or .env.local
```

## Known Constraints

- Auth flow is scaffolded but the backend returns a mocked user; `user_id: 1` / `household_id: 1` are hardcoded throughout `api.ts`
- Google OAuth client ID is a placeholder (`YOUR_GOOGLE_CLIENT_ID`) in `src/main.ts`
- Pre-existing TypeScript errors in `main.ts` and `tsconfig.json` (node22 lib incompatibility) — do not attempt to fix unless specifically asked
- No frontend test suite
