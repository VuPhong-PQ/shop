import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: "2025-10-01",
    endDate: "2025-10-02"
  });
  const [reportType, setReportType] = useState("summary");

  // Fetch report data
  const { data: salesSummary, isLoading: salesLoading } = useQuery({
    queryKey: ['/api/reports/sales-summary', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5271/api/reports/sales-summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales summary');
      }
      return response.json();
    },
  });

  const { data: productPerformance, isLoading: productLoading } = useQuery({
    queryKey: ['/api/reports/product-performance', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5271/api/reports/product-performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product performance');
      }
      return response.json();
    },
  });

  const { data: customerAnalytics, isLoading: customerLoading } = useQuery({
    queryKey: ['/api/reports/customer-analytics', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5271/api/reports/customer-analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer analytics');
      }
      return response.json();
    },
  });

  const { data: profitAnalysis, isLoading: profitLoading } = useQuery({
    queryKey: ['/api/reports/profit-analysis', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5271/api/reports/profit-analysis?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profit analysis');
      }
      return response.json();
    },
  });

  const isLoading = salesLoading || productLoading || customerLoading || profitLoading;

  // Chart data formatting
  const chartData = productPerformance?.topProducts?.map(product => ({
    name: product.name,
    revenue: parseFloat(product.revenue.replace(/[₫.,]/g, '')),
    sold: product.totalSold
  })) || [];

  const pieData = productPerformance?.topProducts?.slice(0, 4).map((product, index) => ({
    name: product.name,
    value: parseFloat(product.revenue.replace(/[₫.,]/g, '')),
    color: COLORS[index]
  })) || [];

  const profitTrendData = profitAnalysis?.monthlyTrend?.map(item => ({
    month: item.month,
    profit: parseFloat(item.profit.replace(/[₫.,]/g, '')),
    margin: parseFloat(item.margin.replace('%', ''))
  })) || [];

  return (
    <AppLayout title="Báo cáo & Phân tích">
      <div className="space-y-6" data-testid="reports-page">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Bộ lọc báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Từ ngày</Label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Đến ngày</Label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  data-testid="input-end-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Loại báo cáo</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger data-testid="select-report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Tổng quan</SelectItem>
                    <SelectItem value="detailed">Chi tiết</SelectItem>
                    <SelectItem value="comparison">So sánh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  Xuất báo cáo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="products">Sản phẩm</TabsTrigger>
              <TabsTrigger value="customers">Khách hàng</TabsTrigger>
              <TabsTrigger value="profit">Lợi nhuận</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card data-testid="card-total-revenue">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tổng doanh thu</p>
                        <p className="text-2xl font-bold">{salesSummary?.totalRevenue || "0₫"}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-xs text-green-600">+12.5% so với tháng trước</span>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-total-orders">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tổng đơn hàng</p>
                        <p className="text-2xl font-bold">{salesSummary?.totalOrders || 0}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-xs text-green-600">+8.2% so với tháng trước</span>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-total-customers">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tổng khách hàng</p>
                        <p className="text-2xl font-bold">{customerAnalytics?.totalCustomers || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-xs text-green-600">+{customerAnalytics?.newCustomers || 0} khách mới</span>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-products-sold">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Sản phẩm bán ra</p>
                        <p className="text-2xl font-bold">{productPerformance?.totalProductsSold || 0}</p>
                      </div>
                      <Package className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-muted-foreground">Phổ biến: {productPerformance?.mostPopularProduct || "N/A"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Doanh thu theo sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString('vi-VN') + '₫', 'Doanh thu']} />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Performance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top sản phẩm bán chạy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {productPerformance?.topProducts?.map((product, index) => (
                        <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">Đã bán: {product.totalSold}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{product.revenue}</p>
                            <p className="text-sm text-green-600">{product.profit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Revenue Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5" />
                      Phân bố doanh thu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value.toLocaleString('vi-VN') + '₫', 'Doanh thu']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {pieData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-xs">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Thống kê khách hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Tổng khách hàng:</span>
                      <Badge variant="outline">{customerAnalytics?.totalCustomers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Khách hàng mới:</span>
                      <Badge className="bg-green-100 text-green-800">{customerAnalytics?.newCustomers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Khách hàng quay lại:</span>
                      <Badge className="bg-blue-100 text-blue-800">{customerAnalytics?.returningCustomers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Trung bình đơn/khách:</span>
                      <Badge variant="outline">{customerAnalytics?.averageOrdersPerCustomer}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Customers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Khách hàng VIP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customerAnalytics?.topCustomers?.map((customer, index) => (
                        <div key={customer.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.orders} đơn hàng</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">{customer.totalSpent}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profit" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profit Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tổng quan lợi nhuận</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Lợi nhuận gộp:</span>
                        <span className="font-medium text-green-600">{profitAnalysis?.grossProfit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chi phí hàng bán:</span>
                        <span className="font-medium">{profitAnalysis?.costOfGoodsSold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chi phí hoạt động:</span>
                        <span className="font-medium text-red-600">{profitAnalysis?.operatingExpenses}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Lợi nhuận ròng:</span>
                        <span className="font-bold text-green-600">{profitAnalysis?.totalProfit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tỷ suất lợi nhuận:</span>
                        <Badge className="bg-green-100 text-green-800">{profitAnalysis?.profitMargin}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profit Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5" />
                      Xu hướng lợi nhuận
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={profitTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [value.toLocaleString('vi-VN') + '₫', 'Lợi nhuận']} />
                        <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Profitable Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Sản phẩm sinh lời cao nhất</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profitAnalysis?.topProfitableProducts?.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">Tỷ suất: {product.margin}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{product.profit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
