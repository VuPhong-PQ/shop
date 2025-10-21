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

  // Format payment method - ASCII only
  const formatPaymentMethod = (method?: string) => {
    switch (method) {
      case 'cash': return 'CASH';
      case 'card': return 'CARD';
      case 'qr': return 'QR';
      case 'ewallet': return 'EWALLET';
      default: return 'CASH';
    }
  };

  // Ultra simple number format - no formatting at all
  const formatAmount = (amount: number): string => {
    return Math.round(amount).toString();
  };

  // Remove Vietnamese accents
  const removeAccents = (str: string): string => {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/Đ/g, 'D')
              .toUpperCase();
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
      {/* Ultra minimal print styles */}
      <style>{`
        @media print {
          @page {
            size: ${isPOSPrinter ? '58mm auto' : 'A4'};
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${isPOSPrinter ? '6px' : '12px'};
            line-height: 1.0;
            width: ${isPOSPrinter ? '58mm' : 'auto'};
          }
          body * {
            visibility: hidden;
          }
          .receipt-content, .receipt-content * {
            visibility: visible;
          }
          .receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: ${isPOSPrinter ? '58mm' : '100%'};
            padding: ${isPOSPrinter ? '1mm' : '10mm'};
            font-family: 'Courier New', Courier, monospace;
            font-size: ${isPOSPrinter ? '6px' : '12px'};
            line-height: 1.0;
            white-space: pre;
            overflow: hidden;
          }
          .no-print {
            display: none;
          }
          pre {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', Courier, monospace;
            font-size: ${isPOSPrinter ? '6px' : '10px'};
            line-height: 1.0;
            white-space: pre;
            overflow: hidden;
            word-wrap: break-word;
          }
        }
      `}</style>

      {/* Screen preview styles */}
      <style>{`
        @media screen {
          .receipt-content {
            max-width: ${isPOSPrinter ? '200px' : '600px'};
            margin: 20px auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border: 1px solid #ccc;
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

        {/* Receipt content */}
        <div className="receipt-content p-8">
          {isPOSPrinter ? (
            // POS Receipt Format - Pure ASCII Text
            <pre style={{fontFamily: 'Courier, monospace', fontSize: '10px', whiteSpace: 'pre', lineHeight: '1.0'}}>
{`    PINKWISH SHOP    
  PHU QUOC AN GIANG  
     0773491130      
  ruby7080@gmail.com 
--------------------
   ORDER #${orderDetail.orderId.toString().padStart(3, '0')}   
--------------------
CUSTOMER: ${removeAccents((orderDetail.customerName || orderDetail.customer?.hoTen || 'WALK-IN')).substring(0, 12)}
DATE: ${new Date(orderDetail.createdAt).toLocaleDateString('en-GB')}
TIME: ${new Date(orderDetail.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
PAY: ${formatPaymentMethod(orderDetail.paymentMethod)}
STAFF: ADMIN
--------------------
${orderDetail.items.map(item => {
  const name = removeAccents(item.productName).substring(0, 12).padEnd(12);
  const qty = item.quantity.toString();
  const price = formatAmount(item.totalPrice / item.quantity);
  const total = formatAmount(item.totalPrice);
  return `${name}\n${qty}x${price} = ${total}`;
}).join('\n')}
--------------------
SUBTOTAL:    ${formatAmount(orderDetail.subTotal)}
${orderDetail.taxAmount > 0 ? `VAT:         ${formatAmount(orderDetail.taxAmount)}\n` : ''}${orderDetail.discountAmount > 0 ? `DISCOUNT:   -${formatAmount(orderDetail.discountAmount)}\n` : ''}====================
TOTAL:       ${formatAmount(orderDetail.totalAmount)}
====================

   THANK YOU & SEE   
      YOU AGAIN      
`}
            </pre>
          ) : (
            // A4 Format
            <div style={{fontFamily: 'Arial, sans-serif'}}>
              <div style={{textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px'}}>
                <h2 style={{margin: 0, fontSize: '18px'}}>Pinkwish Shop</h2>
                <p style={{margin: '5px 0', fontSize: '12px'}}>Đ/c: Phú Quốc - An Giang</p>
                <p style={{margin: '5px 0', fontSize: '12px'}}>ĐT: 0773491130</p>
                <p style={{margin: '5px 0', fontSize: '12px'}}>Email: ruby7080@gmail.com</p>
              </div>

              <h3 style={{textAlign: 'center', margin: '20px 0'}}>Đơn hàng #{orderDetail.orderId}</h3>

              <div style={{marginBottom: '20px'}}>
                <p><strong>Khách hàng:</strong> {orderDetail.customerName || orderDetail.customer?.hoTen || 'Khách lẻ'}</p>
                <p><strong>Ngày tạo:</strong> {new Date(orderDetail.createdAt).toLocaleDateString('vi-VN')}</p>
                <p><strong>Giờ tạo:</strong> {new Date(orderDetail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Thanh toán:</strong> {formatPaymentMethod(orderDetail.paymentMethod)}</p>
                <p><strong>Thu ngân:</strong> Admin</p>
              </div>

              <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '20px'}}>
                <thead>
                  <tr style={{backgroundColor: '#f0f0f0'}}>
                    <th style={{border: '1px solid #000', padding: '8px', textAlign: 'left'}}>Sản phẩm</th>
                    <th style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>SL</th>
                    <th style={{border: '1px solid #000', padding: '8px', textAlign: 'right'}}>Đơn giá</th>
                    <th style={{border: '1px solid #000', padding: '8px', textAlign: 'right'}}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetail.items.map((item, index) => (
                    <tr key={index}>
                      <td style={{border: '1px solid #000', padding: '8px'}}>{item.productName}</td>
                      <td style={{border: '1px solid #000', padding: '8px', textAlign: 'center'}}>{item.quantity}</td>
                      <td style={{border: '1px solid #000', padding: '8px', textAlign: 'right'}}>
                        {formatAmount(item.totalPrice / item.quantity)}₫
                      </td>
                      <td style={{border: '1px solid #000', padding: '8px', textAlign: 'right'}}>
                        {formatAmount(item.totalPrice)}₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{textAlign: 'right', marginBottom: '20px'}}>
                <p><strong>Tạm tính:</strong> {formatAmount(orderDetail.subTotal)}₫</p>
                {orderDetail.taxAmount > 0 && (
                  <p><strong>VAT 10%:</strong> {formatAmount(orderDetail.taxAmount)}₫</p>
                )}
                {orderDetail.discountAmount > 0 && (
                  <p><strong>Giảm giá:</strong> -{formatAmount(orderDetail.discountAmount)}₫</p>
                )}
                <p style={{fontSize: '18px', borderTop: '2px solid #000', paddingTop: '10px'}}>
                  <strong>TỔNG CỘNG: {formatAmount(orderDetail.totalAmount)}₫</strong>
                </p>
              </div>

              <div style={{textAlign: 'center', marginTop: '30px', borderTop: '1px dashed #000', paddingTop: '10px'}}>
                <p>Cảm ơn quý khách - Hẹn gặp lại!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}