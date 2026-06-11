import axios from "axios";
import type { Household, User, Transaction, Account, BudgetAnalysis, DuplicateTransaction, CategoryRule, BudgetTarget } from "./types";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Authorization: "Bearer your-token",
  },
  //   withCredentials: true, // Ensures cookies (for Google Login)
});

export default api;


// Login (email-only, no password)
export const login = async (email: string): Promise<User> => {
  const response = await api.post<User>("/auth/login/", { email });
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
  accountId: Number,
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
