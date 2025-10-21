import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function PrintOrder() {
  const [, params] = useRoute("/print-order/:orderId");
  const [, navigate] = useLocation();
  
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  // Fetch order details
  const { data: orderDetail, isLoading } = useQuery({
    queryKey: ['/api/orders', orderId],
    queryFn: () => apiRequest(`/api/orders/${orderId}`, { method: 'GET' }),
    enabled: !!orderId,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!orderDetail) {
    return <div>Order not found</div>;
  }

  return (
    <>
      {/* Ultra simple print styles for POS */}
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace !important;
            font-size: 8px !important;
            margin: 0 !important;
            padding: 1mm !important;
            width: 58mm !important;
          }
          body * {
            visibility: hidden;
          }
          .print-receipt, .print-receipt * {
            visibility: visible !important;
          }
          .print-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            font-family: 'Courier New', monospace !important;
            font-size: 8px !important;
            line-height: 1.0 !important;
            padding: 1mm !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
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
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              In đơn hàng
            </Button>
          </div>
        </div>

        {/* Receipt content */}
        <div className="print-receipt p-8">
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            lineHeight: '1.2',
            whiteSpace: 'pre',
            border: '1px solid #ccc',
            padding: '20px',
            margin: '20px auto',
            maxWidth: '300px',
            backgroundColor: 'white'
          }}>
{`    PINKWISH SHOP    
  PHU QUOC AN GIANG  
     0773491130      
  ruby7080@gmail.com 
--------------------
   ORDER #${orderDetail.orderId.toString().padStart(3, '0')}   
--------------------
CUSTOMER: ${(orderDetail.customerName || 'WALK-IN').substring(0, 12).toUpperCase()}
DATE: ${new Date(orderDetail.createdAt).toLocaleDateString('en-GB')}
TIME: ${new Date(orderDetail.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
PAY: CASH
STAFF: ADMIN
--------------------
${orderDetail.items.map(item => {
  const name = item.productName.substring(0, 12).toUpperCase();
  const qty = item.quantity.toString();
  const price = Math.round(item.totalPrice / item.quantity).toString();
  const total = Math.round(item.totalPrice).toString();
  return `${name}\n${qty}x${price} = ${total}`;
}).join('\n')}
--------------------
SUBTOTAL:    ${Math.round(orderDetail.subTotal)}
${orderDetail.taxAmount > 0 ? `VAT:         ${Math.round(orderDetail.taxAmount)}\n` : ''}${orderDetail.discountAmount > 0 ? `DISCOUNT:   -${Math.round(orderDetail.discountAmount)}\n` : ''}====================
TOTAL:       ${Math.round(orderDetail.totalAmount)}
====================

   THANK YOU & SEE   
      YOU AGAIN      
`}
          </div>
        </div>
      </div>
    </>
  );
}