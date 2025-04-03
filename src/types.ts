// src/types.ts

export interface Household {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Transaction {
  id: number;
  description: string;
  category: string;
  sub_category: string;
  amount: number;
  user_id: number;
  type: string;
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
