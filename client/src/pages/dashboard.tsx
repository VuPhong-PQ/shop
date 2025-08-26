import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";
import { queryClient } from "@/lib/queryClient";
import type { DashboardMetrics, RevenueChartData, TopProduct, RecentOrder, LowStockItem } from "@/lib/types";

export default function Dashboard() {
  const { lastMessage } = useWebSocket();

  // Dashboard data queries
  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: revenueData } = useQuery<RevenueChartData[]>({
    queryKey: ['/api/dashboard/revenue-chart'],
  });

  const { data: topProducts } = useQuery<TopProduct[]>({
    queryKey: ['/api/dashboard/top-products'],
  });

  const { data: recentOrders } = useQuery<RecentOrder[]>({
    queryKey: ['/api/dashboard/recent-orders'],
  });

  const { data: lowStockItems } = useQuery<LowStockItem[]>({
    queryKey: ['/api/dashboard/low-stock'],
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'order_created':
        case 'metrics_updated':
          // Invalidate dashboard queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-orders'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/revenue-chart'] });
          break;
        case 'inventory_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/low-stock'] });
          break;
        case 'product_created':
        case 'product_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-products'] });
          break;
      }
    }
  }, [lastMessage]);

  const handleViewAllOrders = () => {
    // Would navigate to orders page
    console.log('Navigate to orders page');
  };

  const handleViewInventory = () => {
    // Would navigate to inventory page  
    console.log('Navigate to inventory page');
  };

  const handleReorderItem = (itemId: string) => {
    // Would handle reordering logic
    console.log('Reorder item:', itemId);
  };

  return (
    <AppLayout title="Dashboard">
      <div data-testid="dashboard-page">
        {/* Metrics Overview */}
        <MetricsCards metrics={metrics || null} />

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <RevenueChart data={revenueData || null} />
          <TopProducts products={topProducts || null} />
        </div>

        {/* Recent Activities and Inventory Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders 
            orders={recentOrders || null}
            onViewAll={handleViewAllOrders}
          />
          <LowStockAlerts 
            items={lowStockItems || null}
            onViewInventory={handleViewInventory}
            onReorderItem={handleReorderItem}
          />
        </div>
      </div>
    </AppLayout>
  );
}
