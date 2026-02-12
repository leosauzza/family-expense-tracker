import { fetchApi } from './api';
import type { ExtractedExpense, ExpenseClassification } from '../types';

export interface AnalyzePdfResponse {
  expenses: ExtractedExpense[];
}

export const creditCardImportService = {
  /**
   * Upload and analyze a PDF credit card statement
   */
  async analyzePdf(file: File, monthlyDataId: string): Promise<ExtractedExpense[]> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('monthlyDataId', monthlyDataId);
    
    // Note: Don't set Content-Type header, let browser set it with boundary
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/creditcardimport/analyze`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.expenses || data; // Handle both wrapped and unwrapped responses
  },

  /**
   * Confirm and create expenses from extracted data
   */
  async confirmImport(monthlyDataId: string, classifications: ExpenseClassification[]): Promise<void> {
    return fetchApi<void>('/creditcardimport/confirm', {
      method: 'POST',
      body: JSON.stringify({ monthlyDataId, classifications }),
    });
  },

  /**
   * Cancel import and cleanup temporary data
   */
  async cancelImport(monthlyDataId: string): Promise<void> {
    await fetchApi<void>(`/creditcardimport/cancel/${monthlyDataId}`, {
      method: 'DELETE',
    });
  }
};

// Helper function (copy from api.ts)
function getBaseUrl(): string {
  const API_URL = import.meta.env.VITE_API_URL || '';
  
  if (API_URL.startsWith('http')) {
    return API_URL;
  }
  
  if (API_URL.startsWith('/')) {
    const hostname = window.location.hostname;
    return `http://${hostname}:3501${API_URL}`;
  }

  const hostname = window.location.hostname;
  return `http://${hostname}:3501/api`;
}
