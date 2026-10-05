import axios from "axios";
import type { Household, User, Transaction, Account, BudgetAnalysis, DuplicateTransaction, CategoryRule, BudgetTarget, NetWorthItem, NetWorthSummary, BalanceEntry, SimplefinAccount, ImportError, SimplefinImportResult } from "./types";
import { useAuthStore } from "./stores/auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the session token to every request. Read from the auth store
// (not localStorage directly) so a landing-page preview session, which
// deliberately never touches localStorage, see authStore.startPreview , 
// can still make authenticated calls.
api.interceptors.request.use((config) => {
  const token = useAuthStore().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Expired/invalid token, bounce back to the login screen. Only applies to
// a real session: a preview session hitting a 401 (e.g. demo data isn't
// seeded) shouldn't force a reload out from under a marketing-page visitor.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !useAuthStore().previewing) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;

// Email-only login (no password, local-only app), returns the user plus
// our own session token. 404s for an email with no account.
export const emailLogin = async (
  email: string
): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string }>(
    "/auth/email/",
    { email }
  );
  return response.data;
};

// Demo account login, no credential needed, mints a token for the seeded
// demo household. 404s if the demo data hasn't been seeded server-side.
export const demoLogin = async (): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string }>("/auth/demo/");
  return response.data;
};

export const updateUser = async (
  id: number,
  updates: { first_name?: string; last_name?: string; email?: string }
): Promise<User> => {
  const response = await api.put<{ user: User }>(`/users/${id}`, updates);
  return response.data.user;
};

export const updateHousehold = async (
  id: number,
  name: string
): Promise<Household> => {
  const response = await api.put<{ household: Household }>(
    `/household/${id}`,
    { name }
  );
  return response.data.household;
};

type HouseholdSecretsFlags = {
  simplefin_access_url_set: boolean;
  simplefin_access_url_suffix: string;
};

// Exchanges a one-time SimpleFin setup token for a permanent access URL
// server-side; the URL is never returned to the client, only whether it's set
export const claimSimplefinToken = async (
  id: number,
  setup_token: string
): Promise<Pick<HouseholdSecretsFlags, "simplefin_access_url_set" | "simplefin_access_url_suffix">> => {
  const response = await api.post<
    Pick<HouseholdSecretsFlags, "simplefin_access_url_set" | "simplefin_access_url_suffix">
  >(`/household/${id}/simplefin-claim`, { setup_token });
  return response.data;
};

// Adds by email; unknown emails get a placeholder user in this household
export const addHouseholdMember = async (
  household_id: number,
  email: string
): Promise<User> => {
  const response = await api.post<{ user: User }>(
    `/household/${household_id}/members/`,
    { email }
  );
  return response.data.user;
};

export const createAccount = async (account: {
  description: string;
  type: string;
  bank: string;
  user_id: number;
}): Promise<Account> => {
  const response = await api.post<{ account: Account }>(
    "/accounts/create/",
    account
  );
  return response.data.account;
};

export const updateAccount = async (
  id: number,
  updates: {
    description?: string;
    type?: string;
    bank?: string;
    user_id?: number;
  }
): Promise<Account> => {
  const response = await api.put<{ account: Account }>(
    `/accounts/${id}`,
    updates
  );
  return response.data.account;
};

// SimpleFin account onboarding wizard
export const fetchSimplefinAccounts = async (
  household_id: number
): Promise<{ accounts: SimplefinAccount[]; first_fetch: boolean }> => {
  const response = await api.post<{
    accounts: SimplefinAccount[];
    first_fetch: boolean;
  }>("/simplefin/accounts/", { household_id });
  return response.data;
};

export const linkSimplefinAccount = async (
  id: number,
  household_id: number,
  updates: {
    bank_account_id?: number | null;
    new_account?: { description: string; type: string; bank: string; user_id: number };
  }
): Promise<SimplefinAccount> => {
  const response = await api.put<SimplefinAccount>(
    `/simplefin/accounts/${id}/link`,
    { household_id, ...updates }
  );
  return response.data;
};

