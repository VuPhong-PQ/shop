import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { AccessDenied } from "./access-denied";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission } = useAuth();
  const [, setLocation] = useLocation();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      setShowAccessDenied(true);
      return;
    }

    setShowAccessDenied(false);
  }, [isAuthenticated, requiredPermission, hasPermission, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  if (showAccessDenied) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}