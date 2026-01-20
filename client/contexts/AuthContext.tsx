import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
  gamesPlayed: number;
  wins: number;
  topRank: number;
  isAdmin: boolean;
}

interface AuthCheckResult {
  exists: boolean;
  hasPassword: boolean;
  userId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  checkUsername: (username: string) => Promise<AuthCheckResult>;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setPassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  hasPassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@squad_party_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const localUser = JSON.parse(stored);
        setUser(localUser);
        
        try {
          const res = await apiRequest("GET", `/api/users/${localUser.id}`);
          const serverUser = await res.json();
          setUser(serverUser);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
          
          // Check if user has password
          const checkRes = await apiRequest("GET", `/api/auth/check/${serverUser.username}`);
          const checkData = await checkRes.json();
          setHasPassword(checkData.hasPassword);
        } catch (error) {
          console.log("Could not sync with server, using local data");
        }
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsername = async (username: string): Promise<AuthCheckResult> => {
    try {
      const res = await apiRequest("GET", `/api/auth/check/${encodeURIComponent(username)}`);
      return await res.json();
    } catch (error) {
      console.error("Failed to check username:", error);
      return { exists: false, hasPassword: false };
    }
  };

  const login = async (username: string, password?: string) => {
    // First check if user exists and has password
    const checkResult = await checkUsername(username);
    
    if (checkResult.exists && checkResult.hasPassword) {
      // User exists with password - must authenticate
      if (!password) {
        throw new Error("PASSWORD_REQUIRED");
      }
      
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Invalid password");
      }
      
      const serverUser = await res.json();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
      setUser(serverUser);
      setHasPassword(true);
    } else if (checkResult.exists) {
      // User exists without password - just log in
      const res = await apiRequest("GET", `/api/users/${checkResult.userId}`);
      const serverUser = await res.json();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
      setUser(serverUser);
      setHasPassword(false);
    } else {
      // New user - create account
      const userId = `user_${Date.now()}`;
      const newUser: User = {
        id: userId,
        username,
        avatarUrl: null,
        gamesPlayed: 0,
        wins: 0,
        topRank: 0,
        isAdmin: false,
      };
      
      try {
        const res = await apiRequest("POST", "/api/users", newUser);
        const serverUser = await res.json();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
        setUser(serverUser);
        setHasPassword(false);
      } catch (error) {
        console.error("Failed to sync user to server, saving locally:", error);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
      }
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    
    try {
      const res = await apiRequest("PUT", `/api/users/${user.id}`, updated);
      const serverUser = await res.json();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser));
      setUser(serverUser);
    } catch (error) {
      console.error("Failed to sync profile update:", error);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
    }
  };

  const setPassword = async (newPassword: string, currentPassword?: string) => {
    if (!user) throw new Error("Not logged in");
    
    const res = await apiRequest("POST", `/api/users/${user.id}/password`, {
      currentPassword,
      newPassword,
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to set password");
    }
    
    setHasPassword(true);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, checkUsername, login, logout, updateProfile, setPassword, hasPassword }}>
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
