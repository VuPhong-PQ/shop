import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, Smartphone, AlertTriangle } from "lucide-react";
import type { Product, Customer } from "@shared/schema";

interface CartItem extends Product {
  quantity: number;
  totalPrice: number;
  cartItemId: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: 'Tiền mặt', icon: Banknote, color: 'bg-green-500' },
  { id: 'card', name: 'Thẻ', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'qr', name: 'QR Code', icon: QrCode, color: 'bg-purple-500' },
  { id: 'ewallet', name: 'Ví điện tử', icon: Smartphone, color: 'bg-orange-500' },
];

export default function Sales() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("cash");
  const [showPayment, setShowPayment] = useState(false);

  // Fetch products and customers
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    select: (rawCustomers: any[]) => rawCustomers.map((c) => ({
      id: c.customerId?.toString(),
      name: c.hoTen || '',
      phone: c.soDienThoai || '',
      email: c.email || '',
      address: c.diaChi || '',
      customerType: c.hangKhachHang || '',
    })),
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('Gửi đơn hàng lên backend:', formData);
      return await apiRequest('/api/orders', { method: 'POST', body: formData });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đơn hàng đã được tạo thành công",
      });
      setCart([]);
      setSelectedCustomer(null);
      setShowPayment(false);
      // Refetch danh sách đơn hàng để hiển thị đơn mới nhất
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      navigate('/orders');
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  });

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lấy thông tin thuế VAT từ API
  const { data: taxConfig } = useQuery<any>({
    queryKey: ["/api/TaxConfig"],
    queryFn: async () => {
      const res = await apiRequest("/api/TaxConfig", { method: "GET" });
      return typeof res === "string" ? JSON.parse(res) : res;
    },
  });

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  // VATRate backend trả về số phần trăm (8, 10, ...) nên cần chia cho 100 khi tính toán
  const taxRate = taxConfig?.VATRate ? Number(taxConfig.VATRate) : 10;
  const taxLabel = taxConfig?.VATLabel || "VAT";
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Add product to cart
  const addToCart = (product: Product) => {
    console.log('Adding product to cart:', product);
    // Luôn thêm một dòng mới, không gộp số lượng
    const newItem: CartItem = {
      ...product,
      cartItemId: `${Date.now()}-${Math.random()}`,
      quantity: 1,
      totalPrice: parseFloat(product.price)
    };
    setCart([...cart, newItem]);
    console.log('Cart after adding:', [...cart, newItem]);
  };

  // Update quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item.cartItemId === productId 
        ? { 
            ...item, 
            quantity: newQuantity, 
            totalPrice: parseFloat(item.price) * newQuantity 
          }
        : item
    ));
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.cartItemId !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Process payment
  const processPayment = () => {
    if (cart.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      return;
    }
    // Tạo form-data đúng chuẩn cho backend
    const formData = new FormData();
    formData.append('orderNumber', `ORD${Date.now()}`);
    formData.append('customerId', selectedCustomer?.id || '');
    formData.append('cashierId', "550e8400-e29b-41d4-a716-446655440001");
    formData.append('storeId', "550e8400-e29b-41d4-a716-446655440002");
    formData.append('subtotal', subtotal.toString());
    formData.append('taxAmount', taxAmount.toString());
    formData.append('discountAmount', "0");
    formData.append('total', total.toString());
    formData.append('paymentMethod', selectedPayment);
    formData.append('paymentStatus', "completed");
    formData.append('status', "completed");
    // Gửi từng item dưới dạng items[0].productId, items[0].productName, ...
    cart.forEach((item, idx) => {
      // Luôn lấy đúng productId, không để undefined
      const productId = item.productId || item.id || "";
      formData.append(`items[${idx}].productId`, productId);
      formData.append(`items[${idx}].productName`, item.name || "");
      formData.append(`items[${idx}].quantity`, item.quantity?.toString() || "1");
      formData.append(`items[${idx}].unitPrice`, item.price?.toString() || "0");
      formData.append(`items[${idx}].totalPrice`, item.totalPrice?.toString() || "0");
    });
    console.log('FormData gửi lên:', Array.from(formData.entries()));
    createOrderMutation.mutate(formData);
  };

  return (
    <AppLayout title="Bán hàng">
      <div className="flex flex-col lg:flex-row h-full gap-6" data-testid="sales-page">
        {/* Products Section */}
        <div className="flex-1 order-1 lg:order-1">
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Sản phẩm</h2>
                <div className="relative w-full sm:w-80">
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-product-search"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[40vh] lg:max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredProducts.map((product) => {
                  // Tính trạng thái tồn kho giống trang sản phẩm
                  let stockStatus = { label: '', color: '' };
                  if (product.stockQuantity === 0) {
                    stockStatus = { label: 'Hết hàng', color: 'bg-red-500' };
                  } else if (product.stockQuantity <= product.minStockLevel) {
                    stockStatus = { label: 'Sắp hết', color: 'bg-orange-500' };
                  } else {
                    stockStatus = { label: 'Còn hàng', color: 'bg-green-500' };
                  }
                  const key = product.productId || product.id;
                  return (
                    <div
                      key={key}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        console.log('Product clicked:', product);
                        addToCart(product);
                      }}
                      data-testid={`product-card-${key}`}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="relative">
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden rounded-lg mb-3">
                              <img
                                src={
                                  product.imageUrl && product.imageUrl !== ""
                                    ? (product.imageUrl.startsWith("http") ? product.imageUrl : `http://localhost:5271${product.imageUrl}`)
                                    : (product.image && product.image !== ""
                                      ? (product.image.startsWith("http") ? product.image : `http://localhost:5271${product.image}`)
                                      : "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=150&fit=crop")
                                }
                                alt={product.name}
                                className="max-w-full max-h-full object-contain"
                                style={{ width: '100%', height: '100%' }}
                              />
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
                          </div>
                          <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-primary">{parseInt(product.price).toLocaleString('vi-VN')}₫</p>
                          <p className="text-xs text-gray-500">Tồn: {product.stockQuantity} {product.unit}</p>
                          <p className="text-xs text-gray-500">Tối thiểu: {product.minStockLevel}</p>
                          <Button
                            className="w-full mt-2"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Button clicked for product:', product);
                              addToCart(product);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Thêm vào hóa đơn
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 order-2 lg:order-2">
          <Card className="h-auto lg:h-full">
            <CardContent className="p-6 flex flex-col h-auto lg:h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Giỏ hàng ({cart.length})
                </h2>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    data-testid="button-clear-cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Customer Selection */}
              <div className="mb-4">
                <Select 
                  value={selectedCustomer?.id || ""} 
                  onValueChange={(value) => {
                    const customer = customers.find(c => c.id === value);
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <SelectTrigger data-testid="select-customer">
                    <SelectValue placeholder="Chọn khách hàng (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Khách vãng lai</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[30vh] lg:max-h-full">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Giỏ hàng trống</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-testid={`cart-item-${item.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-primary font-semibold text-sm lg:text-base">{parseInt(item.price).toLocaleString('vi-VN')}₫</p>
                      </div>
                      <div className="flex items-center space-x-1 lg:space-x-2 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          data-testid={`button-decrease-${item.id}`}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 lg:w-8 text-center text-sm font-medium" data-testid={`quantity-${item.id}`}>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          data-testid={`button-increase-${item.id}`}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.cartItemId)}
                          data-testid={`button-remove-${item.id}`}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Summary */}
              {cart.length > 0 && (
                <div className="space-y-2 mb-4">
                  <Separator />
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span data-testid="subtotal">{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{taxLabel} ({taxConfig?.VATRate || 10}%):</span>
                    <span data-testid="tax">{taxAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span data-testid="total">{total.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              {cart.length > 0 && (
                <div className="space-y-3">
                  <p className="font-medium">Phương thức thanh toán:</p>
                  <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <Button
                          key={method.id}
                          variant={selectedPayment === method.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedPayment(method.id)}
                          className="h-12 text-xs lg:text-sm"
                          data-testid={`payment-${method.id}`}
                        >
                          <Icon className="w-4 h-4 mr-1 lg:mr-2" />
                          <span className="hidden sm:inline lg:inline">{method.name}</span>
                          <span className="sm:hidden lg:hidden">{method.name.split(' ')[0]}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 mt-4">
                <Button
                  className="w-full h-12 text-lg"
                  onClick={processPayment}
                  disabled={cart.length === 0 || createOrderMutation.isPending}
                  data-testid="button-process-payment"
                >
                  {createOrderMutation.isPending ? "Đang xử lý..." : "Thanh toán"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
