// Hàm upload ảnh lên server, trả về url
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("http://localhost:5271/api/upload/image", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload ảnh thất bại");
  const data = await res.json();
  return data.url.startsWith("/") ? `http://localhost:5271${data.url}` : data.url;
}
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

const productFormSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().optional().default(""),
  barcode: z.string().optional().default(""),
  price: z.number().min(0, "Giá bán là bắt buộc"),
  costPrice: z.number().min(0).optional().default(0),
  image: z.string().optional(),
  categoryId: z.string().min(1, "Danh mục là bắt buộc"),
  storeId: z.string().default("550e8400-e29b-41d4-a716-446655440002"),
  isActive: z.boolean().default(true),
  stockQuantity: z.number().min(0, "Số lượng tồn kho phải >= 0").default(0),
  minStockLevel: z.number().min(0, "Mức tồn kho tối thiểu phải >= 0").default(5),
  unit: z.string().default("chiếc"),
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

  // Debug logs
  console.log('Products data:', products);
  if (Array.isArray(products) && products.length > 0) {
    console.log('Sample product:', products[0]);
  }
  console.log('Products count:', products.length);
  console.log('isLoading:', isLoading);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Form for adding/editing products
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      barcode: "",
      price: 0,
      costPrice: 0,
      categoryId: "",
      storeId: "550e8400-e29b-41d4-a716-446655440002",
      stockQuantity: 0,
      minStockLevel: 5,
      unit: "chiếc",
      image: "",
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const formattedData = {
        ...productData,
        imageUrl: productData.image, // map image (frontend) -> imageUrl (backend)
        price: Number(productData.price),
        costPrice: productData.costPrice !== undefined ? Number(productData.costPrice) : 0,
        stockQuantity: Number(productData.stockQuantity),
        minStockLevel: Number(productData.minStockLevel),
      };
      const response = await apiRequest('POST', '/api/products', formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được thêm thành công",
      });
      // Force refresh both products and categories
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.refetchQueries({ queryKey: ['/api/products'] });
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
      // Map lại dữ liệu cho đúng backend
      const mappedData = {
        productId: parseInt(id),
        name: data.name,
        barcode: data.barcode,
        categoryId: data.categoryId ? parseInt(data.categoryId as string) : null,
        price: data.price !== undefined ? Number(data.price) : 0,
        costPrice: data.costPrice !== undefined ? Number(data.costPrice) : 0,
        stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : 0,
        minStockLevel: data.minStockLevel !== undefined ? Number(data.minStockLevel) : 0,
        unit: data.unit,
        imageUrl: data.image, // map image (frontend) -> imageUrl (backend)
        description: data.description,
      };
      const response = await apiRequest('PUT', `/api/products/${id}`, mappedData);
      // Nếu response là 204 No Content thì trả về null, vẫn coi là thành công
      if (response.status === 204) return null;
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được cập nhật",
      });
  queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  setTimeout(() => queryClient.refetchQueries({ queryKey: ['/api/products'] }), 300);
      setIsAddDialogOpen(false);
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
  const response = await apiRequest('DELETE', `/api/products/${id}`);
  if (response.status === 204) return null;
  return response.json();
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
  const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = selectedCategory === "all" || String(product.categoryId) === String(selectedCategory);
  return matchesSearch && matchesCategory;
  });

  // Debug filtered products
  console.log('Filtered products:', filteredProducts);
  console.log('Filtered products count:', filteredProducts.length);
  console.log('Search term:', searchTerm);
  console.log('Selected category:', selectedCategory);

  // Handle form submission
  const onSubmit = (data: ProductFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', form.formState.errors);
    if (editingProduct) {
      // Đảm bảo lấy đúng id (string hoặc số đều được, backend nhận uuid hoặc int)
      const productId = editingProduct.id || editingProduct.productId || editingProduct._id;
      if (!productId) {
        toast({ title: 'Lỗi', description: 'Không xác định được ID sản phẩm để cập nhật', variant: 'destructive' });
        return;
      }
      console.log('Editing product:', editingProduct, 'id:', productId);
      editProductMutation.mutate({ id: String(productId), data });
    } else {
      console.log('Adding new product');
      addProductMutation.mutate(data);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      barcode: product.barcode || "",
      price: Number(product.price),
      costPrice: product.costPrice ? Number(product.costPrice) : 0,
      categoryId: product.categoryId ? String(product.categoryId) : "",
      storeId: product.storeId,
      stockQuantity: Number(product.stockQuantity),
      minStockLevel: Number(product.minStockLevel),
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
                {categories.filter(category => !!category.id).map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
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
                            <Input {...field} placeholder="Tên sản phẩm" data-testid="input-product-name" />
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
                            <Input {...field} placeholder="Mã vạch" data-testid="input-product-barcode" />
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
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-product-category">
                                <SelectValue placeholder="Chọn danh mục" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.filter(category => !!category.id).map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
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
                            <Input {...field} type="number" placeholder="0" data-testid="input-product-price" onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
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
                            <Input {...field} type="number" placeholder="0" data-testid="input-product-costPrice" onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
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
                            <Input {...field} type="number" placeholder="0" data-testid="input-product-stockQuantity" onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
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
                            <Input {...field} type="number" placeholder="0" data-testid="input-product-minStockLevel" onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
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
                          <FormControl>
                            <Input {...field} placeholder="Đơn vị" data-testid="input-product-unit" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Upload hình ảnh */}
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hình ảnh</FormLabel>
                          <FormControl>
                            <div>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const url = await uploadImage(file);
                                      field.onChange(url);
                                      toast({ title: "Tải ảnh thành công", description: "Ảnh đã được upload." });
                                    } catch {
                                      toast({ title: "Lỗi", description: "Tải ảnh thất bại", variant: "destructive" });
                                    }
                                  }
                                }}
                              />
                              {typeof field.value === "string" && field.value && (
                                <img src={field.value} alt="preview" style={{ maxWidth: 120, marginTop: 8 }} />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Mô tả sản phẩm" data-testid="input-product-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                      onClick={() => console.log('Submit button clicked')}
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
              // Ưu tiên imageUrl, sau đó đến image, cuối cùng là ảnh mặc định
              let imageUrl = product.imageUrl || product.image || "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=200&fit=crop";
              if (imageUrl && typeof imageUrl === "string" && !imageUrl.startsWith("http")) {
                imageUrl = `http://localhost:5271${imageUrl}`;
              }
              const key = product.productId || product.id;
              return (
                <Card key={key} className="overflow-hidden" data-testid={`product-card-${key}`}> 
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain"
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                      <Badge
                        className={`absolute top-2 right-2 text-white ${stockStatus.color}`}
                        data-testid={`stock-status-${key}`}
                      >
                        {stockStatus.label}
                      </Badge>
                      {product.stockQuantity <= product.minStockLevel && (
                        <AlertTriangle className="absolute top-2 left-2 w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2" data-testid={`product-name-${key}`}>
                        {product.name}
                      </h3>
                      {/* Đã xóa hiển thị SKU */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-2xl font-bold text-primary" data-testid={`product-price-${key}`}>
                            {parseInt(product.price).toLocaleString('vi-VN')}₫
                          </p>
                          {product.costPrice && (
                            <p className="text-sm text-gray-500">
                              Vốn: {parseInt(product.costPrice).toLocaleString('vi-VN')}₫
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium" data-testid={`product-stock-${key}`}>
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
                          data-testid={`button-edit-${key}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProduct(key)}
                          data-testid={`button-delete-${key}`}
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
