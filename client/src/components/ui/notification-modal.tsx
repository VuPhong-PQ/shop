import { X, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/lib/types";

interface NotificationModalProps {
  show: boolean;
  onClose: () => void;
}

// Mock notifications for demo
const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "info",
    title: "Đơn hàng mới",
    message: "Khách hàng Nguyễn Văn A vừa đặt đơn hàng #156",
    time: "2 phút trước",
    read: false
  },
  {
    id: "2",
    type: "warning",
    title: "Cảnh báo tồn kho",
    message: "Hạt cà phê Espresso sắp hết hàng",
    time: "15 phút trước",
    read: false
  },
  {
    id: "3",
    type: "success",
    title: "Thanh toán thành công",
    message: "Đơn hàng #155 đã được thanh toán",
    time: "30 phút trước",
    read: true
  }
];

export function NotificationModal({ show, onClose }: NotificationModalProps) {
  if (!show) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'info':
        return Info;
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getIconStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'info':
        return "bg-primary text-white";
      case 'warning':
        return "bg-warning text-white";
      case 'success':
        return "bg-success text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getBackgroundStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'info':
        return "bg-blue-50";
      case 'warning':
        return "bg-orange-50";
      case 'success':
        return "bg-green-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
        data-testid="notification-overlay"
      />
      <div className="fixed right-4 top-16 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900" data-testid="notification-title">
              Thông báo
            </h3>
            <Button
              variant="ghost" 
              size="sm"
              onClick={onClose}
              data-testid="button-close-notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {mockNotifications.map((notification, index) => {
            const Icon = getIcon(notification.type);
            
            return (
              <div 
                key={notification.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg ${getBackgroundStyle(notification.type)}`}
                data-testid={`notification-${index}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getIconStyle(notification.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900" data-testid={`notification-title-${index}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600" data-testid={`notification-message-${index}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1" data-testid={`notification-time-${index}`}>
                    {notification.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}