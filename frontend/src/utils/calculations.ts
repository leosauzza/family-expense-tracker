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
  totalSystemUsers: number
): CalculationResult {
  const walletAmount = monthlyData.walletAmount;
  
  // Third party expenses (only unpaid) - from ThirdPartyExpenseList
  const thirdPartyTotals = calculateThirdPartyTotals(monthlyData.thirdPartyExpenseLists);
  
  // Fixed expenses (only unpaid)
  const fixedTotals = calculateTotals(monthlyData.fixedExpenses);
  
  // Split shared expenses by type
  const systemSharedExpenses = filterSharedExpensesByType(
    monthlyData.sharedExpensesPaidByUser, 
    'SplitWithAllSystemUsers'
  );
  const systemUserExpenses = filterSharedExpensesByType(
    monthlyData.sharedExpensesPaidByUser, 
    'ForSpecificSystemUser'
  );
  const externalSharedExpenses = filterSharedExpensesByType(
    monthlyData.sharedExpensesPaidByUser, 
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
  
  // Calculate shared portion (only SplitWithAllSystemUsers are split among all users)
  const sharedSumARS = (sharedByOthersTotals.ars + systemSharedTotals.ars) / totalSystemUsers;
  const sharedSumUSD = (sharedByOthersTotals.usd + systemSharedTotals.usd) / totalSystemUsers;
  
  // For "They Owe Me" calculation:
  // - Third party expenses: 100% is owed to me
  // - System user expenses: these are paid BY me FOR another user, so they owe me 100%
  // - External shared expenses: depends on split, but by default the external party owes their portion
  //   For simplicity, we'll treat external shared as 50% owed to me (external party owes half)
  
  // Final balance calculation:
  // Wallet + ThirdParty + SystemUserExpenses + (ExternalShared / 2) - Fixed + (SystemSharedSplit)
  const externalSharedPortionARS = externalSharedTotals.ars / 2; // Assuming 50/50 split with external
  const externalSharedPortionUSD = externalSharedTotals.usd / 2;
  
  const finalBalanceARS = walletAmount 
    + thirdPartyTotals.ars 
    + systemUserTotals.ars 
    + externalSharedPortionARS 
    - fixedTotals.ars 
    + sharedSumARS;
    
  const finalBalanceUSD = thirdPartyTotals.usd 
    + systemUserTotals.usd 
    + externalSharedPortionUSD 
    - fixedTotals.usd 
    + sharedSumUSD;
  
  return {
    walletAmount,
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

  // Split shared expenses by type
  const systemSharedExpenses = filterSharedExpensesByType(
    monthlyData.sharedExpensesPaidByUser, 
    'SplitWithAllSystemUsers'
  );
  const systemUserExpenses = filterSharedExpensesByType(
    monthlyData.sharedExpensesPaidByUser, 
    'ForSpecificSystemUser'
  );
  const externalSharedExpenses = filterSharedExpensesByType(
    monthlyData.sharedExpensesPaidByUser, 
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
