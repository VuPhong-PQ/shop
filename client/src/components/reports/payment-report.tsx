import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Banknote, CreditCard, QrCode, Smartphone, TrendingUp, Calendar, RefreshCw } from "lucide-react";

interface PaymentStat {
  paymentMethod: string;
  paymentMethodId: string;
  totalAmount: number;
  orderCount: number;
  percentage: number;
}

interface PaymentStatsData {
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalOrders: number;
  paymentStats: PaymentStat[];
}

export function PaymentReport() {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Chỉ lấy 7 ngày gần nhất
    return date.toISOString().split('T')[0];
  });
  
  const [toDate, setToDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Thêm 1 ngày để đảm bảo bao gồm hôm nay
    return date.toISOString().split('T')[0];
  });

  const { data: paymentStats, isLoading, refetch } = useQuery<PaymentStatsData>({
    queryKey: ["/api/PaymentStats", fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        fromDate: fromDate,
        toDate: toDate
      });
      const res = await apiRequest(`/api/PaymentStats?${params}`, { method: "GET" });
      console.log('Payment stats data:', res); // Debug log
      return res;
    },
  });

  const getPaymentIcon = (methodId: string) => {
    switch (methodId) {
      case 'cash': return <Banknote className="w-5 h-5 text-green-600" />;
      case 'card': return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'qr': return <QrCode className="w-5 h-5 text-purple-600" />;
      case 'ewallet': return <Smartphone className="w-5 h-5 text-orange-600" />;
      default: return <Banknote className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPaymentColor = (methodId: string) => {
    switch (methodId) {
      case 'cash': return 'bg-green-500';
      case 'card': return 'bg-blue-500';
      case 'qr': return 'bg-purple-500';
      case 'ewallet': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header với bộ lọc ngày */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Báo cáo Hình thức Thanh toán
          </h2>
          <p className="text-gray-600 text-sm">
            Thống kê doanh thu theo phương thức thanh toán
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex gap-2 items-center">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-auto text-sm"
            />
            <span className="text-gray-500">-</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-auto text-sm"
            />
          </div>
          <Button onClick={handleRefresh} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-1" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-green-600">
                  {paymentStats?.totalRevenue?.toLocaleString('vi-VN')}₫
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-blue-600">
                  {paymentStats?.totalOrders || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">#{paymentStats?.totalOrders || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Phương thức phổ biến</p>
                <p className="text-lg font-semibold text-purple-600">
                  {paymentStats?.paymentStats?.[0]?.paymentMethod || "Chưa có dữ liệu"}
                </p>
              </div>
              {paymentStats?.paymentStats?.[0] && getPaymentIcon(paymentStats.paymentStats[0].paymentMethodId)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Số phương thức sử dụng</p>
                <p className="text-2xl font-bold text-orange-600">
                  {paymentStats?.paymentStats?.length || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">{paymentStats?.paymentStats?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ và bảng xếp hạng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ dạng cột */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Biểu đồ Doanh thu theo Hình thức</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentStats?.paymentStats?.map((stat, index) => (
                <div key={stat.paymentMethodId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(stat.paymentMethodId)}
                      <span className="font-medium">{stat.paymentMethod}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{stat.totalAmount.toLocaleString('vi-VN')}₫</div>
                      <div className="text-sm text-gray-500">{stat.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getPaymentColor(stat.paymentMethodId)}`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.orderCount} đơn hàng
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bảng xếp hạng */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Xếp hạng Hình thức Thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentStats?.paymentStats?.map((stat, index) => (
                <div key={stat.paymentMethodId} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {getPaymentIcon(stat.paymentMethodId)}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="font-medium">{stat.paymentMethod}</div>
                    <div className="text-sm text-gray-500">
                      {stat.orderCount} đơn hàng • {stat.percentage}%
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {stat.totalAmount.toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                </div>
              ))}
              
              {(!paymentStats?.paymentStats || paymentStats.paymentStats.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có dữ liệu thanh toán</p>
                  <p className="text-sm">Hãy thực hiện một số giao dịch để xem báo cáo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}