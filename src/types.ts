// src/types.ts

export interface Household {
  id: number;
  name: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created: string;
  modified: string;
}

export interface Transaction {
  id: number;
  description: string;
  category: string;
  sub_category: string;
  amount: number;
  user_id: number;
  type: string;
  need: boolean;
  date: string;
  account_id: number;
}

export interface Account {
  id: number;
  description: string;
  type: string;
  bank: string;
  user_id: number;
}

export interface Category {
  description: string;
}

export interface Sub_Category {
  description: string;
}

export interface BudgetAnalysis {
  id: number;
  household_id: number;
  analysis: string;
  from_date: string;
  to_date: string;
  transaction_count: number;
  created: string;
  modified: string;
}
