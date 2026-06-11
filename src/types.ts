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

export interface DuplicateTransaction {
  id: null;
  description: string;
  date: string;
  amount: number;
  account_id: number;
  category: string;
  sub_category: string;
  type: string;
  need: boolean;
  import_sequence: number;
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

export interface CategoryRule {
  id: number;
  household_id: number;
  match_text: string;
  category: string;
  sub_category: string;
  need: boolean;
  created: string;
  modified: string;
}

export interface BudgetTarget {
  id: number;
  household_id: number;
  category: string;
  monthly_limit: number;
  created: string;
  modified: string;
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
