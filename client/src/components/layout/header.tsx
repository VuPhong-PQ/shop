import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

interface HeaderProps {
  title: string;
  onToggleNotifications: () => void;
  isWebSocketConnected: boolean;
}

export function Header({ title, onToggleNotifications, isWebSocketConnected }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [, navigate] = useLocation();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
        </div>
      </div>
    </header>
  );
}
