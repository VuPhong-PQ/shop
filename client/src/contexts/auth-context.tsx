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
  storeId?: number;
  storeName?: string;
}

interface Store {
  storeId: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  currentStore: Store | null;
  availableStores: Store[];
  login: (userData: User) => void;
  logout: () => void;
  switchStore: (storeId: number) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
  loadAvailableStores: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);

  useEffect(() => {
    // Kiểm tra localStorage khi component mount
    const savedUser = localStorage.getItem("user");
    const savedAuth = localStorage.getItem("isAuthenticated");
    const savedStore = localStorage.getItem("currentStore");

    if (savedUser && savedAuth === "true") {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        if (savedStore) {
          const storeData = JSON.parse(savedStore);
          setCurrentStore(storeData);
        }
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("currentStore");
      }
    }
  }, []);

  useEffect(() => {
    // Load available stores when authenticated
    if (isAuthenticated) {
      loadAvailableStores();
    }
  }, [isAuthenticated]);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentStore(null);
    setAvailableStores([]);
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentStore");
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
          lastLogin: userData.lastLogin,
          storeId: userData.storeId,
          storeName: userData.storeName
        };
        
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error refreshing permissions:", error);
    }
  };

  const loadAvailableStores = async (): Promise<void> => {
    try {
      const response = await fetch('/api/Stores');
      if (response.ok) {
        const stores = await response.json();
        setAvailableStores(stores);
      }
    } catch (error) {
      console.error("Error loading stores:", error);
    }
  };

  const switchStore = async (storeId: number): Promise<void> => {
    try {
      const selectedStore = availableStores.find(s => s.storeId === storeId);
      if (selectedStore) {
        setCurrentStore(selectedStore);
        if (user) {
          const updatedUser = { ...user, storeId, storeName: selectedStore.name };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          localStorage.setItem("currentStore", JSON.stringify(selectedStore));
        }
      }
    } catch (error) {
      console.error("Error switching store:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    currentStore,
    availableStores,
    login,
    logout,
    switchStore,
    hasPermission,
    refreshPermissions,
    loadAvailableStores
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