import { useEffect, useState } from "react";
import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  onToggleNotifications: () => void;
  isWebSocketConnected: boolean;
}

export function Header({ title, onToggleNotifications, isWebSocketConnected }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

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
          <div className="relative">
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm, đơn hàng..."
              className="w-80 pl-10"
              data-testid="input-search"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
          
          <button
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={onToggleNotifications}
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          <Button className="bg-primary hover:bg-blue-700" data-testid="button-quick-sale">
            <Plus className="w-4 h-4 mr-2" />
            Bán hàng nhanh
          </Button>
        </div>
      </div>
    </header>
  );
}
