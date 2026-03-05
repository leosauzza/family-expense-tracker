import type { MonthlyData, SharedExpenseView, CalculationResult, SharedExpense, SharedExpenseType } from '../types';

export function calculateTotals(expenses: { amountARS: number; amountUSD: number; isPaid: boolean }[]): { ars: number; usd: number } {
  return expenses.reduce(
    (acc, expense) => {
      if (!expense.isPaid) {
        acc.ars += expense.amountARS;
        acc.usd += expense.amountUSD;
      }
      return acc;
    },
    { ars: 0, usd: 0 }
  );
}

export function calculateThirdPartyTotals(lists: { expenses: { amountARS: number; amountUSD: number; isPaid: boolean }[] }[]): { ars: number; usd: number } {
  return lists.reduce(
    (acc, list) => {
      const listTotals = calculateTotals(list.expenses);
      acc.ars += listTotals.ars;
      acc.usd += listTotals.usd;
      return acc;
    },
    { ars: 0, usd: 0 }
  );
}

// Filter shared expenses by type
function filterSharedExpensesByType(
  expenses: SharedExpense[], 
  type: SharedExpenseType
): SharedExpense[] {
  return expenses.filter(e => (e.expenseType || 'SplitWithAllSystemUsers') === type);
}

export function calculateFinalBalance(
  monthlyData: MonthlyData,
  sharedByOthers: SharedExpenseView[],
  coupleBalance?: { ars: number; usd: number }
): CalculationResult {
  const walletAmount = monthlyData.walletAmount;
  const walletAmountUSD = monthlyData.walletAmountUSD;

  const coupleBalanceARS = coupleBalance?.ars ?? 0;
  const coupleBalanceUSD = coupleBalance?.usd ?? 0;

  // Merge shared expenses from current user and others
  const allSharedExpenses = [...monthlyData.sharedExpensesByCurrentUser, ...sharedByOthers];

  // Third party expenses (only unpaid) - from ThirdPartyExpenseList
  const thirdPartyTotals = calculateThirdPartyTotals(monthlyData.thirdPartyExpenseLists);

  // Fixed expenses (only unpaid)
  const fixedTotals = calculateTotals(monthlyData.fixedExpenses);

  // Split shared expenses by type
  const systemSharedExpenses = filterSharedExpensesByType(
    allSharedExpenses,
    'SplitWithAllSystemUsers'
  );
  const systemUserExpenses = filterSharedExpensesByType(
    allSharedExpenses,
    'ForSpecificSystemUser'
  );
  const externalSharedExpenses = filterSharedExpensesByType(
    allSharedExpenses,
    'SplitWithExternalParties'
  );

  // Calculate totals by type (only unpaid)
  const systemSharedTotals = calculateTotals(systemSharedExpenses);
  const systemUserTotals = calculateTotals(systemUserExpenses);
  const externalSharedTotals = calculateTotals(externalSharedExpenses);

  // Shared by others (only unpaid) - only count SplitWithAllSystemUsers from others
  const sharedByOthersFiltered = sharedByOthers.filter(
    e => (e.expenseType || 'SplitWithAllSystemUsers') === 'SplitWithAllSystemUsers'
  );
  const sharedByOthersTotals = calculateTotals(sharedByOthersFiltered);

  // Final balance calculation:
  // Wallet - FixedExpenses + ThirdParty + ExpensesPaidByMeForOthers100% + CoupleBalance - (ExternalShared / 2)

  // External shared: split 50/50
  const externalSharedPortionARS = externalSharedTotals.ars / 2;
  const externalSharedPortionUSD = externalSharedTotals.usd / 2;

  const finalBalanceARS = walletAmount
    - fixedTotals.ars
    + thirdPartyTotals.ars
    + systemUserTotals.ars
    + coupleBalanceARS
    - externalSharedPortionARS;

  const finalBalanceUSD = walletAmountUSD
    - fixedTotals.usd
    + thirdPartyTotals.usd
    + systemUserTotals.usd
    + coupleBalanceUSD
    - externalSharedPortionUSD;

  return {
    walletAmount,
    walletAmountUSD,
    thirdPartyTotalARS: thirdPartyTotals.ars,
    thirdPartyTotalUSD: thirdPartyTotals.usd,
    fixedExpensesTotalARS: fixedTotals.ars,
    fixedExpensesTotalUSD: fixedTotals.usd,
    sharedByUserTotalARS: systemSharedTotals.ars,
    sharedByUserTotalUSD: systemSharedTotals.usd,
    sharedByOthersTotalARS: sharedByOthersTotals.ars,
    sharedByOthersTotalUSD: sharedByOthersTotals.usd,
    // New fields
    systemUserExpensesTotalARS: systemUserTotals.ars,
    systemUserExpensesTotalUSD: systemUserTotals.usd,
    externalSharedExpensesTotalARS: externalSharedTotals.ars,
    externalSharedExpensesTotalUSD: externalSharedTotals.usd,
    finalBalanceARS,
    finalBalanceUSD
  };
}

// Calculate what others owe me (for TheyOweMe component)
export interface TheyOweMeBreakdown {
  thirdPartyARS: number;
  thirdPartyUSD: number;
  systemUserARS: number;
  systemUserUSD: number;
  externalSharedARS: number;
  externalSharedUSD: number;
  sharedSplitARS: number;
  sharedSplitUSD: number;
  totalARS: number;
  totalUSD: number;
}

