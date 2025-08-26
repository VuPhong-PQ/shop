import { TrendingUp, ShoppingCart, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/types";

interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Doanh thu hôm nay",
      value: metrics.todayRevenue,
      change: metrics.todayGrowth,
      changeType: "increase" as const,
      icon: TrendingUp,
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
      testId: "metric-revenue"
    },
    {
      title: "Đơn hàng",
      value: metrics.ordersCount.toString(),
      change: metrics.ordersGrowth,
      changeType: "increase" as const,
      icon: ShoppingCart,
      iconBg: "bg-green-100",
      iconColor: "text-success",
      testId: "metric-orders"
    },
    {
      title: "Khách hàng mới",
      value: metrics.newCustomers.toString(),
      change: metrics.customersGrowth,
      changeType: "increase" as const,
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      testId: "metric-customers"
    },
    {
      title: "Sản phẩm sắp hết",
      value: metrics.lowStockItems.toString(),
      change: "Cần bổ sung",
      changeType: "warning" as const,
      icon: AlertTriangle,
      iconBg: "bg-orange-100",
      iconColor: "text-warning",
      testId: "metric-stock"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <Card key={card.title} className="shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2" data-testid={`${card.testId}-value`}>
                    {card.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {card.changeType === "increase" && (
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                    )}
                    {card.changeType === "warning" && (
                      <AlertTriangle className="h-4 w-4 text-warning mr-1" />
                    )}
                    <span 
                      className={`text-sm font-medium ${
                        card.changeType === "increase" ? "text-success" : "text-warning"
                      }`}
                      data-testid={`${card.testId}-change`}
                    >
                      {card.change}
                    </span>
                    {card.changeType === "increase" && (
                      <span className="text-sm text-gray-500 ml-1">so với hôm qua</span>
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} text-xl`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
