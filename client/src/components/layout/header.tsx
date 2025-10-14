import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Bell, Plus, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/auth-context";
import { RefreshPermissionsButton } from "@/components/debug/refresh-permissions-button";
import StoreSwitcher from "@/components/StoreSwitcher";
import StoreInfoHeader from "@/components/StoreInfoHeader";

interface HeaderProps {
  title: string;
  onToggleNotifications: () => void;
  isWebSocketConnected: boolean;
}

export function Header({ title, onToggleNotifications, isWebSocketConnected }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [, navigate] = useLocation();
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 p-6" data-testid="header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">
            {title}
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span data-testid="current-date">
              {currentTime.toLocaleDateString('vi-VN')}
            </span>
            <span>•</span>
            <span data-testid="current-time">
              {currentTime.toLocaleTimeString('vi-VN')}
            </span>
            {isWebSocketConnected && (
              <>
                <span>•</span>
                <span className="text-green-600" data-testid="ws-status">
                  ● Live
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <StoreInfoHeader />
          <RefreshPermissionsButton />
          
          <button
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={onToggleNotifications}
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          <Button 
            className="bg-primary hover:bg-blue-700" 
            data-testid="button-quick-sale"
            onClick={() => navigate('/sales')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Bán hàng nhanh
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user.fullName}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email || user.username}</p>
                    <p className="text-xs text-gray-500">Vai trò: {user.roleName}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">Cửa hàng hiện tại:</p>
                  <StoreSwitcher onStoreChange={(store) => {
                    // Có thể dispatch action để update global store state
                    console.log('Store changed to:', store);
                  }} />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
