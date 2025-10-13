import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle 
} from "lucide-react";

interface DashboardMetrics {
  todayRevenue: number;
  revenueGrowth: string;
  totalOrders: number;
  todayOrdersCount: number;
  orderGrowth: string;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const { currentStore } = useAuth();

  const { data: metricsResponse, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", currentStore?.storeId],
    queryFn: async () => {
      if (!currentStore?.storeId) return null;
      const response = await api.getDashboardMetrics(currentStore.storeId);
      return response.success ? response.data : null;
    },
    enabled: !!currentStore?.storeId,
  });

  const metrics = metricsResponse as DashboardMetrics;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {currentStore && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-blue-800">
            Đang xem dữ liệu của: {currentStore.name}
          </h2>
          <p className="text-blue-600">{currentStore.address}</p>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="sales">Bán hàng</TabsTrigger>
          <TabsTrigger value="inventory">Kho hàng</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Doanh thu hôm nay
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.todayRevenue?.toLocaleString('vi-VN') || '0'} đ
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.revenueGrowth || '+0%'} so với hôm qua
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Đơn hàng hôm nay
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.todayOrdersCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.orderGrowth || '+0%'} so với hôm qua
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tổng khách hàng
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.totalCustomers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trong hệ thống
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sản phẩm sắp hết
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {metrics?.lowStockCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cần nhập thêm
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê bán hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold">{metrics?.totalOrders || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Doanh thu hôm nay</p>
                  <p className="text-2xl font-bold">
                    {metrics?.todayRevenue?.toLocaleString('vi-VN') || '0'} đ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin kho hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold">{metrics?.totalProducts || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sản phẩm sắp hết</p>
                  <p className="text-2xl font-bold text-red-600">
                    {metrics?.lowStockCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}