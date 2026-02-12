import { fetchApi } from './api';
import type { User } from '../types';

interface UserResponse {
  success: boolean;
  data: User[];
  error?: string;
}

interface SingleUserResponse {
  success: boolean;
  data: User | null;
  error?: string;
}

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await fetchApi<UserResponse>('/users');
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch users');
    }
    return response.data;
  },

  async getBySlug(slug: string): Promise<User | null> {
    const response = await fetchApi<SingleUserResponse>(`/users/${slug}`);
    if (!response.success) {
      return null;
    }
    return response.data;
  },

  async getById(id: string): Promise<User | null> {
    const users = await this.getAll();
    return users.find(u => u.id === id) || null;
  }
};
