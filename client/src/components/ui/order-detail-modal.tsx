import { useState, useEffect } from "react";
import { X, Printer, User, Calendar, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OrderDetailModalProps {
  orderId: number | null;
  show: boolean;
  onClose: () => void;
}

interface OrderDetail {
  orderId: number;
  customerId?: number;
  customerName?: string;
  createdAt: string;
  totalAmount: number;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  orderNumber?: string;
  cashierId?: string;
  storeId?: string;
  notes?: string;
  customer?: {
    customerId: number;
    hoTen: string;
    soDienThoai?: string;
    email?: string;
    diaChi?: string;
  };
  items: {
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }[];
}

export function OrderDetailModal({ orderId, show, onClose }: OrderDetailModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch order details
  const { data: orderDetail, isLoading } = useQuery<OrderDetail>({
    queryKey: ['/api/orders', orderId],
    queryFn: () => apiRequest(`/api/orders/${orderId}`, { method: 'GET' }),
    enabled: !!orderId && show,
  });

  // Format payment method
  const formatPaymentMethod = (method?: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ ngân hàng';
      case 'qr': return 'QR Code';
      case 'ewallet': return 'Ví điện tử';
      default: return 'Tiền mặt';
    }
  };

  // Format payment status
  const formatPaymentStatus = (status?: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'failed': return 'Thanh toán thất bại';
      default: return 'Đã thanh toán';
    }
  };

  // Format order status
  const formatOrderStatus = (status?: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return 'Hoàn thành';
    }
  };

  // Print function
  const handlePrint = () => {
    if (!orderDetail) return;
    
    setIsPrinting(true);
    
    // Create print content
    const printContent = `
      <html>
        <head>
          <title>Đơn hàng #${orderDetail.orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin: 10px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Pinkwish Shop</h2>
            <p>Địa chỉ: Phú quốc - An giang</p>
            <p>MST: 0123456789 | ĐT: 0907999841</p>
            <p>Email: pwshop@gmail.com</p>
          </div>
          
          <h3>Đơn hàng #${orderDetail.orderId}</h3>
          
          <div class="info">
            <p><strong>Khách hàng:</strong> ${orderDetail.customerName || orderDetail.customer?.hoTen || 'Khách vãng lai'}</p>
            ${orderDetail.customer?.soDienThoai ? `<p><strong>Số điện thoại:</strong> ${orderDetail.customer.soDienThoai}</p>` : ''}
            <p><strong>Ngày tạo:</strong> ${new Date(orderDetail.createdAt).toLocaleString('vi-VN')}</p>
            <p><strong>Phương thức thanh toán:</strong> ${formatPaymentMethod(orderDetail.paymentMethod)}</p>
            <p><strong>Trạng thái thanh toán:</strong> ${formatPaymentStatus(orderDetail.paymentStatus)}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${orderDetail.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toLocaleString('vi-VN')}đ</td>
                  <td>${item.totalPrice.toLocaleString('vi-VN')}đ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            ${orderDetail.discountAmount > 0 ? `<p>Tạm tính: <strong>${orderDetail.subTotal.toLocaleString('vi-VN')}đ</strong></p>` : ''}
            ${orderDetail.discountAmount > 0 ? `<p>Giảm giá: <strong>-${orderDetail.discountAmount.toLocaleString('vi-VN')}đ</strong></p>` : ''}
            ${orderDetail.taxAmount > 0 ? `<p>Thuế VAT: <strong>${orderDetail.taxAmount.toLocaleString('vi-VN')}đ</strong></p>` : ''}
            <p>Tổng tiền: <strong>${orderDetail.totalAmount.toLocaleString('vi-VN')}đ</strong></p>
          </div>
          
          <div class="footer">
            <p>Cảm ơn bạn đã mua hàng!</p>
            <p>Hẹn gặp lại!</p>
          </div>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
    
    setIsPrinting(false);
  };

  if (!show || !orderId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">
            Chi tiết đơn hàng #{orderId}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Đang tải...</div>
            </div>
          ) : orderDetail ? (
            <>
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Thông tin khách hàng
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Tên:</strong> {orderDetail.customerName || orderDetail.customer?.hoTen || 'Khách vãng lai'}</p>
                  {orderDetail.customer?.soDienThoai && (
                    <p><strong>Số điện thoại:</strong> {orderDetail.customer.soDienThoai}</p>
                  )}
                  {orderDetail.customer?.email && (
                    <p><strong>Email:</strong> {orderDetail.customer.email}</p>
                  )}
                  {orderDetail.customer?.diaChi && (
                    <p><strong>Địa chỉ:</strong> {orderDetail.customer.diaChi}</p>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Thông tin đơn hàng
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Mã đơn:</strong> #{orderDetail.orderId}</p>
                  {orderDetail.orderNumber && <p><strong>Số đơn hàng:</strong> {orderDetail.orderNumber}</p>}
                  <p><strong>Ngày tạo:</strong> {new Date(orderDetail.createdAt).toLocaleString('vi-VN')}</p>
                  <p><strong>Trạng thái:</strong> <Badge variant="default">{formatOrderStatus(orderDetail.status)}</Badge></p>
                  <p><strong>Phương thức thanh toán:</strong> {formatPaymentMethod(orderDetail.paymentMethod)}</p>
                  <p><strong>Trạng thái thanh toán:</strong> 
                    <Badge 
                      variant={orderDetail.paymentStatus === 'paid' ? 'default' : orderDetail.paymentStatus === 'pending' ? 'secondary' : 'destructive'}
                      className="ml-2"
                    >
                      {formatPaymentStatus(orderDetail.paymentStatus)}
                    </Badge>
                  </p>
                  {orderDetail.cashierId && <p><strong>Thu ngân:</strong> {orderDetail.cashierId}</p>}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Chi tiết sản phẩm
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Sản phẩm</th>
                        <th className="px-4 py-2 text-center">SL</th>
                        <th className="px-4 py-2 text-right">Đơn giá</th>
                        <th className="px-4 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetail.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{item.productName}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{item.price.toLocaleString('vi-VN')}đ</td>
                          <td className="px-4 py-2 text-right font-medium">{item.totalPrice.toLocaleString('vi-VN')}đ</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      {/* Hiển thị chi tiết tính toán nếu có */}
                      {(orderDetail.subTotal > 0 || orderDetail.discountAmount > 0 || orderDetail.taxAmount > 0) && (
                        <>
                          {orderDetail.subTotal > 0 && (
                            <tr className="border-t">
                              <td colSpan={3} className="px-4 py-2 text-right">Tạm tính:</td>
                              <td className="px-4 py-2 text-right">{orderDetail.subTotal.toLocaleString('vi-VN')}đ</td>
                            </tr>
                          )}
                          {orderDetail.discountAmount > 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-right text-red-600">Giảm giá:</td>
                              <td className="px-4 py-2 text-right text-red-600">-{orderDetail.discountAmount.toLocaleString('vi-VN')}đ</td>
                            </tr>
                          )}
                          {orderDetail.taxAmount > 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-right">Thuế VAT:</td>
                              <td className="px-4 py-2 text-right">{orderDetail.taxAmount.toLocaleString('vi-VN')}đ</td>
                            </tr>
                          )}
                        </>
                      )}
                      <tr className="border-t-2">
                        <td colSpan={3} className="px-4 py-3 text-right font-bold">Tổng cộng:</td>
                        <td className="px-4 py-3 text-right font-bold text-lg text-blue-600">
                          {orderDetail.totalAmount.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
                <Button 
                  onClick={handlePrint} 
                  disabled={isPrinting}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  {isPrinting ? 'Đang in...' : 'In đơn hàng'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy đơn hàng</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}