import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Folder,
  FolderPlus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  Package,
  Grid3X3,
  Eye,
  EyeOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Tên nhóm là bắt buộc"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  color: z.string().optional()
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

const getCategoryColor = (color?: string) => {
  const colors: { [key: string]: string } = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200"
  };
  return colors[color || "gray"] || colors.gray;
};

export default function ProductGroups() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch products to count items per category
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  // Form
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      sortOrder: 0,
      color: "blue"
    },
  });

  // Mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      const response = await apiRequest('POST', '/api/categories', {
        ...categoryData,
        id: `cat-${Date.now()}`,
        storeId: "550e8400-e29b-41d4-a716-446655440002"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Nhóm sản phẩm đã được thêm thành công",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm nhóm sản phẩm",
        variant: "destructive",
      });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      const response = await apiRequest('PUT', `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Nhóm sản phẩm đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật nhóm sản phẩm",
        variant: "destructive",
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Nhóm sản phẩm đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhóm sản phẩm",
        variant: "destructive",
      });
    }
  });

  // Filter categories
  const filteredCategories = categories.filter((category: any) => {
    return category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      addCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    form.reset({
      name: category.name || "",
      description: category.description || "",
      isActive: category.isActive ?? true,
      sortOrder: category.sortOrder || 0,
      color: category.color || "blue"
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    const productsInCategory = products.filter((p: any) => p.categoryId === id).length;
    if (productsInCategory > 0) {
      toast({
        title: "Không thể xóa",
        description: `Nhóm này còn ${productsInCategory} sản phẩm. Hãy di chuyển sản phẩm trước khi xóa.`,
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Bạn có chắc muốn xóa nhóm sản phẩm này?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const getProductCount = (categoryId: string) => {
    return products.filter((p: any) => p.categoryId === categoryId).length;
  };

  return (
    <AppLayout title="Nhóm sản phẩm">
      <div className="space-y-6" data-testid="product-groups-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nhóm sản phẩm</h1>
            <p className="text-gray-600">Quản lý danh mục và phân loại sản phẩm</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingCategory(null);
                  form.reset();
                }}
                data-testid="button-add-category"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Thêm nhóm mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Chỉnh sửa nhóm sản phẩm" : "Thêm nhóm sản phẩm mới"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên nhóm *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ví dụ: Điện thoại" data-testid="input-category-name" />
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
                          <Textarea {...field} rows={3} placeholder="Mô tả về nhóm sản phẩm" data-testid="textarea-category-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Màu sắc</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-md" data-testid="select-category-color">
                              <option value="blue">Xanh dương</option>
                              <option value="green">Xanh lá</option>
                              <option value="purple">Tím</option>
                              <option value="red">Đỏ</option>
                              <option value="yellow">Vàng</option>
                              <option value="gray">Xám</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thứ tự</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={(e) => field.onChange(Number(e.target.value))} data-testid="input-category-order" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Hiển thị</FormLabel>
                          <p className="text-sm text-muted-foreground">Cho phép hiển thị nhóm này</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-category-active"
                          />
                        </FormControl>
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
                      disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
                      data-testid="button-save-category"
                    >
                      {addCategoryMutation.isPending || updateCategoryMutation.isPending 
                        ? "Đang lưu..." 
                        : (editingCategory ? "Cập nhật" : "Thêm nhóm")
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm nhóm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-categories"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Không tìm thấy nhóm sản phẩm" : "Chưa có nhóm sản phẩm"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Bắt đầu bằng cách tạo nhóm sản phẩm đầu tiên"
                }
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                Thêm nhóm mới
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category: any) => {
              const productCount = getProductCount(category.id);
              return (
                <Card key={category.id} className="hover:shadow-md transition-shadow" data-testid={`category-card-${category.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(category.color)}`}>
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Package className="w-3 h-3 mr-1" />
                              {productCount} sản phẩm
                            </Badge>
                            {category.isActive ? (
                              <Badge variant="outline" className="text-xs text-green-600">
                                <Eye className="w-3 h-3 mr-1" />
                                Hiển thị
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Ẩn
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600"
                            disabled={productCount > 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {category.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Thứ tự: {category.sortOrder || 0}</span>
                      <div className="flex items-center space-x-1">
                        <Grid3X3 className="w-3 h-3" />
                        <span>#{category.id.slice(-4)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Folder className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Tổng nhóm</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Đang hiển thị</p>
                  <p className="text-2xl font-bold">{categories.filter((c: any) => c.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Nhóm phổ biến</p>
                  <p className="text-lg font-bold">
                    {categories.length > 0 
                      ? categories.reduce((max: any, cat: any) => 
                          getProductCount(cat.id) > getProductCount(max.id) ? cat : max, 
                          categories[0]
                        )?.name?.slice(0, 10) + "..."
                      : "N/A"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}