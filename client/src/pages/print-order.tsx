import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

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
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }[];
}

export default function PrintOrder() {
  const [, params] = useRoute("/print-order/:orderId");
  const [, navigate] = useLocation();
  const [isPrinting, setIsPrinting] = useState(false);
  
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  // Fetch order details
  const { data: orderDetail, isLoading } = useQuery<OrderDetail>({
    queryKey: ['/api/orders', orderId],
    queryFn: () => apiRequest(`/api/orders/${orderId}`, { method: 'GET' }),
    enabled: !!orderId,
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

  // Handle print
  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy đơn hàng</p>
          <Button 
            onClick={() => navigate('/orders')} 
            className="mt-4"
            variant="outline"
          >
            Quay lại danh sách đơn hàng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .print-table th {
            background-color: #f2f2f2;
          }
          .print-footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Header - Hidden when printing */}
        <div className="no-print bg-white shadow-sm border-b p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <h1 className="text-2xl font-bold">In đơn hàng #{orderDetail.orderId}</h1>
            </div>
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              {isPrinting ? 'Đang in...' : 'In đơn hàng'}
            </Button>
          </div>
        </div>

        {/* Print area */}
        <div className="print-area max-w-4xl mx-auto p-8">
          <Card>
            <CardContent className="p-8">
              {/* Store header */}
              <div className="print-header text-center mb-8">
                <h2 className="text-2xl font-bold">Pinkwish Shop</h2>
                <p className="text-gray-600">Địa chỉ: Phú quốc - An giang</p>
                <p className="text-gray-600">MST: 0123456789 | ĐT: 0907999841</p>
                <p className="text-gray-600">Email: pwshop@gmail.com</p>
              </div>

              {/* Order info */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">Đơn hàng #{orderDetail.orderId}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Khách hàng:</strong> {orderDetail.customerName || orderDetail.customer?.hoTen || 'Khách vãng lai'}</p>
                    {orderDetail.customer?.soDienThoai && (
                      <p><strong>Số điện thoại:</strong> {orderDetail.customer.soDienThoai}</p>
                    )}
                    <p><strong>Ngày tạo:</strong> {new Date(orderDetail.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <p><strong>Số đơn hàng:</strong> {orderDetail.orderNumber || 'N/A'}</p>
                    <p><strong>Phương thức thanh toán:</strong> {formatPaymentMethod(orderDetail.paymentMethod)}</p>
                    <p><strong>Trạng thái thanh toán:</strong> {formatPaymentStatus(orderDetail.paymentStatus)}</p>
                  </div>
                </div>
              </div>

              {/* Items table */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Chi tiết sản phẩm</h4>
                <table className="print-table w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Sản phẩm</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Số lượng</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Đơn giá</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetail.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{item.productName}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{item.price.toLocaleString('vi-VN')}đ</td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-medium">{item.totalPrice.toLocaleString('vi-VN')}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full md:w-1/2">
                  {orderDetail.subTotal > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Tạm tính:</span>
                      <span className="font-medium">{orderDetail.subTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {orderDetail.discountAmount > 0 && (
                    <div className="flex justify-between py-1 text-red-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">-{orderDetail.discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {orderDetail.taxAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Thuế VAT:</span>
                      <span className="font-medium">{orderDetail.taxAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t-2 text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600">{orderDetail.totalAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="print-footer mt-8 text-center text-sm text-gray-600">
                <p>Cảm ơn quý khách đã mua hàng!</p>
                <p>Chúc quý khách một ngày tốt lành!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}