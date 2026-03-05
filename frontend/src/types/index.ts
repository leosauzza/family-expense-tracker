export interface User {
  id: string;
  name: string;
  slug: string;
  initial: string;
  color: string;
}

export interface Expense {
  id: string;
  detail: string;
  amountARS: number;
  amountUSD: number;
  isPaid: boolean;
}

export interface FixedExpense extends Expense {
  monthlyDataId: string;
}

export type SharedExpenseType = 'SplitWithAllSystemUsers' | 'SplitWithExternalParties' | 'ForSpecificSystemUser';

export interface SharedExpense extends Expense {
  monthlyDataId: string;
  paidByUserId: string;
  paidByUserName?: string;
  paidByUserInitial?: string;
  paidByUserColor?: string;
  expenseType?: SharedExpenseType;
  externalParties?: string[];
  targetUserId?: string | null;
  targetUserName?: string | null;
}

export interface ThirdPartyExpense extends Expense {
  thirdPartyExpenseListId: string;
}

export interface ThirdPartyExpenseList {
  id: string;
  monthlyDataId: string;
  name: string;
  order: number;
  expenses: ThirdPartyExpense[];
}

// Virtual list for grouping shared expenses by type
export interface VirtualExpenseList {
  id: string;
  type: 'externalThirdParty' | 'systemUser' | 'externalShared' | 'systemShared';
  name: string;
  targetUserId?: string;
  targetUserName?: string;
  externalParties?: string[];
  expenses: Array<SharedExpense | ThirdPartyExpense>;
}

export interface MonthlyData {
  id: string;
  userId: string;
  year: number;
  month: number;
  walletAmount: number;
  walletAmountUSD: number;
  dataCopiedFromPreviousMonth: boolean;
  fixedExpenses: FixedExpense[];
  sharedExpensesByCurrentUser: SharedExpense[];
  thirdPartyExpenseLists: ThirdPartyExpenseList[];
}

export interface SharedExpenseView extends SharedExpense {
  paidByUserName?: string;
}

export type ExpenseType = 'fixed' | 'shared' | 'thirdParty';

export interface CalculationResult {
  walletAmount: number;
  walletAmountUSD: number;
  thirdPartyTotalARS: number;
  thirdPartyTotalUSD: number;
  fixedExpensesTotalARS: number;
  fixedExpensesTotalUSD: number;
  sharedByUserTotalARS: number;
  sharedByUserTotalUSD: number;
  sharedByOthersTotalARS: number;
  sharedByOthersTotalUSD: number;
  // New fields for detailed calculations
  systemUserExpensesTotalARS: number;
  systemUserExpensesTotalUSD: number;
  externalSharedExpensesTotalARS: number;
  externalSharedExpensesTotalUSD: number;
  finalBalanceARS: number;
  finalBalanceUSD: number;
}

// Credit Card Import Types
export interface ExtractedExpense {
  id: string;
  detail: string;
  amountARS: number;
  amountUSD: number;
}

export type ExpenseClassificationType = 'personal' | 'shared' | 'otherPerson';
export type SharedWithOption = 'system_family' | 'other';

export interface ExpenseClassification {
  extractedExpenseId: string;
  classificationType: ExpenseClassificationType;
  isSharedWithExternal: boolean;
  sharedWithOption: SharedWithOption;
  externalPartyNames: string[];
  otherPersonUserId: string | null;
  otherPersonName: string | null;
}

export interface ClassifiedExpense extends ExtractedExpense {
  classification: ExpenseClassification;
}

// Virtual list configurations for systemUser and externalShared types
export interface VirtualListConfig {
  id: string;
  type: 'systemUser' | 'externalShared';
  targetUserId?: string;
  targetUserName?: string;
  externalParties?: string[];
}
