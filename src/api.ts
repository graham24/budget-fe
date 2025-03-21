import axios from "axios";
import type { Household, User, Transaction } from "./types";

// Create Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
    // Authorization: "Bearer your-token",
  },
  //   withCredentials: true, // Ensures cookies (for Google Login)
});

export default api;

// Fetch households
export const getHousehold = async (): Promise<Household> => {
  const response = await api.post<Household>("/household/", {user_id: 1});
  return response.data;
};

// Fetch users
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users/");
  return response.data;
};

// Fetch transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  const data = {
    user_id: 1,
    household_id: 1,
  };
  try {
    const response = await api.post<Transaction[]>("/transactions/", data);
    return response.data;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Add a transaction
export const addTransaction = async (
  transaction: Omit<Transaction, "id">
): Promise<Transaction> => {
  const response = await api.post<Transaction>("/transactions/", transaction);
  return response.data;
};
