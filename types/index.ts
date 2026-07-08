export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TxType;
  categoryId: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: TxType;
  isDefault?: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  amount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string; // YYYY-MM-DD
  color: string;
}

export type Frequency = "weekly" | "monthly" | "yearly";

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  type: TxType;
  categoryId: string;
  paymentMethod: string;
  frequency: Frequency;
  nextRun: string; // YYYY-MM-DD
  active: boolean;
}

export interface UserProfile {
  displayName: string;
  email: string;
  currency: string;
}
