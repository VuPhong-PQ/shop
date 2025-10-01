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
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

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
  cashierName?: string;
  subtotal?: number;
};


export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
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

  const [, navigate] = useLocation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách đơn hàng</h1>
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
            <Card key={order.orderId}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Mã đơn: {order.orderId}</div>
                    <div>Khách hàng: {order.customerName || "-"}</div>
                    <div>Ngày tạo: {order.createdAt?.slice(0, 10)}</div>
                    <div>Tổng tiền: {order.totalAmount}₫</div>
                  </div>
                  <Button onClick={() => setSelectedOrder(order)} size="sm">
                    Xem & In
                  </Button>
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
            <div>Khách hàng: {selectedOrder.customerName || "-"}</div>
            <div>Ngày tạo: {selectedOrder.createdAt?.slice(0, 10)}</div>
            {/* Thông tin bổ sung */}
            <div>Hình thức thanh toán: <b>{selectedOrder.paymentMethod || "-"}</b></div>
            <div>Thu Ngân: <b>{selectedOrder.cashierName || "-"}</b></div>
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
