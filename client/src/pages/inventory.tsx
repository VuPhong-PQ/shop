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
import type { 
  Product, 
  InventoryTransaction, 
  InventoryTransactionResponse, 
  InventorySummary,
  CreateInboundTransactionDto,
  CreateOutboundTransactionDto
} from "@/types/backend-types";

const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Vui lòng chọn sản phẩm"),
  type: z.enum(["inbound", "outbound"]),
  quantity: z.number().min(1, "Số lượng phải lớn hơn 0"),
  unitPrice: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0").optional(),
  reason: z.string().min(1, "Vui lòng nhập lý do"),
  notes: z.string().optional(),
  supplierName: z.string().optional(),
  referenceNumber: z.string().optional(),
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

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

  // Fetch inventory transactions
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useQuery<InventoryTransactionResponse>({
    queryKey: ['/api/inventory/transactions'],
    queryFn: () => apiRequest('/api/inventory/transactions'),
  });

  // Fetch inventory summary
  const { data: inventorySummary = [], isLoading: isLoadingSummary } = useQuery<InventorySummary[]>({
    queryKey: ['/api/inventory/summary'],
    queryFn: () => apiRequest('/api/inventory/summary'),
  });

  // Form for stock adjustment
  const form = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: "",
      type: "inbound",
      quantity: 1,
      unitPrice: 0,
      reason: "",
      notes: "",
      supplierName: "",
      referenceNumber: "",
    },
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: StockAdjustmentData) => {
      const productId = parseInt(data.productId);
      
      if (data.type === 'inbound') {
        const payload: CreateInboundTransactionDto = {
          productId,
          quantity: data.quantity,
          unitPrice: data.unitPrice || 0,
          reason: data.reason,
          notes: data.notes,
          supplierName: data.supplierName,
          referenceNumber: data.referenceNumber,
        };
        
        return apiRequest('/api/inventory/inbound', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        const payload: CreateOutboundTransactionDto = {
          productId,
          quantity: data.quantity,
          reason: data.reason,
          notes: data.notes,
          referenceNumber: data.referenceNumber,
        };
        
        return apiRequest('/api/inventory/outbound', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật tồn kho",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/summary'] });
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
                            <FormLabel>Loại giao dịch *</FormLabel>
                            <Select onValueChange={(value) => {
                              console.log('Type selected:', value);
                              field.onChange(value);
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-adjustment-type" className="w-full">
                                  <SelectValue placeholder="Chọn loại giao dịch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-50" position="popper">
                                <SelectItem value="inbound">Nhập kho</SelectItem>
                                <SelectItem value="outbound">Xuất kho</SelectItem>
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

                      {form.watch("type") === "inbound" && (
                        <FormField
                          control={form.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Giá nhập</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-unit-price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

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

                      {form.watch("type") === "inbound" && (
                        <FormField
                          control={form.control}
                          name="supplierName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nhà cung cấp</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-supplier-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="referenceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số chứng từ</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-reference-number" />
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
                {isLoadingTransactions ? (
                  <div className="text-center py-8">
                    <p>Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactionsResponse?.data.map((transaction) => (
                      <div 
                        key={transaction.transactionId} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`transaction-${transaction.transactionId}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'IN' ? 'bg-green-100 text-green-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'IN' ? <TrendingUp className="w-4 h-4" /> :
                             <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.productName}</p>
                            <p className="text-sm text-gray-500">{transaction.reason}</p>
                            {transaction.notes && (
                              <p className="text-xs text-gray-400">{transaction.notes}</p>
                            )}
                            {transaction.supplierName && (
                              <p className="text-xs text-blue-600">NCC: {transaction.supplierName}</p>
                            )}
                            {transaction.referenceNumber && (
                              <p className="text-xs text-gray-400">Ref: {transaction.referenceNumber}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'IN' ? '+' : ''}
                            {transaction.quantity}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.stockBefore} → {transaction.stockAfter}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(transaction.transactionDate).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-xs text-green-600">
                            {new Intl.NumberFormat('vi-VN', { 
                              style: 'currency', 
                              currency: 'VND' 
                            }).format(Math.abs(transaction.totalValue))}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!transactionsResponse?.data || transactionsResponse.data.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Chưa có hoạt động xuất nhập kho nào</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}