import { fetchApi } from './api';
import type { MonthlyData } from '../types';

interface MonthlyDataResponse {
  success: boolean;
  data: MonthlyData;
  error?: string;
}

export const monthlyDataService = {
  async get(userId: string, year: number, month: number): Promise<MonthlyData> {
    try {
      const response = await fetchApi<MonthlyDataResponse>(
        `/monthlydata?userId=${userId}&year=${year}&month=${month}`
      );
      
      if (response.success) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch monthly data');
    } catch (error) {
      // If not found (404), create new monthly data
      if (error instanceof Error && error.message.toLowerCase().includes('not found')) {
        return this.create(userId, year, month);
      }
      throw error;
    }
  },

  async create(userId: string, year: number, month: number): Promise<MonthlyData> {
    const response = await fetchApi<MonthlyDataResponse>('/monthlydata', {
      method: 'POST',
      body: JSON.stringify({ userId, year, month }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create monthly data');
    }

    return response.data;
  },

  async updateWallet(id: string, amount: number): Promise<void> {
    const response = await fetchApi<MonthlyDataResponse>(`/monthlydata/${id}/wallet`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update wallet');
    }
  },

  async copyFromPrevious(id: string): Promise<MonthlyData> {
    const response = await fetchApi<MonthlyDataResponse>(`/monthlydata/${id}/copy-from-previous`, {
      method: 'POST',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to copy from previous month');
    }

    return response.data;
  }
};
