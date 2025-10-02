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
      {/* Screen styles for better table display */}
      <style>{`
        .print-table {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          margin: 16px 0;
          margin-left: -20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table-header {
          background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
        }
        .table-row:hover {
          background-color: #f8f9fa;
        }
        .col-product, .col-qty, .col-price, .col-total {
          border-right: 1px solid #dee2e6;
        }
        .col-total {
          border-right: none;
        }
      `}</style>
      
      {/* Print styles for A4 page */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
          }
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
            max-width: 210mm;
            padding: 15mm;
            background: white;
            box-sizing: border-box;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            text-align: center;
            margin-bottom: 6px;
            border-bottom: 1px dashed #000;
            padding-bottom: 6px;
          }
          .print-header h2 {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 3px 0;
            letter-spacing: 0.5px;
          }
          .print-header p {
            font-size: 9px;
            margin: 1px 0;
            color: #000;
            line-height: 1.2;
          }
          .order-info {
            margin: 6px 0;
            font-size: 10px;
            line-height: 1.4;
            border-bottom: 1px dashed #666;
            padding-bottom: 4px;
          }
          .order-info p {
            margin: 1px 0;
            word-wrap: break-word;
          }
          .products-table {
            margin: 8px 0;
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            border: 1px solid #ddd;
          }
          .products-table th {
            background-color: #f8f9fa;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
            font-size: 11px;
          }
          .products-table th:nth-child(1) {
            width: 40%;
          }
          .products-table th:nth-child(2) {
            width: 15%;
            text-align: center;
          }
          .products-table th:nth-child(3) {
            width: 22.5%;
            text-align: right;
          }
          .products-table th:nth-child(4) {
            width: 22.5%;
            text-align: right;
          }
          .products-table td {
            padding: 6px;
            border: 1px solid #ddd;
            font-size: 11px;
          }
          .products-table td:nth-child(1) {
            text-align: left;
          }
          .products-table td:nth-child(2) {
            text-align: center;
          }
          .products-table td:nth-child(3) {
            text-align: right;
          }
          .products-table td:nth-child(4) {
            text-align: right;
          }
          .print-total {
            border-top: 1px dashed #000;
            padding-top: 6px;
            margin-top: 6px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
            font-size: 10px;
          }
          .print-footer {
            margin-top: 8px;
            text-align: center;
            font-size: 9px;
            border-top: 1px dashed #000;
            padding-top: 6px;
          }
          .print-footer p {
            margin: 1px 0;
          }
        }
        
        /* Screen styles for preview */
        @media screen {
          .print-area {
            max-width: 80mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
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

        {/* Print area - A4 page */}
        <div className="print-area max-w-4xl mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative print:w-full print:max-w-full" style={{fontSize: '14px'}}>
            
            {/* Store header */}
            <div className="text-center border-b pb-2 mb-2">
              <div className="font-bold text-lg">Pinkwish Shop</div>
              <div className="text-sm">Đ/c: Phú quốc - An giang</div>
              <div className="text-sm">MST: 0123456789</div>
              <div className="text-sm">ĐT: 0907999841</div>
              <div className="text-sm">Email: pwshop@gmail.com</div>
            </div>

            {/* Order info */}
            <h2 className="text-xl font-bold mb-2">Đơn hàng #{orderDetail.orderId}</h2>
            <div>Khách hàng: {orderDetail.customerName || orderDetail.customer?.hoTen || '-'}</div>
            <div>Ngày tạo: {new Date(orderDetail.createdAt).toLocaleDateString('vi-VN')}</div>
            <div>Giờ tạo: {new Date(orderDetail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>Hình thức thanh toán: <b>{formatPaymentMethod(orderDetail.paymentMethod)}</b></div>
            <div>Thu Ngân: <b>Admin</b></div>

            {/* Products table */}
            <div className="mt-4" style={{marginLeft: '-8px'}}>
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
                  {orderDetail.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-1">{item.productName}</td>
                      <td className="border px-2 py-1 text-center">{item.quantity}</td>
                      <td className="border px-2 py-1 text-right">{(item.totalPrice / item.quantity).toLocaleString('vi-VN')}₫</td>
                      <td className="border px-2 py-1 text-right">{item.totalPrice.toLocaleString('vi-VN')}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-2 text-right">
                <div>Tạm tính: <b>{orderDetail.subTotal.toLocaleString('vi-VN')}₫</b></div>
                <div>VAT 10%: <b>{orderDetail.taxAmount.toLocaleString('vi-VN')}₫</b></div>
              </div>
            </div>

            <div className="mt-4 text-right font-bold">Tổng cộng: {orderDetail.totalAmount.toLocaleString('vi-VN')}₫</div>
            <div className="mt-6 text-center font-semibold text-gray-700">Cảm ơn - Hẹn gặp lại</div>
            
          </div>
        </div>
      </div>
    </>
  );
}