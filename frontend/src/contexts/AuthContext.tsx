import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import type { User } from '../types';
import { userService } from '../services/userService';

interface StoredUser {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  currentUser: User | null;
  viewedUser: User | null;
  isViewingOwnData: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setViewedUserBySlug: (slug: string) => Promise<void>;
  checkStoredUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'expense_tracker_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((user: User) => {
    setCurrentUser(user);
    setViewedUser(user);
    const storedUser: StoredUser = {
      id: user.id,
      name: user.name,
      slug: user.slug
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedUser));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setViewedUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setViewedUserBySlug = useCallback(async (slug: string) => {
    const user = await userService.getBySlug(slug);
    if (user) {
      setViewedUser(user);
    }
  }, []);

  const checkStoredUser = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredUser = JSON.parse(stored);
        const user = await userService.getBySlug(parsed.slug);
        if (user) {
          setCurrentUser(user);
          setViewedUser(user);
          return user;
        }
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check localStorage on mount
  useEffect(() => {
    checkStoredUser();
  }, [checkStoredUser]);

  const isViewingOwnData = currentUser?.id === viewedUser?.id;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        viewedUser,
        isViewingOwnData,
        isLoading,
        login,
        logout,
        setViewedUserBySlug,
        checkStoredUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
