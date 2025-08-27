import { Link, useLocation } from "wouter";
import { useState } from "react";
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
  LogOut,
  ChevronDown,
  ChevronRight,
  Folder,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Bán hàng', href: '/sales', icon: ShoppingCart },
  { 
    name: 'Sản phẩm', 
    icon: Package,
    submenu: [
      { name: 'Danh sách sản phẩm', href: '/products', icon: Package },
      { name: 'Nhóm sản phẩm', href: '/product-groups', icon: Folder }
    ]
  },
  { name: 'Khách hàng', href: '/customers', icon: Users },
  { name: 'Kho hàng', href: '/inventory', icon: Warehouse },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3 },
  { name: 'Nhân viên', href: '/staff', icon: UserCheck },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Sản phẩm']);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

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
            const Icon = item.icon;
            
            // Handle menu items with submenu
            if (item.submenu) {
              const isExpanded = expandedMenus.includes(item.name);
              const hasActiveSubmenu = item.submenu.some(subitem => location === subitem.href);
              
              return (
                <div key={item.name}>
                  <div
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                      hasActiveSubmenu
                        ? "text-primary bg-blue-50"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subitem) => {
                        const isActive = location === subitem.href;
                        const SubIcon = subitem.icon;
                        
                        return (
                          <Link key={subitem.name} href={subitem.href}>
                            <div
                              className={cn(
                                "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                                isActive
                                  ? "text-primary bg-blue-50"
                                  : "text-gray-600 hover:bg-gray-50"
                              )}
                              data-testid={`nav-${subitem.href.slice(1)}`}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span>{subitem.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Handle regular menu items
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                    isActive
                      ? "text-primary bg-blue-50"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  data-testid={`nav-${item.href.slice(1) || 'dashboard'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
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
