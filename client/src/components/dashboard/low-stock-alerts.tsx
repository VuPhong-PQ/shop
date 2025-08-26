import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LowStockItem } from "@/lib/types";

interface LowStockAlertsProps {
  items: LowStockItem[] | null;
  onViewInventory: () => void;
  onReorderItem: (itemId: string) => void;
}

export function LowStockAlerts({ items, onViewInventory, onReorderItem }: LowStockAlertsProps) {
  if (!items) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Cảnh báo tồn kho</h3>
            <Button variant="ghost" size="sm" onClick={onViewInventory}>
              Xem kho hàng
            </Button>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertStyle = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return "bg-red-50 border-red-200";
    } else if (currentStock <= minStock * 0.5) {
      return "bg-red-50 border-red-200";
    } else {
      return "bg-orange-50 border-orange-200";
    }
  };

  const getStockColor = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return "text-error";
    } else if (currentStock <= minStock * 0.5) {
      return "text-error";
    } else {
      return "text-warning";
    }
  };

  const getButtonStyle = (currentStock: number, minStock: number) => {
    if (currentStock === 0 || currentStock <= minStock * 0.5) {
      return "bg-error hover:bg-red-700";
    } else {
      return "bg-warning hover:bg-orange-600";
    }
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900" data-testid="low-stock-title">
            Cảnh báo tồn kho
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewInventory}
            className="text-primary hover:underline"
            data-testid="button-view-inventory"
          >
            Xem kho hàng
          </Button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between p-3 rounded-lg border ${getAlertStyle(item.currentStock, item.minStockLevel)}`}
              data-testid={`low-stock-item-${index}`}
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={item.image || "https://images.unsplash.com/photo-1550681560-af9bc1cb339e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=60&h=60"} 
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover"
                  data-testid={`stock-item-image-${index}`}
                />
                <div>
                  <p className="font-medium text-gray-900" data-testid={`stock-item-name-${index}`}>
                    {item.name}
                  </p>
                  <p className={`text-sm font-medium ${getStockColor(item.currentStock, item.minStockLevel)}`} data-testid={`stock-item-level-${index}`}>
                    {item.stock}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className={`text-white ${getButtonStyle(item.currentStock, item.minStockLevel)}`}
                onClick={() => onReorderItem(item.id)}
                data-testid={`button-reorder-${index}`}
              >
                Đặt hàng
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
