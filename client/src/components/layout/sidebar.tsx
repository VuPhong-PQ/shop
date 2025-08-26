import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Warehouse,
  BarChart3,
  UserCheck,
  Settings,
  ScanBarcode,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Bán hàng', href: '/sales', icon: ShoppingCart },
  { name: 'Sản phẩm', href: '/products', icon: Package },
  { name: 'Khách hàng', href: '/customers', icon: Users },
  { name: 'Kho hàng', href: '/inventory', icon: Warehouse },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3 },
  { name: 'Nhân viên', href: '/staff', icon: UserCheck },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200" data-testid="sidebar">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ScanBarcode className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">POS Pro</h1>
            <p className="text-sm text-gray-500">Cửa hàng ABC</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                    isActive
                      ? "text-primary bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  data-testid={`nav-${item.href.slice(1) || 'dashboard'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
            alt="User profile" 
            className="w-10 h-10 rounded-full object-cover"
            data-testid="user-avatar"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate" data-testid="user-name">
              Nguyễn Thu Hương
            </p>
            <p className="text-xs text-gray-500 truncate" data-testid="user-role">
              Quản lý
            </p>
          </div>
          <button 
            className="text-gray-400 hover:text-gray-600"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
