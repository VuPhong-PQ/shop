import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { AccessDenied } from "./access-denied";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, user, currentStore } = useAuth();
  const [location, setLocation] = useLocation();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    // Skip store check for store-selection page
    if (location === "/store-selection") {
      if (requiredPermission && !hasPermission(requiredPermission)) {
        setShowAccessDenied(true);
        return;
      }
      setShowAccessDenied(false);
      return;
    }

    // Check if user needs to select store (for non-admin users or admin without current store)
    if (user && !currentStore && (user.roleName === "Admin" || !user.storeId)) {
      setLocation("/store-selection");
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      setShowAccessDenied(true);
      return;
    }

    setShowAccessDenied(false);
  }, [isAuthenticated, requiredPermission, hasPermission, setLocation, user, currentStore, location]);

  if (!isAuthenticated) {
    return null;
  }

  if (showAccessDenied) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}