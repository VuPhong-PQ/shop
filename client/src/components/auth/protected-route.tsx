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

    // Check if user needs to select store
    // Chỉ redirect đến store-selection nếu user chưa có currentStore VÀ có nhiều stores để chọn
    if (user && !currentStore) {
      // Đối với Admin hoặc user có nhiều stores - cần chọn store
      if (user.roleName === "Admin") {
        setLocation("/store-selection");
        return;
      }
      // Đối với staff không có currentStore - cũng cần đi store-selection để xem thông báo
      // (nếu không có store nào) hoặc để auto-select store duy nhất
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