import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import type { Product, Category } from "@shared/schema";

const productFormSchema = insertProductSchema.extend({
  price: z.string().min(1, "Giá bán là bắt buộc"),
  costPrice: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function Products() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products and categories
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Form for adding/editing products
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      price: "",
      costPrice: "",
      categoryId: "",
      storeId: "store-1", // Should come from context
      stockQuantity: 0,
      minStockLevel: 5,
      unit: "pcs",
      image: "",
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const formattedData = {
        ...productData,
        price: productData.price,
        costPrice: productData.costPrice || null,
      };
      return apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify(formattedData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được thêm thành công",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  });

  // Edit product mutation
  const editProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      return apiRequest(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditingProduct(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật sản phẩm",
        variant: "destructive",
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/products/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm",
        variant: "destructive",
      });
    }
  });

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle form submission
  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      editProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      addProductMutation.mutate(data);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      sku: product.sku,
      barcode: product.barcode || "",
      price: product.price,
      costPrice: product.costPrice || "",
      categoryId: product.categoryId || "",
      storeId: product.storeId,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      unit: product.unit,
      image: product.image || "",
    });
    setIsAddDialogOpen(true);
  };

  // Handle delete product
  const handleDeleteProduct = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteProductMutation.mutate(id);
    }
  };

  // Get stock status
  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { label: "Hết hàng", color: "bg-red-500" };
    } else if (product.stockQuantity <= product.minStockLevel) {
      return { label: "Sắp hết", color: "bg-orange-500" };
    } else {
      return { label: "Còn hàng", color: "bg-green-500" };
    }
  };

  return (
    <AppLayout title="Sản phẩm">
      <div data-testid="products-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative w-80">
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-product-search"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  form.reset();
                }}
                data-testid="button-add-product"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên sản phẩm *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-product-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã SKU *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-product-sku" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã vạch</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-product-barcode" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Danh mục</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-product-category">
                                <SelectValue placeholder="Chọn danh mục" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá bán *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="0"
                              data-testid="input-product-price"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá vốn</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="0"
                              data-testid="input-product-cost"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số lượng tồn kho</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-product-stock"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minStockLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mức tồn kho tối thiểu</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-product-min-stock"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Đơn vị</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-product-unit">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pcs">Cái</SelectItem>
                              <SelectItem value="kg">Kg</SelectItem>
                              <SelectItem value="liter">Lít</SelectItem>
                              <SelectItem value="box">Thùng</SelectItem>
                              <SelectItem value="pack">Gói</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL hình ảnh</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-product-image" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={3}
                            data-testid="textarea-product-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={addProductMutation.isPending || editProductMutation.isPending}
                      data-testid="button-save-product"
                    >
                      {addProductMutation.isPending || editProductMutation.isPending 
                        ? "Đang lưu..." 
                        : (editingProduct ? "Cập nhật" : "Thêm")
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeleton
            [...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredProducts.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Thử thay đổi bộ lọc tìm kiếm"
                    : "Bắt đầu bằng cách thêm sản phẩm đầu tiên"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product.id} className="overflow-hidden" data-testid={`product-card-${product.id}`}>
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=200&fit=crop"}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <Badge
                        className={`absolute top-2 right-2 text-white ${stockStatus.color}`}
                        data-testid={`stock-status-${product.id}`}
                      >
                        {stockStatus.label}
                      </Badge>
                      {product.stockQuantity <= product.minStockLevel && (
                        <AlertTriangle className="absolute top-2 left-2 w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2" data-testid={`product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-2xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
                            {parseInt(product.price).toLocaleString('vi-VN')}₫
                          </p>
                          {product.costPrice && (
                            <p className="text-sm text-gray-500">
                              Vốn: {parseInt(product.costPrice).toLocaleString('vi-VN')}₫
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium" data-testid={`product-stock-${product.id}`}>
                            Tồn: {product.stockQuantity} {product.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            Tối thiểu: {product.minStockLevel}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditProduct(product)}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProduct(product.id)}
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
