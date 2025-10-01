// Backend API response types matching C# models

export interface Product {
  productId: number;
  name: string | null;
  barcode: string | null;
  categoryId: number | null;
  productGroupId: number | null;
  price: number;
  costPrice: number | null;
  stockQuantity: number;
  minStockLevel: number;
  unit: string | null;
  imageUrl: string | null;
  description: string | null;
}

export interface Customer {
  customerId: number;
  hoTen: string | null;
  soDienThoai: string | null;
  email: string | null;
  diaChi: string | null;
  hangKhachHang: string | null;
  // Mapped fields for frontend compatibility
  id?: string;
  name?: string;
  phone?: string;
  address?: string;
  customerType?: string;
}

export interface Order {
  orderId: number;
  customerId: number | null;
  orderDate: string;
  totalAmount: number;
  discountAmount: number | null;
  taxAmount: number | null;
  paymentMethod: string | null;
  status: string | null;
  notes: string | null;
}

export interface OrderItem {
  orderItemId: number;
  orderId: number;
  productId: number;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}