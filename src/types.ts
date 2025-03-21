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
  amount: number;
  user_id: number;
}
