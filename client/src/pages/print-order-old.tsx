import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

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

  // Fetch order details
  const { data: orderDetail, isLoading } = useQuery<OrderDetail>({
    queryKey: ['/api/orders', orderId],
    queryFn: () => apiRequest(`/api/orders/${orderId}`, { method: 'GET' }),
    enabled: !!orderId,
  });

  // Check if it's a POS printer
  const isPOSPrinter = printConfig?.printerName?.includes("POS") || 
                      printConfig?.printerName?.includes("80") || false;

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

  // Format money for POS printer (ultra compact format)
  const formatMoney = (amount: number, forPOS: boolean = isPOSPrinter): string => {
    if (forPOS) {
      // For POS: ultra compact format to prevent overflow
      if (amount >= 1000000) {
        // 1,000,000 -> 1.0M
        return `${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 100000) {
        // 350,000 -> 350K
        return `${Math.floor(amount / 1000)}K`;
      } else if (amount >= 1000) {
        // 5,500 -> 5.5K
        return `${(amount / 1000).toFixed(1)}K`;
      } else {
        // < 1000: show full number
        return `${amount}`;
      }
    } else {
      // For A4: use full format
      return `${amount.toLocaleString('vi-VN')}₫`;
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
      {/* POS Printer specific styles */}
      {isPOSPrinter && (
        <style>{`
          @media print {
            @page {
              size: 58mm auto;
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              font-family: "Courier New", monospace !important;
              font-size: 6px !important;
              line-height: 0.9 !important;
              width: 58mm !important;
              overflow: hidden;
            }
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible !important;
            }
            .print-content {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 58mm !important;
              padding: 0.5mm !important;
              background: white !important;
              box-sizing: border-box !important;
              font-size: 6px !important;
              overflow: hidden !important;
            }
            .no-print {
              display: none !important;
            }
            .store-info {
              text-align: center !important;
              font-size: 6px !important;
              margin-bottom: 1mm !important;
              border-bottom: 1px dashed #000 !important;
              padding-bottom: 0.5mm !important;
            }
            .store-info .store-name {
              font-weight: bold !important;
              font-size: 7px !important;
              margin-bottom: 0.3mm !important;
            }
            .store-info div {
              font-size: 5px !important;
              margin: 0.1mm 0 !important;
              line-height: 0.8 !important;
            }
            .order-header {
              text-align: center !important;
              font-weight: bold !important;
              font-size: 6px !important;
              margin: 0.5mm 0 !important;
            }
            .order-details {
              font-size: 5px !important;
              margin-bottom: 0.5mm !important;
              border-bottom: 1px dashed #666 !important;
              padding-bottom: 0.5mm !important;
            }
            .order-details div {
              margin: 0.1mm 0 !important;
              line-height: 0.8 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            .item-list {
              margin: 0.5mm 0 !important;
            }
            .item {
              margin-bottom: 0.5mm !important;
              font-size: 5px !important;
              border-bottom: 1px dotted #ccc !important;
              padding-bottom: 0.3mm !important;
            }
            .item-name {
              font-weight: bold !important;
              margin-bottom: 0.1mm !important;
              font-size: 5px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            .item-line {
              display: flex !important;
              justify-content: space-between !important;
              font-size: 5px !important;
              line-height: 0.8 !important;
              white-space: nowrap !important;
            }
            .totals {
              border-top: 1px dashed #000 !important;
              padding-top: 0.5mm !important;
              margin-top: 0.5mm !important;
            }
            .total-line {
              display: flex !important;
              justify-content: space-between !important;
              font-size: 5px !important;
              margin: 0.1mm 0 !important;
              line-height: 0.8 !important;
              white-space: nowrap !important;
            }
            .grand-total {
              display: flex !important;
              justify-content: space-between !important;
              font-weight: bold !important;
              font-size: 6px !important;
              border-top: 2px solid #000 !important;
              border-bottom: 2px solid #000 !important;
              padding: 0.3mm 0 !important;
              margin: 0.5mm 0 !important;
              line-height: 0.8 !important;
              white-space: nowrap !important;
            }
            .footer {
              text-align: center !important;
              font-size: 5px !important;
              margin-top: 1mm !important;
              border-top: 1px dashed #000 !important;
              padding-top: 0.5mm !important;
            }
          }
        `}</style>
      )}

      {/* A4 Printer styles */}
      {!isPOSPrinter && (
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
              line-height: 1.4;
            }
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      )}

      {/* Screen preview styles */}
      <style>{`
        @media screen {
          .print-content {
            max-width: ${isPOSPrinter ? '58mm' : '800px'};
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: ${isPOSPrinter ? '5px' : '20px'};
            font-size: ${isPOSPrinter ? '9px' : '14px'};
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          ${isPOSPrinter ? `
          .print-content .item-name {
            font-size: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .print-content .item-line {
            font-size: 8px;
          }
          .print-content .total-line,
          .print-content .grand-total {
            font-size: 8px;
          }
          ` : ''}
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
              <span className="text-sm text-gray-500">
                ({isPOSPrinter ? 'POS-80C' : 'A4'})
              </span>
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

        {/* Print content */}
        <div className="print-content p-8">
          {/* Store info */}
          <div className="store-info">
            <div className="store-name">Pinkwish Shop</div>
            <div>Đ/c: Phú quốc - An giang</div>
            <div>MST: 0123456789</div>
            <div>ĐT: 0907999841</div>
            <div>Email: pwshop@gmail.com</div>
          </div>

          {/* Order header */}
          <div className="order-header">
            Đơn hàng #{orderDetail.orderId}
          </div>

          {/* Order details */}
          <div className="order-details">
            <div>KH: {(orderDetail.customerName || orderDetail.customer?.hoTen || 'Khach le').substring(0, isPOSPrinter ? 15 : 50)}</div>
            <div>{new Date(orderDetail.createdAt).toLocaleDateString('vi-VN')} {new Date(orderDetail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>TT: {formatPaymentMethod(orderDetail.paymentMethod)}</div>
            <div>NV: Admin</div>
          </div>

          {/* Items */}
          {isPOSPrinter ? (
            /* POS format - simple list */
            <div className="item-list">
              {orderDetail.items.map((item, index) => (
                <div key={index} className="item">
                  <div className="item-name">{item.productName.length > (isPOSPrinter ? 12 : 30) ? item.productName.substring(0, isPOSPrinter ? 12 : 30) + '..' : item.productName}</div>
                  <div className="item-line">
                    <span>{item.quantity}x{formatMoney(item.totalPrice / item.quantity, true)}</span>
                    <span>{formatMoney(item.totalPrice, true)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* A4 format - table */
            <table className="w-full border-collapse border border-gray-300 my-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">Sản phẩm</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">SL</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Đơn giá</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {orderDetail.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2">{item.productName}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {(item.totalPrice / item.quantity).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {item.totalPrice.toLocaleString('vi-VN')}₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          <div className="totals">
            <div className="total-line">
              <span>{isPOSPrinter ? 'Tam:' : 'Tam tinh:'}</span>
              <span>{formatMoney(orderDetail.subTotal)}</span>
            </div>
            {orderDetail.taxAmount > 0 && (
              <div className="total-line">
                <span>VAT:</span>
                <span>{formatMoney(orderDetail.taxAmount)}</span>
              </div>
            )}
            {orderDetail.discountAmount > 0 && (
              <div className="total-line">
                <span>{isPOSPrinter ? 'GG:' : 'Giam gia:'}</span>
                <span>-{formatMoney(orderDetail.discountAmount)}</span>
              </div>
            )}
            <div className="grand-total">
              <span>{isPOSPrinter ? 'TONG:' : 'TONG CONG:'}</span>
              <span>{formatMoney(orderDetail.totalAmount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div>Cảm ơn quý khách - Hẹn gặp lại!</div>
          </div>
        </div>
      </div>
    </>
  );
}