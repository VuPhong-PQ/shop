import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  staffId: number;
  fullName: string;
  username: string;
  email?: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Kiểm tra localStorage khi component mount
    const savedUser = localStorage.getItem("user");
    const savedAuth = localStorage.getItem("isAuthenticated");

    if (savedUser && savedAuth === "true") {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const refreshPermissions = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/Staff/refresh-permissions/${user.staffId}`);
      if (response.ok) {
        const userData = await response.json();
        const updatedUser: User = {
          staffId: userData.staffId,
          fullName: userData.fullName,
          username: userData.username,
          email: userData.email,
          roleId: userData.roleId,
          roleName: userData.roleName,
          permissions: userData.permissions,
          lastLogin: userData.lastLogin
        };
        
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error refreshing permissions:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    refreshPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
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