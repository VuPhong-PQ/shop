import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Search,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Package,
  AlertCircle
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Order {
  orderId: number;
  customerName: string;
  customer?: {
    customerId: number;
    hoTen: string;
    soDienThoai: string;
    email: string;
    diaChi: string;
    hangKhachHang: string;
  };
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải danh sách đơn hàng"
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải đơn hàng"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/orders/${selectedOrder.orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders(orders.filter(order => order.orderId !== selectedOrder.orderId));
        toast({
          title: "Thành công",
          description: "Đã xóa đơn hàng thành công"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể xóa đơn hàng"
        });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa đơn hàng"
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer?.soDienThoai && order.customer.soDienThoai.includes(searchTerm)) ||
    order.orderId.toString().includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { label: 'Hoàn thành', variant: 'default' as const },
      'pending': { label: 'Chờ xử lý', variant: 'secondary' as const },
      'cancelled': { label: 'Đã hủy', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodMap = {
      'cash': { label: 'Tiền mặt', variant: 'outline' as const },
      'card': { label: 'Thẻ', variant: 'default' as const },
      'qr': { label: 'QR Code', variant: 'secondary' as const },
      'ewallet': { label: 'Ví điện tử', variant: 'secondary' as const },
    };
    
    const methodInfo = methodMap[method as keyof typeof methodMap] || { label: method, variant: 'outline' as const };
    return <Badge variant={methodInfo.variant}>{methodInfo.label}</Badge>;
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;

  return (
    <AppLayout title="Quản lý đơn hàng">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-gray-600 mt-1">Quản lý tất cả các đơn hàng trong hệ thống</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {completedOrders} đơn hoàn thành
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
              </div>
              <p className="text-xs text-muted-foreground">
                Từ {totalOrders} đơn hàng
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {completedOrders}/{totalOrders} đơn hàng
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên khách hàng, số điện thoại hoặc mã đơn hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn hàng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">
                          {searchTerm ? "Không tìm thấy đơn hàng nào" : "Chưa có đơn hàng nào"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-medium">#{order.orderId}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.customer?.soDienThoai || 'N/A'}</TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </TableCell>
                      <TableCell>
                        {order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOrder(order)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Xác nhận xóa đơn hàng</span>
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng #{selectedOrder?.orderId} của khách hàng "{selectedOrder?.customerName}"?
              <br />
              <span className="text-red-600 font-medium">Hành động này không thể hoàn tác.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmDeleteOrder}>
              Xóa đơn hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.orderId}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Thông tin khách hàng</h4>
                  <p className="text-sm text-gray-600">Tên: {selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">SĐT: {selectedOrder.customer?.soDienThoai || 'N/A'}</p>
                  {selectedOrder.customer?.email && (
                    <p className="text-sm text-gray-600">Email: {selectedOrder.customer.email}</p>
                  )}
                  {selectedOrder.customer?.diaChi && (
                    <p className="text-sm text-gray-600">Địa chỉ: {selectedOrder.customer.diaChi}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Thông tin đơn hàng</h4>
                  <p className="text-sm text-gray-600">
                    Ngày: {format(new Date(selectedOrder.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Trạng thái:</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Thanh toán:</span>
                    {getPaymentMethodBadge(selectedOrder.paymentMethod)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Sản phẩm đã đặt</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </TableCell>
                        <TableCell>
                          {item.totalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-right border-t pt-4">
                <p className="text-lg font-bold">
                  Tổng cộng: {selectedOrder.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}