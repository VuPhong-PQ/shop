import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
type StoreInfo = {
  name: string;
  address?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
};
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, RotateCcw, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { apiRequest } from "../lib/utils";

type OrderItem = {
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
};

type Order = {
  orderId: number;
  customerName?: string;
  createdAt: string;
  totalAmount: number;
  items: OrderItem[];
  taxAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  cashierName?: string;
  subtotal?: number;
};


export default function OrdersPage() {
  const { toast } = useToast();
  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await apiRequest("/api/orders", { method: "GET" });
      // Nếu trả về string, parse lại
      const raw = typeof res === "string" ? JSON.parse(res) : res;
      // Sửa lại items nếu là chuỗi JSON
      const mapped = raw.map((order: any) => ({
        ...order,
        items: typeof order.items === "string" ? JSON.parse(order.items) : order.items
      }));
      console.log("orders:", mapped);
      return mapped;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
  });

  // Lấy thông tin cửa hàng
  const { data: storeInfo } = useQuery<StoreInfo | null>({
    queryKey: ["/api/StoreInfo"],
    queryFn: async () => {
      const res = await apiRequest("/api/StoreInfo", { method: "GET" });
      if (res.status === 404) return null;
      return typeof res === "string" ? JSON.parse(res) : res;
    },
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Helper functions để format trạng thái
  const formatPaymentStatus = (status?: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'failed': return 'Thanh toán thất bại';
      default: return 'Đã thanh toán';
    }
  };

  const formatOrderStatus = (status?: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return 'Hoàn thành';
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">{formatPaymentStatus(status)}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{formatPaymentStatus(status)}</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">{formatPaymentStatus(status)}</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-200">{formatPaymentStatus(status)}</Badge>;
    }
  };

  const getOrderStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{formatOrderStatus(status)}</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{formatOrderStatus(status)}</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{formatOrderStatus(status)}</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{formatOrderStatus(status)}</Badge>;
    }
  };

  const getCardBorderClass = (paymentStatus?: string, orderStatus?: string) => {
    // Ưu tiên hiển thị trạng thái thanh toán
    if (paymentStatus === 'pending') {
      return 'border-l-4 border-l-yellow-400 bg-yellow-50';
    }
    if (paymentStatus === 'failed') {
      return 'border-l-4 border-l-red-400 bg-red-50';
    }
    if (orderStatus === 'pending') {
      return 'border-l-4 border-l-orange-400 bg-orange-50';
    }
    if (orderStatus === 'cancelled') {
      return 'border-l-4 border-l-gray-400 bg-gray-50';
    }
    if (paymentStatus === 'paid' && orderStatus === 'completed') {
      return 'border-l-4 border-l-green-400 bg-green-50';
    }
    return '';
  };

  const [, navigate] = useLocation();

  // Xóa đơn hàng
  const handleDeleteOrder = async (orderId: number) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, { method: "DELETE" });
      toast({
        title: "Thành công",
        description: "Đã xóa đơn hàng thành công"
      });
      refetch(); // Refresh danh sách
    } catch (error: any) {
      console.log("Delete error:", error);
      
      // Hiển thị lỗi chi tiết cho user
      toast({
        variant: "destructive",
        title: "Tạm thời không thể xóa đơn hàng",
        description: "Hệ thống đang có vấn đề với việc xóa đơn hàng. Vui lòng liên hệ admin để xóa thủ công hoặc đánh dấu đơn hàng là 'Đã hủy'."
      });
    }
  };

  // Đánh dấu hủy đơn hàng
  const handleCancelOrder = async (orderId: number) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: "cancelled" }) // Uppercase S để match với model
      });
      toast({
        title: "Thành công",
        description: "Đã đánh dấu đơn hàng là đã hủy"
      });
      refetch(); // Refresh danh sách
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng"
      });
    }
  };

  // Mở lại đơn hàng để tiếp tục thanh toán
  const handleReopenOrder = (order: Order) => {
    // Lưu thông tin đơn hàng vào localStorage để sales page có thể đọc
    const orderData = {
      orderId: order.orderId,
      items: order.items,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod
    };
    localStorage.setItem('reopenOrder', JSON.stringify(orderData));
    
    toast({
      title: "Đã mở lại đơn hàng",
      description: `Đơn hàng #${order.orderId} đã được chuyển đến trang bán hàng để tiếp tục thanh toán`
    });
    
    // Chuyển đến trang sales
    navigate('/sales');
  };

  // Tính toán thống kê trạng thái
  const getOrderStats = () => {
    const total = orders.length;
    const paid = orders.filter(o => o.paymentStatus === 'paid').length;
    const pending = orders.filter(o => o.paymentStatus === 'pending').length;
    const failed = orders.filter(o => o.paymentStatus === 'failed').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const processing = orders.filter(o => o.status === 'pending').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    return { total, paid, pending, failed, completed, processing, cancelled };
  };

  const stats = getOrderStats();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách đơn hàng</h1>
      
      {/* Thống kê trạng thái */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Tổng đơn</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-sm text-gray-600">Đã thanh toán</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Chờ thanh toán</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Thanh toán thất bại</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Hoàn thành</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-orange-600">{stats.processing}</div>
            <div className="text-sm text-gray-600">Đang xử lý</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Đã hủy</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-4">
        <Button
          style={{ backgroundColor: '#ef4444', color: '#fff' }}
          onClick={() => navigate("/sales")}
        >
          Đóng
        </Button>
      </div>
      {isLoading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <Card key={order.orderId} className={getCardBorderClass(order.paymentStatus, order.status)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-2">Mã đơn: #{order.orderId}</div>
                    <div className="space-y-1 text-sm">
                      <div>Khách hàng: <span className="font-medium">{order.customerName || "Khách lẻ"}</span></div>
                      <div>Ngày tạo: <span className="font-medium">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span></div>
                      <div>Giờ tạo: <span className="font-medium">{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                      <div>Tổng tiền: <span className="font-bold text-blue-600">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</span></div>
                    </div>
                    
                    {/* Trạng thái */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {getPaymentStatusBadge(order.paymentStatus)}
                      {getOrderStatusBadge(order.status)}
                    </div>
                    
                    {/* Nút hành động */}
                    <div className="flex gap-2 mt-3">
                      {order.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handleReopenOrder(order)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Mở lại
                        </button>
                      )}
                      
                      {order.status !== 'cancelled' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors">
                              <X className="w-4 h-4 mr-1" />
                              Đánh dấu hủy
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn đánh dấu đơn hàng #{order.orderId} là đã hủy? Đơn hàng sẽ được giữ lại trong hệ thống với trạng thái "Đã hủy".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Không</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleCancelOrder(order.orderId)}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                Đánh dấu hủy
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Xóa
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa đơn hàng</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa đơn hàng #{order.orderId}? Hành động này không thể hoàn tác.
                              <br /><br />
                              <strong>Lưu ý:</strong> Hiện tại có vấn đề kỹ thuật với việc xóa đơn hàng. Khuyến nghị sử dụng "Đánh dấu hủy" thay thế.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteOrder(order.orderId)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Thử xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button onClick={() => setSelectedOrder(order)} size="sm" className="mb-2">
                      Xem & In
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal xem & in đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative print:w-full print:max-w-full"
            style={{ width: '80mm', maxWidth: '80mm', minWidth: '80mm', fontSize: '14px' }}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setSelectedOrder(null)}
            >
              Đóng
            </button>
            {/* Thông tin cửa hàng in đầu bill */}
            <div className="text-center border-b pb-2 mb-2">
              <div className="font-bold text-lg">{storeInfo?.name || "[Tên cửa hàng]"}</div>
              {storeInfo?.address && <div className="text-sm">Đ/c: {storeInfo.address}</div>}
              {storeInfo?.taxCode && <div className="text-sm">MST: {storeInfo.taxCode}</div>}
              {storeInfo?.phone && <div className="text-sm">ĐT: {storeInfo.phone}</div>}
              {storeInfo?.email && <div className="text-sm">Email: {storeInfo.email}</div>}
            </div>
            <h2 className="text-xl font-bold mb-2">Đơn hàng #{selectedOrder.orderId}</h2>
            <div>Khách hàng: {selectedOrder.customerName || "Khách lẻ"}</div>
            <div>Ngày tạo: {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</div>
            <div>Giờ tạo: {new Date(selectedOrder.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
            
            {/* Trạng thái đơn hàng */}
            <div className="flex gap-2 my-2">
              {getPaymentStatusBadge(selectedOrder.paymentStatus)}
              {getOrderStatusBadge(selectedOrder.status)}
            </div>
            
            {/* Thông tin bổ sung */}
            <div>Hình thức thanh toán: <b>{selectedOrder.paymentMethod || "Tiền mặt"}</b></div>
            <div>Thu Ngân: <b>{selectedOrder.cashierName || "Admin"}</b></div>
            <div className="mt-4">
              <table className="w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Sản phẩm</th>
                    <th className="border px-2 py-1">SL</th>
                    <th className="border px-2 py-1">Đơn giá</th>
                    <th className="border px-2 py-1">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{item.productName}</td>
                      <td className="border px-2 py-1 text-center">{item.quantity}</td>
                      <td className="border px-2 py-1 text-right">{Number(item.price).toLocaleString('vi-VN')}₫</td>
                      <td className="border px-2 py-1 text-right">{Number(item.totalPrice).toLocaleString('vi-VN')}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            {/* Tính lại tạm tính và VAT từ items */}
            <div className="mt-2 text-right">
              {(() => {
                const subtotal = selectedOrder.items?.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0) || 0;
                const vatRate = 0.1; // Nếu cần lấy động, có thể lấy từ storeInfo hoặc taxConfig
                const vatAmount = subtotal * vatRate;
                return (
                  <>
                    <div>Tạm tính: <b>{subtotal.toLocaleString('vi-VN')}₫</b></div>
                    <div>VAT 10%: <b>{vatAmount.toLocaleString('vi-VN')}₫</b></div>
                  </>
                );
              })()}
            </div>
            </div>
            <div className="mt-4 text-right font-bold">
              Tổng cộng: {Number(selectedOrder.totalAmount).toLocaleString('vi-VN')}₫
            </div>
            <div className="mt-6 text-center font-semibold text-gray-700">
              Cảm ơn - Hẹn gặp lại
            </div>
            <div className="mt-4 flex justify-end gap-2 print:hidden">
              <Button onClick={() => window.print()} variant="outline">
                In đơn hàng
              </Button>
              <Button onClick={() => setSelectedOrder(null)} variant="secondary">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
