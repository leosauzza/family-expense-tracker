import { fetchApi } from './api';
import type { FixedExpense, SharedExpense, ThirdPartyExpense, ThirdPartyExpenseList } from '../types';

// Fixed Expenses Service
export const fixedExpenseService = {
  async create(expense: Omit<FixedExpense, 'id'>): Promise<FixedExpense> {
    return fetchApi<FixedExpense>('/fixedexpenses', {
      method: 'POST',
      body: JSON.stringify({
        monthlyDataId: expense.monthlyDataId,
        detail: expense.detail,
        amountARS: expense.amountARS,
        amountUSD: expense.amountUSD,
        isPaid: expense.isPaid,
      }),
    });
  },

  async update(id: string, expense: Partial<FixedExpense>): Promise<FixedExpense> {
    return fetchApi<FixedExpense>(`/fixedexpenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        detail: expense.detail,
        amountARS: expense.amountARS,
        amountUSD: expense.amountUSD,
        isPaid: expense.isPaid,
      }),
    });
  },

  async delete(id: string): Promise<void> {
    await fetchApi<void>(`/fixedexpenses/${id}`, {
      method: 'DELETE',
    });
  },

  async togglePaid(id: string, isPaid: boolean): Promise<void> {
    await fetchApi<void>(`/fixedexpenses/${id}/toggle-paid`, {
      method: 'PUT',
      body: JSON.stringify({ isPaid }),
    });
  }
};

// Shared Expenses Service
export const sharedExpenseService = {
  async create(expense: Omit<SharedExpense, 'id'> & { 
    expenseType?: string;
    externalParties?: string[];
    targetUserId?: string | null;
  }): Promise<SharedExpense> {
    return fetchApi<SharedExpense>('/sharedexpenses', {
      method: 'POST',
      body: JSON.stringify({
        monthlyDataId: expense.monthlyDataId,
        detail: expense.detail,
        amountARS: expense.amountARS,
        amountUSD: expense.amountUSD,
        isPaid: expense.isPaid,
        expenseType: expense.expenseType || 'SplitWithAllSystemUsers',
        externalParties: expense.externalParties || [],
        targetUserId: expense.targetUserId,
      }),
    });
  },

  async update(id: string, expense: Partial<SharedExpense>): Promise<SharedExpense> {
    return fetchApi<SharedExpense>(`/sharedexpenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        detail: expense.detail,
        amountARS: expense.amountARS,
        amountUSD: expense.amountUSD,
        isPaid: expense.isPaid,
      }),
    });
  },

  async delete(id: string): Promise<void> {
    await fetchApi<void>(`/sharedexpenses/${id}`, {
      method: 'DELETE',
    });
  },

  async togglePaid(id: string, isPaid: boolean): Promise<void> {
    await fetchApi<void>(`/sharedexpenses/${id}/toggle-paid`, {
      method: 'PUT',
      body: JSON.stringify({ isPaid }),
    });
  },

  async getPaidByOthers(userId: string, year: number, month: number): Promise<(SharedExpense & { paidByUserName: string })[]> {
    return fetchApi<(SharedExpense & { paidByUserName: string })[]>(
      `/sharedexpenses/paid-by-others?userId=${userId}&year=${year}&month=${month}`
    );
  },

  async getPaidForMe(userId: string, year: number, month: number): Promise<(SharedExpense & { paidByUserName: string })[]> {
    return fetchApi<(SharedExpense & { paidByUserName: string })[]>(
      `/sharedexpenses/paid-for-me?userId=${userId}&year=${year}&month=${month}`
    );
  }
};

// Third Party Expenses Service
export const thirdPartyService = {
  // List operations
  async createList(list: Omit<ThirdPartyExpenseList, 'id' | 'expenses'>): Promise<ThirdPartyExpenseList> {
    return fetchApi<ThirdPartyExpenseList>('/thirdpartyexpenses/lists', {
      method: 'POST',
      body: JSON.stringify({
        monthlyDataId: list.monthlyDataId,
        name: list.name,
      }),
    });
  },

  async updateListName(id: string, name: string): Promise<void> {
    await fetchApi<void>(`/thirdpartyexpenses/lists/${id}/name`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  async deleteList(id: string): Promise<void> {
    await fetchApi<void>(`/thirdpartyexpenses/lists/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderLists(items: { id: string; order: number }[]): Promise<void> {
    await fetchApi<void>('/thirdpartyexpenses/lists/reorder', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  // Expense operations
  async createExpense(expense: Omit<ThirdPartyExpense, 'id'>): Promise<ThirdPartyExpense> {
    return fetchApi<ThirdPartyExpense>(`/thirdpartyexpenses/lists/${expense.thirdPartyExpenseListId}/expenses`, {
      method: 'POST',
      body: JSON.stringify({
        listId: expense.thirdPartyExpenseListId,
        detail: expense.detail,
        amountARS: expense.amountARS,
        amountUSD: expense.amountUSD,
        isPaid: expense.isPaid,
      }),
    });
  },

  async updateExpense(id: string, expense: Partial<ThirdPartyExpense>): Promise<ThirdPartyExpense> {
    return fetchApi<ThirdPartyExpense>(`/thirdpartyexpenses/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        detail: expense.detail,
        amountARS: expense.amountARS,
        amountUSD: expense.amountUSD,
        isPaid: expense.isPaid,
      }),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    await fetchApi<void>(`/thirdpartyexpenses/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleExpensePaid(id: string, isPaid: boolean): Promise<void> {
    await fetchApi<void>(`/thirdpartyexpenses/expenses/${id}/toggle-paid`, {
      method: 'PUT',
      body: JSON.stringify({ isPaid }),
    });
  }
};
