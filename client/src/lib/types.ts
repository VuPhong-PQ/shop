export interface DashboardMetrics {
  todayRevenue: string;
  todayGrowth: string;
  ordersCount: number;
  ordersGrowth: string;
  newCustomers: number;
  customersGrowth: string;
  lowStockItems: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
}

export interface TopProduct {
  id: string;
  name: string;
  image: string;
  soldCount: number;
  revenue: string;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  total: string;
  status: string;
  time: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  image: string;
  stock: string;
  minStockLevel: number;
  currentStock: number;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}