// Pulls the last 3 months of transactions for one already-linked SimpleFin
// account (vs. importSimplefinTransactions below, which runs every linked
// account in the household)
export const refreshSimplefinAccountTransactions = async (
  id: number,
  household_id: number,
): Promise<SimplefinAccount & { imported: number; duplicates: number }> => {
  const response = await api.put<SimplefinAccount & { imported: number; duplicates: number }>(
    `/simplefin/accounts/${id}/refresh`,
    { household_id }
  );
  return response.data;
};

// Manually run the SimpleFin import (same logic as the daily cron) for
// every linked account in the household
export const importSimplefinTransactions = async (
  household_id: number
): Promise<SimplefinImportResult> => {
  const response = await api.post<SimplefinImportResult>("/simplefin/import/", {
    household_id,
  });
  return response.data;
};

// Fetch households
export const getHousehold = async (
  user_id: number
): Promise<{ household: Household }> => {
  const response = await api.post<{ household: Household }>("/household/", {
    user_id,
  });
  return response.data;
};

// Creates a Stripe Checkout session for the household's $4.99/mo
// subscription; redirect the browser to the returned url
export const createCheckoutSession = async (
  household_id: number
): Promise<{ url: string }> => {
  const response = await api.post<{ url: string }>(
    "/billing/checkout-session/",
    { household_id }
  );
  return response.data;
};

// Creates a Stripe Billing Portal session (manage payment method, cancel,
// view invoices); redirect the browser to the returned url. Only works
// once the household has a Stripe customer (subscribed at least once).
export const createPortalSession = async (
  household_id: number
): Promise<{ url: string }> => {
  const response = await api.post<{ url: string }>(
    "/billing/portal-session/",
    { household_id }
  );
  return response.data;
};

// Fetch users
export const getUsers = async (
  house_hold_id: number
): Promise<{ users: User[] }> => {
  const response = await api.get<{ users: User[] }>("/users/", {
    params: { house_hold_id },
  });
  return response.data;
};

// Fetch accounts
export const getAccounts = async (
  user_id: number
): Promise<{ accounts: Account[] }> => {
  const response = await api.post<{ accounts: Account[] }>("/accounts/", {
    user_id,
  });
  return response.data;
};

