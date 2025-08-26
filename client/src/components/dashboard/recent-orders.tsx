import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecentOrder } from "@/lib/types";

interface RecentOrdersProps {
  orders: RecentOrder[] | null;
  onViewAll: () => void;
}

export function RecentOrders({ orders, onViewAll }: RecentOrdersProps) {
  if (!orders) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Xem tất cả
            </Button>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'hoàn thành':
        return 'text-success';
      case 'processing':
      case 'đang xử lý':
        return 'text-warning';
      case 'pending':
      case 'chờ xử lý':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900" data-testid="recent-orders-title">
            Đơn hàng gần đây
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewAll}
            className="text-primary hover:underline"
            data-testid="button-view-all-orders"
          >
            Xem tất cả
          </Button>
        </div>
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div 
              key={order.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              data-testid={`recent-order-${index}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-semibold">
                  #{order.orderNumber}
                </div>
                <div>
                  <p className="font-medium text-gray-900" data-testid={`order-customer-${index}`}>
                    {order.customer}
                  </p>
                  <p className="text-sm text-gray-500" data-testid={`order-time-${index}`}>
                    {order.time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900" data-testid={`order-total-${index}`}>
                  {order.total}
                </p>
                <p className={`text-sm ${getStatusColor(order.status)}`} data-testid={`order-status-${index}`}>
                  {order.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
