# Budget Dashboard (Frontend)

Vue 3 + Vuetify frontend for a household budgeting dashboard.  
Consumes the Flask API in `budget` to visualize transactions, cash flow, category spend, and import workflows.

## What It Does

- Loads household context, users, accounts, and transactions through Pinia stores.
- Displays a 3-month overview dashboard with:
  - net income snapshot
  - category breakdown tables (income, needs, wants)
  - searchable transaction tables split by type
- Supports inline transaction editing:
  - category
  - sub-category
  - need/want flag
- Persists transaction edits via API (`PUT /transactions/save`).
- Supports CSV import flow from UI (`POST /transactions/upload/`).
- Includes theme toggle with persisted preference in `localStorage`.
- Includes basic auth store/login bootstrap and persisted user session state.

## Tech Stack

- Vue 3
- TypeScript (mixed TS/JS components)
- Vuetify 3
- Pinia
- Axios
- Vite
- `unplugin-vue-router` (file-based route generation)

## Key Files

- `src/pages/index.vue`: main dashboard page and data loading.
- `src/api.ts`: HTTP client + API request helpers.
- `src/stores/*.ts`: state layers for auth, household, users, accounts, transactions, import.
- `src/components/TransactionsTable.vue`: editable transaction data table.
- `src/components/ImportForm.vue`: account/file selection and CSV upload flow.
- `src/components/common/CategoryTable.vue`: grouped spend rollups.
- `src/App.vue`: shell, theme toggle, login bootstrap.

## Configuration

Set backend base URL in environment variable:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

Notes:

- Google login plugin is registered in `src/main.ts`, but client ID is a placeholder (`YOUR_GOOGLE_CLIENT_ID`) in code.
- Current API calls are hardcoded around `user_id: 1` / `household_id: 1` in several store/api methods.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

Default Vite port in this repo is `5173`.

3. Build production bundle:

```bash
npm run build
```

## Backend Dependency

This app expects the `budget` backend to be running and CORS-enabled.  
Without the API, dashboard data loading, transaction saves, and imports will fail.

## Known Gaps

- Some analytics components (`NetTrend`, `SavingsRate`) are present but not fully wired in the main dashboard.
- Auth flow is partially scaffolded; backend login route currently returns a mocked user identity.
- Several areas rely on hardcoded IDs and should be moved to authenticated context.
- No formal frontend test suite configured.