// Fetch transactions
export const getTransactions = async (
  user_id: number,
  household_id: number,
  type: string | null = null,
  from_date?: string,
): Promise<Transaction[]> => {
  const data: Record<string, any> = {
    user_id,
    household_id,
    type,
  };
  if (from_date) data.from_date = from_date;
  try {
    const response = await api.get("/transactions/", {
      params: data,
    });
    return response.data.all_transactions;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Save (update) a transaction
export const saveTransaction = async (
  transaction: Transaction
): Promise<Transaction> => {
  const response = await api.put<{ transaction: Transaction }>(
    `/transactions/save`,
    transaction
  );
  return response.data.transaction;
};

export const uploadTransactions = async (
  accountId: number,
  importFile: File
): Promise<{ imported_transactions: Transaction[]; duplicate_transactions: DuplicateTransaction[] }> => {
  const formData = new FormData();
  formData.append("accountId", accountId.toString());
  formData.append("importFile", importFile);

  const response = await api.post(`/transactions/upload/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const forceImportTransaction = async (
  duplicate: DuplicateTransaction
): Promise<Transaction> => {
  const response = await api.post<Transaction>("/transactions/force-import/", {
    description: duplicate.description,
    date: new Date(duplicate.date).toISOString(),
    amount: duplicate.amount,
    account_id: duplicate.account_id,
  });
  return response.data;
};

// Category rules
export const getCategoryRules = async (
  household_id: number
): Promise<CategoryRule[]> => {
  const response = await api.get<{ rules: CategoryRule[] }>(
    "/category-rules/",
    { params: { household_id } }
  );
  return response.data.rules;
};

export const createCategoryRule = async (
  rule: Omit<CategoryRule, "id" | "created" | "modified">
): Promise<CategoryRule> => {
  const response = await api.post<{ rule: CategoryRule }>(
    "/category-rules/",
    rule
  );
  return response.data.rule;
};

export const deleteCategoryRule = async (id: number): Promise<void> => {
  await api.delete(`/category-rules/${id}`);
};

// Budget targets
export const getBudgetTargets = async (
  household_id: number
): Promise<BudgetTarget[]> => {
  const response = await api.get<{ targets: BudgetTarget[] }>(
    "/budget-targets/",
    { params: { household_id } }
  );
  return response.data.targets;
};

// Upserts by category on the backend
export const saveBudgetTarget = async (target: {
  household_id: number;
  category: string;
  monthly_limit: number;
}): Promise<BudgetTarget> => {
  const response = await api.post<{ target: BudgetTarget }>(
    "/budget-targets/",
    target
  );
  return response.data.target;
};

export const deleteBudgetTarget = async (id: number): Promise<void> => {
  await api.delete(`/budget-targets/${id}`);
};

// Net worth items
export const getNetWorthItems = async (
  household_id: number
): Promise<NetWorthItem[]> => {
  const response = await api.get<{ items: NetWorthItem[] }>(
    "/net-worth/items/",
    { params: { household_id } }
  );
  return response.data.items;
};

export const createNetWorthItem = async (item: {
  household_id: number;
  account_id?: number | null;
  name: string;
  kind: "asset" | "debt";
  type: string;
  interest_rate?: number | null;
  minimum_payment?: number | null;
  initial_balance?: number | null;
  balance_date?: string | null;
}): Promise<NetWorthItem> => {
  const response = await api.post<{ item: NetWorthItem }>(
    "/net-worth/items/",
    item
  );
  return response.data.item;
};

export const updateNetWorthItem = async (
  id: number,
  updates: {
    name?: string;
    account_id?: number | null;
    type?: string;
    interest_rate?: number | null;
    minimum_payment?: number | null;
  }
): Promise<NetWorthItem> => {
  const response = await api.put<{ item: NetWorthItem }>(
    `/net-worth/items/${id}`,
    updates
  );
  return response.data.item;
};

export const deleteNetWorthItem = async (id: number): Promise<void> => {
  await api.delete(`/net-worth/items/${id}`);
};

export const addBalanceEntry = async (
  item_id: number,
  balance: number,
  effective_date?: string
): Promise<BalanceEntry> => {
  const data: Record<string, any> = { balance };
  if (effective_date) data.effective_date = effective_date;
  const response = await api.post<{ entry: BalanceEntry }>(
    `/net-worth/items/${item_id}/balances/`,
    data
  );
  return response.data.entry;
};

export const deleteBalanceEntry = async (id: number): Promise<void> => {
  await api.delete(`/net-worth/balances/${id}`);
};

export const getNetWorthSummary = async (
  household_id: number,
  months = 12
): Promise<NetWorthSummary> => {
  const response = await api.get<NetWorthSummary>("/net-worth/summary/", {
    params: { household_id, months },
  });
  return response.data;
};

// Generate budget analysis
export const generateBudgetAnalysis = async (
  user_id: number,
  household_id: number,
  from_date?: string,
  to_date?: string,
  force = false
): Promise<{ analysis: BudgetAnalysis; cached: boolean }> => {
  const data: any = {
    user_id,
    household_id,
  };
  if (from_date) data.from_date = from_date;
  if (to_date) data.to_date = to_date;
  if (force) data.force = true;

  const response = await api.post("/budget-analysis/", data);
  return response.data;
};

// Import errors logged by the cron importer
export const getImportErrors = async (
  household_id: number
): Promise<ImportError[]> => {
  const response = await api.get<{ errors: ImportError[] }>(
    "/import-errors/",
    { params: { household_id } }
  );
  return response.data.errors;
};

export const deleteImportError = async (id: number): Promise<void> => {
  await api.delete(`/import-errors/${id}`);
};

// Get latest budget analysis
export const getLatestBudgetAnalysis = async (
  household_id: number
): Promise<BudgetAnalysis | null> => {
  try {
    const response = await api.get("/budget-analysis/", {
      params: { household_id },
    });
    return response.data.analysis;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
