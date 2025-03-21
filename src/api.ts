import axios from "axios";
import type { Household, User, Transaction } from "./types";

// Create Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Ensures cookies (for Google Login)
});

export default api

// Fetch households
export const getHouseholds = async (): Promise<Household[]> => {
  const response = await api.get<Household[]>("/households");
  return response.data;
};

// Fetch users
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users");
  return response.data;
};

// Fetch transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get<Transaction[]>("/transactions");
  return response.data;
};

// Add a transaction
export const addTransaction = async (
  transaction: Omit<Transaction, "id">
): Promise<Transaction> => {
  const response = await api.post<Transaction>("/transactions", transaction);
  return response.data;
};
