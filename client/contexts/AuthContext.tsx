import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
  gamesPlayed: number;
  wins: number;
  topRank: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@squad_party_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      avatarUrl: null,
      gamesPlayed: 0,
      wins: 0,
      topRank: 0,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
