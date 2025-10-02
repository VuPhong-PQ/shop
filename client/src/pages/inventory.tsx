import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { normalizeSearchText } from "@/lib/utils";
import { Package, Search, AlertTriangle, TrendingUp, TrendingDown, Plus, Minus, FileText, BarChart3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import type { Product } from "@/types/backend-types";

const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Vui lòng chọn sản phẩm"),
  type: z.enum(["adjustment", "stock_in", "stock_out"]),
  quantity: z.number().min(1, "Số lượng phải lớn hơn 0"),
  reason: z.string().min(1, "Vui lòng nhập lý do"),
  notes: z.string().optional(),
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "adjustment" | "stock_in" | "stock_out";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes?: string;
  createdAt: Date;
  userId: string;
}

export default function Inventory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);

  // Reset form when dialog opens
  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      form.reset();
    }
    setIsAdjustmentDialogOpen(open);
  };

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Debug: Log products data
  console.log('Products data:', products);
  if (products.length > 0) {
    console.log('First product structure:', products[0]);
    console.log('Product ID field:', products[0].productId);
  }

  // Mock stock movements - in real app this would come from API
  const stockMovements: StockMovement[] = [
    {
      id: "1",
      productId: "prod-1",
      productName: "iPhone 13",
      type: "stock_in",
      quantity: 50,
      previousStock: 20,
      newStock: 70,
      reason: "Nhập hàng mới",
      createdAt: new Date(),
      userId: "user-1"
    },
    {
      id: "2",
      productId: "prod-2",
      productName: "Samsung Galaxy S21",
      type: "stock_out",
      quantity: 5,
      previousStock: 15,
      newStock: 10,
      reason: "Bán hàng",
      createdAt: new Date(),
      userId: "user-1"
    }
  ];

  // Form for stock adjustment
  const form = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: "",
      type: "adjustment",
      quantity: 1,
      reason: "",
      notes: "",
    },
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: StockAdjustmentData) => {
      // Calculate new quantity based on type
      const product = products.find(p => p.productId.toString() === data.productId);
      if (!product) {
        throw new Error('Sản phẩm không tồn tại');
      }

      let newQuantity = product.stockQuantity;
      if (data.type === 'stock_in') {
        newQuantity += data.quantity;
      } else if (data.type === 'stock_out') {
        newQuantity -= data.quantity;
        if (newQuantity < 0) newQuantity = 0;
      } else if (data.type === 'adjustment') {
        newQuantity = data.quantity;
      }

      const requestBody = {
        newQuantity: newQuantity,
        reason: data.reason + (data.notes ? ` (${data.notes})` : '')
      };

      return apiRequest(`/api/products/${data.productId}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật tồn kho",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAdjustmentDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tồn kho",
        variant: "destructive",
      });
    }
  });

  // Filter products with Vietnamese diacritics support
  const filteredProducts = products.filter(product => {
    const searchNormalized = normalizeSearchText(searchTerm);
    const productNameNormalized = normalizeSearchText(product.name || '');
    const productBarcodeNormalized = normalizeSearchText(product.barcode || '');
    
    const matchesSearch = productNameNormalized.includes(searchNormalized) ||
                         productBarcodeNormalized.includes(searchNormalized);
    
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = product.stockQuantity <= product.minStockLevel;
    } else if (stockFilter === "out") {
      matchesStock = product.stockQuantity === 0;
    } else if (stockFilter === "normal") {
      matchesStock = product.stockQuantity > product.minStockLevel;
    }
    
    return matchesSearch && matchesStock;
  });

  // Get stock status
  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { label: "Hết hàng", color: "bg-red-500", icon: AlertTriangle };
    } else if (product.stockQuantity <= product.minStockLevel) {
      return { label: "Sắp hết", color: "bg-orange-500", icon: AlertTriangle };
    } else {
      return { label: "Bình thường", color: "bg-green-500", icon: Package };
    }
  };

  // Calculate inventory metrics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
  const outOfStockProducts = products.filter(p => p.stockQuantity === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * p.stockQuantity), 0);

  // Handle form submission
  const onSubmit = (data: StockAdjustmentData) => {
    console.log('Form submitted with data:', data);
    adjustStockMutation.mutate(data);
  };

  return (
    <AppLayout title="Quản lý kho">
      <div data-testid="inventory-page">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="total-products">
                    {totalProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sắp hết hàng</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="low-stock-products">
                    {lowStockProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="out-of-stock-products">
                    {outOfStockProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Giá trị tồn kho</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="inventory-value">
                    {totalValue.toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products" data-testid="tab-products">Sản phẩm</TabsTrigger>
            <TabsTrigger value="movements" data-testid="tab-movements">Lịch sử xuất nhập</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-80">
                  <Input
                    placeholder="Tìm kiếm sản phẩm (có thể gõ không dấu)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-product-search"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-48" data-testid="select-stock-filter">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="normal">Bình thường</SelectItem>
                    <SelectItem value="low">Sắp hết hàng</SelectItem>
                    <SelectItem value="out">Hết hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isAdjustmentDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button data-testid="button-adjust-stock" onClick={() => {
                    console.log('Dialog opening, products available:', products.length);
                  }}>
                    <Package className="w-4 h-4 mr-2" />
                    Điều chỉnh tồn kho
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sản phẩm *</FormLabel>
                            <Select onValueChange={(value) => {
                              console.log('Product selected:', value);
                              field.onChange(value);
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-adjustment-product" className="w-full">
                                  <SelectValue placeholder="Chọn sản phẩm" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-50" position="popper">
                                {products.length === 0 ? (
                                  <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                                ) : (
                                  products.map((product, index) => {
                                    console.log(`Product ${index}:`, product.productId, product.name);
                                    return (
                                      <SelectItem key={product.productId} value={String(product.productId)}>
                                        {product.name} (Hiện tại: {product.stockQuantity})
                                      </SelectItem>
                                    );
                                  })
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            {field.value && (
                              <div className="text-sm text-gray-600 mt-1">
                                {(() => {
                                  const selectedProduct = products.find(p => p.productId.toString() === field.value);
                                  return selectedProduct ? (
                                    <span>Tồn kho hiện tại: <strong>{selectedProduct.stockQuantity}</strong> {selectedProduct.unit || 'sản phẩm'}</span>
                                  ) : null;
                                })()}
                              </div>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loại điều chỉnh *</FormLabel>
                            <Select onValueChange={(value) => {
                              console.log('Type selected:', value);
                              field.onChange(value);
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-adjustment-type" className="w-full">
                                  <SelectValue placeholder="Kiểm kê điều chỉnh" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-50" position="popper">
                                <SelectItem value="stock_in">Nhập kho (cộng thêm)</SelectItem>
                                <SelectItem value="stock_out">Xuất kho (trừ đi)</SelectItem>
                                <SelectItem value="adjustment">Kiểm kê điều chỉnh (đặt số lượng mới)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số lượng *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-adjustment-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lý do *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-adjustment-reason" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ghi chú</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-adjustment-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAdjustmentDialogOpen(false)}
                          data-testid="button-cancel"
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          disabled={adjustStockMutation.isPending}
                          data-testid="button-save-adjustment"
                        >
                          {adjustStockMutation.isPending ? "Đang lưu..." : "Lưu"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tồn kho
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tối thiểu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giá trị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-12"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-6 bg-gray-200 rounded w-20"></div>
                            </td>
                          </tr>
                        ))
                      ) : filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Không tìm thấy sản phẩm</p>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => {
                          const status = getStockStatus(product);
                          const StatusIcon = status.icon;
                          const stockValue = Number(product.price) * product.stockQuantity;

                          return (
                            <tr key={product.productId} data-testid={`product-row-${product.productId}`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <img
                                    src={
                                      product.imageUrl
                                        ? product.imageUrl.startsWith("/uploads")
                                          ? `http://localhost:5271${product.imageUrl}`
                                          : product.imageUrl
                                        : "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=40&h=40&fit=crop"
                                    }
                                    alt={product.name || 'Product'}
                                    className="w-10 h-10 rounded-lg object-cover mr-3"
                                  />
                                  <div>
                                    <p className="font-medium text-gray-900" data-testid={`product-name-${product.productId}`}>
                                      {product.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {Number(product.price).toLocaleString('vi-VN')}₫
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900" data-testid={`product-sku-${product.productId}`}>
                                {product.barcode || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-lg font-semibold" data-testid={`product-stock-${product.productId}`}>
                                  {product.stockQuantity}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">{product.unit}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500" data-testid={`product-min-stock-${product.productId}`}>
                                {product.minStockLevel}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900" data-testid={`product-value-${product.productId}`}>
                                {stockValue.toLocaleString('vi-VN')}₫
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={`text-white ${status.color}`} data-testid={`product-status-${product.productId}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Lịch sử xuất nhập kho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockMovements.map((movement) => (
                    <div 
                      key={movement.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`movement-${movement.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          movement.type === 'stock_in' ? 'bg-green-100 text-green-600' :
                          movement.type === 'stock_out' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {movement.type === 'stock_in' ? <TrendingUp className="w-4 h-4" /> :
                           movement.type === 'stock_out' ? <TrendingDown className="w-4 h-4" /> :
                           <Package className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{movement.productName}</p>
                          <p className="text-sm text-gray-500">{movement.reason}</p>
                          {movement.notes && (
                            <p className="text-xs text-gray-400">{movement.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          movement.type === 'stock_in' ? 'text-green-600' :
                          movement.type === 'stock_out' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {movement.type === 'stock_in' ? '+' : movement.type === 'stock_out' ? '-' : '±'}
                          {movement.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          {movement.previousStock} → {movement.newStock}
                        </p>
                        <p className="text-xs text-gray-400">
                          {movement.createdAt.toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {stockMovements.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Chưa có hoạt động xuất nhập kho nào</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}