export function calculateTheyOweMeDetailed(
  monthlyData: MonthlyData,
  sharedByOthers: SharedExpenseView[],
  totalSystemUsers: number
): TheyOweMeBreakdown {
  // Third party totals
  const thirdPartyTotals = calculateThirdPartyTotals(monthlyData.thirdPartyExpenseLists);

  // Merge shared expenses from current user and others
  const allSharedExpenses = [...monthlyData.sharedExpensesByCurrentUser, ...sharedByOthers];

  // Split shared expenses by type
  const systemSharedExpenses = filterSharedExpensesByType(
    allSharedExpenses,
    'SplitWithAllSystemUsers'
  );
  const systemUserExpenses = filterSharedExpensesByType(
    allSharedExpenses,
    'ForSpecificSystemUser'
  );
  const externalSharedExpenses = filterSharedExpensesByType(
    allSharedExpenses,
    'SplitWithExternalParties'
  );

  const systemSharedTotals = calculateTotals(systemSharedExpenses);
  const systemUserTotals = calculateTotals(systemUserExpenses);
  const externalSharedTotals = calculateTotals(externalSharedExpenses);

  // Shared by others - only SplitWithAllSystemUsers
  const sharedByOthersFiltered = sharedByOthers.filter(
    e => (e.expenseType || 'SplitWithAllSystemUsers') === 'SplitWithAllSystemUsers'
  );
  const sharedByOthersTotals = calculateTotals(sharedByOthersFiltered);

  // Shared split calculation (what others owe me from shared expenses)
  const sharedSplitARS = ((systemSharedTotals.ars + sharedByOthersTotals.ars) / totalSystemUsers) - systemSharedTotals.ars;
  const sharedSplitUSD = ((systemSharedTotals.usd + sharedByOthersTotals.usd) / totalSystemUsers) - systemSharedTotals.usd;

  // External shared: assuming external party owes half
  const externalSharedOwedARS = externalSharedTotals.ars / 2;
  const externalSharedOwedUSD = externalSharedTotals.usd / 2;

  const totalARS = thirdPartyTotals.ars + systemUserTotals.ars + externalSharedOwedARS + sharedSplitARS;
  const totalUSD = thirdPartyTotals.usd + systemUserTotals.usd + externalSharedOwedUSD + sharedSplitUSD;

  return {
    thirdPartyARS: thirdPartyTotals.ars,
    thirdPartyUSD: thirdPartyTotals.usd,
    systemUserARS: systemUserTotals.ars,
    systemUserUSD: systemUserTotals.usd,
    externalSharedARS: externalSharedOwedARS,
    externalSharedUSD: externalSharedOwedUSD,
    sharedSplitARS: sharedSplitARS,
    sharedSplitUSD: sharedSplitUSD,
    totalARS,
    totalUSD
  };
}

export interface CoupleBalanceResult {
  userAShare: { ars: number; usd: number };
  userBShare: { ars: number; usd: number };
  userAPaidForB: { ars: number; usd: number };
  userBPaidForA: { ars: number; usd: number };
  finalBalance: { ars: number; usd: number };
  userAOwes: boolean;
}

export function calculateCoupleBalance(
  userAShared: SharedExpense[],
  userBShared: SharedExpense[],
  userAPaidForB: SharedExpense[],
  userBPaidForA: SharedExpense[]
): CoupleBalanceResult {
  const userASharedTotal = userAShared
    .filter(e => !e.isPaid)
    .reduce((sum, e) => ({ ars: sum.ars + e.amountARS, usd: sum.usd + e.amountUSD }), { ars: 0, usd: 0 });

  const userBSharedTotal = userBShared
    .filter(e => !e.isPaid)
    .reduce((sum, e) => ({ ars: sum.ars + e.amountARS, usd: sum.usd + e.amountUSD }), { ars: 0, usd: 0 });

  const userAPaidForBTotal = userAPaidForB
    .filter(e => !e.isPaid)
    .reduce((sum, e) => ({ ars: sum.ars + e.amountARS, usd: sum.usd + e.amountUSD }), { ars: 0, usd: 0 });

  const userBPaidForATotal = userBPaidForA
    .filter(e => !e.isPaid)
    .reduce((sum, e) => ({ ars: sum.ars + e.amountARS, usd: sum.usd + e.amountUSD }), { ars: 0, usd: 0 });

  const userAOwesFromShared = userASharedTotal.ars / 2;
  const userBOwesFromShared = userBSharedTotal.ars / 2;

  const balanceARS = (userAOwesFromShared - userBOwesFromShared) + (userAPaidForBTotal.ars - userBPaidForATotal.ars);
  const balanceUSD = (userASharedTotal.usd / 2 - userBSharedTotal.usd / 2) + (userAPaidForBTotal.usd - userBPaidForATotal.usd);

  const userAOwes = balanceARS < 0 || (balanceARS === 0 && balanceUSD < 0);

  return {
    userAShare: { ars: userASharedTotal.ars / 2, usd: userASharedTotal.usd / 2 },
    userBShare: { ars: userBSharedTotal.ars / 2, usd: userBSharedTotal.usd / 2 },
    userAPaidForB: userAPaidForBTotal,
    userBPaidForA: userBPaidForATotal,
    finalBalance: { ars: Math.abs(balanceARS), usd: Math.abs(balanceUSD) },
    userAOwes
  };
}
