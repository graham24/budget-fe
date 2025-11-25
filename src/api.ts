import axios from "axios";
import type { Household, User, Transaction, Account } from "./types";
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


// Login
export const login = async (): Promise<User> => {
  const response = await api.post<User>("/auth/login/");
  return response.data;
};

// Fetch households
export const getHousehold = async (): Promise<Household> => {
  const response = await api.post<Household>("/household/", { user_id: 1 });
  return response.data;
};

// Fetch users
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users/", {
    params: { house_hold_id: 1 },
  });
  return response.data;
};

// Fetch accounts
export const getAccounts = async (): Promise<Account[]> => {
  const response = await api.post<Account[]>("/accounts/", { user_id: 1 });
  return response.data;
};

// Fetch summary
export const getSummary = async (
  user_id: number,
  household_id: number
): Promise<Account[]> => {
  const data = {
    user_id: user_id,
    household_id: household_id,
  };
  const response = await api.get<Account[]>("/transactions/summary", {
    params: data,
  });
  return response.data;
};

// Fetch transactions
export const getTransactions = async (
  user_id: number,
  household_id: number,
  type: string
): Promise<Transaction[]> => {
  const data = {
    user_id: user_id,
    household_id: household_id,
    type: type,
  };
  try {
    const response = await api.get<Transaction[]>("/transactions/", {
      params: data,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Add a transaction
export const addTransaction = async (
  transaction: Omit<Transaction, "id">
): Promise<Transaction> => {
  const response = await api.post<Transaction>(
    "/transactions/add",
    transaction
  );
  return response.data;
};

// Save (update) a transaction
export const saveTransaction = async (
  transaction: Transaction
): Promise<Transaction> => {
  const response = await api.put<Transaction>(
    `/transactions/save`,
    transaction
  );
  return response.data;
};

export const uploadTransactions = async (
  accountId: Number,
  importFile: File
): Promise<any> => {
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
