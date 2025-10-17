import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { PrintStyleProvider } from "@/components/print-config";

interface PrintConfig {
  id: number;
  printerName: string;
  paperSize: string;
  printCopies: number;
  autoPrintBill: boolean;
  autoPrintOnOrder: boolean;
  printBarcode: boolean;
  printLogo: boolean;
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

  // Fetch print configuration
  const { data: printConfig } = useQuery<PrintConfig>({
    queryKey: ['/api/printconfig'],
    queryFn: () => apiRequest('/api/printconfig', { method: 'GET' }),
  });

  // Check if it's a POS printer
  const isPOSPrinter = printConfig?.printerName?.includes("POS") || 
                      printConfig?.printerName?.includes("80") || false;

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

  // Debug: check printer config
  console.log('Print Config:', printConfig);
  console.log('Is POS Printer:', isPOSPrinter);

  return (
    <PrintStyleProvider>
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
      
      {/* Dynamic print styles based on printer type */}
      <style>{`
        @media print {
          @page {
            size: ${isPOSPrinter ? '80mm auto' : 'A4'};
            margin: ${isPOSPrinter ? '0' : '15mm'};
          }
          body {
            margin: 0;
            padding: 0;
            font-family: ${isPOSPrinter ? '"Courier New", monospace' : 'Arial, sans-serif'};
            font-size: ${isPOSPrinter ? '8px' : '12px'};
            line-height: 1.2;
            ${isPOSPrinter ? 'width: 80mm;' : ''}
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
            width: ${isPOSPrinter ? '80mm' : '100%'};
            max-width: ${isPOSPrinter ? '80mm' : '210mm'};
            padding: ${isPOSPrinter ? '2mm' : '15mm'};
            background: white;
            box-sizing: border-box;
            font-size: ${isPOSPrinter ? '8px' : '12px'};
          }
          .no-print {
            display: none !important;
          }
          /* POS specific styles */
          ${isPOSPrinter ? `
          .pos-header {
            text-align: center;
            margin-bottom: 3mm;
            border-bottom: 1px dashed #000;
            padding-bottom: 2mm;
          }
          .pos-header h2 {
            font-size: 10px;
            font-weight: bold;
            margin: 0 0 1mm 0;
          }
          .pos-header div {
            font-size: 7px;
            margin: 0.5mm 0;
            line-height: 1.1;
          }
          .pos-order-info {
            margin: 2mm 0;
            font-size: 7px;
            border-bottom: 1px dashed #666;
            padding-bottom: 2mm;
          }
          .pos-order-info div {
            margin: 0.5mm 0;
            word-wrap: break-word;` : `
          /* A4 specific styles */
          .store-header {
            text-align: center;
            font-size: 14px;
            margin-bottom: 5mm;
            border-bottom: 2px solid #000;
            padding-bottom: 3mm;
          }`}
          }
          /* Product items for POS */
          .pos-item-row {
            margin: 1mm 0;
            font-size: 7px;
          }
          .pos-item-name {
            font-weight: bold;
            margin-bottom: 0.5mm;
          }
          .pos-item-details {
            display: flex;
            justify-content: space-between;
            font-size: 6px;
          }
          /* Totals for POS */
          .pos-total {
            border-top: 1px dashed #000;
            padding-top: 2mm;
            margin-top: 2mm;
          }
          .pos-total-row {
            display: flex;
            justify-content: space-between;
            margin: 0.5mm 0;
            font-size: 7px;
          }
          .pos-final-total {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 8px;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 1mm 0;
            margin: 2mm 0;
          }
          .pos-footer {
            margin-top: 2mm;
            text-align: center;
            font-size: 6px;
            border-top: 1px dashed #000;
            padding-top: 2mm;
          }
          ` : ''}
        }
        
        /* Screen styles for preview */
        @media screen {
          .print-area {
            max-width: ${isPOSPrinter ? '80mm' : '800px'};
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 10px;
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

        {/* Print area - POS 80mm format */}
        <div className="print-area max-w-4xl mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative print:w-full print:max-w-full print:p-0 print:shadow-none print:rounded-none" style={{fontSize: '14px'}}>
            
            {/* Store header - optimized for POS */}
            <div className="pos-header text-center border-b pb-2 mb-2 print:text-center print:mb-1">
              <div className="font-bold text-lg print:text-xs print:mb-1">Pinkwish Shop</div>
              <div className="text-sm print:text-xs print:mb-0">Đ/c: Phú quốc - An giang</div>
              <div className="text-sm print:text-xs print:mb-0">MST: 0123456789</div>
              <div className="text-sm print:text-xs print:mb-0">ĐT: 0907999841</div>
              <div className="text-sm print:text-xs print:mb-0">Email: pwshop@gmail.com</div>
            </div>

            {/* Order info - optimized for POS */}
            <div className="pos-order-info mb-4 print:mb-2">
              <h2 className="text-xl font-bold mb-2 print:text-xs print:mb-1 print:text-center">Đơn hàng #{orderDetail.orderId}</h2>
              <div className="print:text-xs">Khách hàng: {orderDetail.customerName || orderDetail.customer?.hoTen || '-'}</div>
              <div className="print:text-xs">Ngày: {new Date(orderDetail.createdAt).toLocaleDateString('vi-VN')}</div>
              <div className="print:text-xs">Giờ: {new Date(orderDetail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="print:text-xs">Thanh toán: {formatPaymentMethod(orderDetail.paymentMethod)}</div>
              <div className="print:text-xs">Thu Ngân: Admin</div>
            </div>

            {/* Products - Dynamic layout based on printer type */}
            <div className="mt-4 print:mt-2" style={{marginLeft: '-8px'}}>
              {/* POS format - simplified layout for thermal printers */}
              <div className={isPOSPrinter ? "block" : "hidden print:block"}>
                {orderDetail.items.map((item, index) => (
                  <div key={index} className="pos-item-row mb-2 print:mb-1">
                    <div className="pos-item-name font-semibold print:font-bold print:text-xs">{item.productName}</div>
                    <div className="pos-item-details flex justify-between text-sm print:text-xs">
                      <span>{item.quantity} x {(item.totalPrice / item.quantity).toLocaleString('vi-VN')}₫</span>
                      <span className="font-semibold">{item.totalPrice.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* A4 format - table layout for standard printers */}
              <table className={`w-full border ${isPOSPrinter ? "hidden" : "block"} print:${isPOSPrinter ? "hidden" : "table"}`}>
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
              
              {/* A4 totals */}
              <div className={`mt-2 text-right ${isPOSPrinter ? "hidden" : "block"} print:${isPOSPrinter ? "hidden" : "block"}`}>
                <div>Tạm tính: <b>{orderDetail.subTotal.toLocaleString('vi-VN')}₫</b></div>
                {orderDetail.taxAmount > 0 && (
                  <div>VAT 10%: <b>{orderDetail.taxAmount.toLocaleString('vi-VN')}₫</b></div>
                )}
                {orderDetail.discountAmount > 0 && (
                  <div>Giảm giá: <b>-{orderDetail.discountAmount.toLocaleString('vi-VN')}₫</b></div>
                )}
              </div>
            </div>

            {/* POS Totals */}
            <div className={`pos-total mt-4 print:mt-2 ${isPOSPrinter ? "block" : "hidden print:block"}`}>
              <div className="pos-total-row flex justify-between print:text-xs">
                <span>Tạm tính:</span>
                <span>{orderDetail.subTotal.toLocaleString('vi-VN')}₫</span>
              </div>
              {orderDetail.taxAmount > 0 && (
                <div className="pos-total-row flex justify-between print:text-xs">
                  <span>VAT 10%:</span>
                  <span>{orderDetail.taxAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              {orderDetail.discountAmount > 0 && (
                <div className="pos-total-row flex justify-between print:text-xs">
                  <span>Giảm giá:</span>
                  <span>-{orderDetail.discountAmount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div className="pos-final-total flex justify-between font-bold text-lg print:text-sm border-t-2 border-black pt-2 mt-2">
                <span>TỔNG CỘNG:</span>
                <span>{orderDetail.totalAmount.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {/* A4 total */}
            <div className={`mt-4 text-right font-bold text-xl ${isPOSPrinter ? "hidden" : "block"} print:${isPOSPrinter ? "hidden" : "block"}`}>
              Tổng cộng: {orderDetail.totalAmount.toLocaleString('vi-VN')}₫
            </div>
            
            {/* Footer */}
            <div className="pos-footer mt-6 text-center font-semibold text-gray-700 print:mt-2 print:text-center print:text-xs">
              <p>Cảm ơn - Hẹn gặp lại</p>
            </div>
            
          </div>
        </div>
      </div>
    </PrintStyleProvider>
  );
}