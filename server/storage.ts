import { 
  users, products, customers, orders, orderItems, categories, 
  inventoryMovements, promotions, stores,
  type User, type InsertUser, type Product, type InsertProduct,
  type Customer, type InsertCustomer, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Category,
  type InventoryMovement, type InsertInventoryMovement
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, lte, gte } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Dashboard
  getDashboardMetrics(storeId: string): Promise<any>;
  getRevenueChartData(storeId: string, days: number): Promise<any[]>;
  getTopProducts(storeId: string, limit: number): Promise<any[]>;
  getRecentOrders(storeId: string, limit: number): Promise<any[]>;
  getLowStockProducts(storeId: string): Promise<any[]>;
  
  // Products
  getProducts(storeId: string): Promise<Product[]>;
  createProduct(insertProduct: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Customers
  getCustomers(storeId: string): Promise<Customer[]>;
  createCustomer(insertCustomer: InsertCustomer): Promise<Customer>;
  
  // Orders
  getOrders(storeId: string): Promise<Order[]>;
  createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  
  // Categories
  getCategories(storeId: string): Promise<Category[]>;
  
  // Inventory
  getInventoryMovements(storeId: string): Promise<InventoryMovement[]>;
  adjustInventory(productId: string, quantity: number, reason: string, userId: string, storeId: string): Promise<InventoryMovement>;
  
  // Reports
  getSalesReport(storeId: string, startDate: string, endDate: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Dashboard methods
  async getDashboardMetrics(storeId: string): Promise<any> {
    // Mock data for now - in real implementation would query database
    return {
      todayRevenue: "15.750.000₫",
      todayGrowth: "+12.5%",
      ordersCount: 47,
      ordersGrowth: "+8.2%",
      newCustomers: 12,
      customersGrowth: "+15.1%",
      lowStockItems: 3
    };
  }

  async getRevenueChartData(storeId: string, days: number): Promise<any[]> {
    // Mock data for now
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 20000000) + 5000000
      });
    }
    return data;
  }

  async getTopProducts(storeId: string, limit: number): Promise<any[]> {
    // Mock data for now
    return [
      {
        id: "1",
        name: "Cà phê Espresso",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=60&h=60&fit=crop",
        soldCount: 145,
        revenue: "7.250.000₫"
      },
      {
        id: "2", 
        name: "Bánh croissant",
        image: "https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?w=60&h=60&fit=crop",
        soldCount: 89,
        revenue: "4.450.000₫"
      },
      {
        id: "3",
        name: "Trà sữa",
        image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=60&h=60&fit=crop", 
        soldCount: 67,
        revenue: "3.350.000₫"
      }
    ];
  }

  async getRecentOrders(storeId: string, limit: number): Promise<any[]> {
    // Mock data for now
    return [
      {
        id: "1",
        orderNumber: "156",
        customer: "Nguyễn Văn A",
        total: "285.000₫",
        status: "Hoàn thành",
        time: "2 phút trước"
      },
      {
        id: "2",
        orderNumber: "155", 
        customer: "Trần Thị B",
        total: "340.000₫",
        status: "Hoàn thành",
        time: "15 phút trước"
      },
      {
        id: "3",
        orderNumber: "154",
        customer: "Lê Văn C", 
        total: "125.000₫",
        status: "Đang xử lý",
        time: "25 phút trước"
      }
    ];
  }

  async getLowStockProducts(storeId: string): Promise<any[]> {
    // Mock data for now
    return [
      {
        id: "1",
        name: "Hạt cà phê Espresso",
        image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=60&h=60&fit=crop",
        stock: "2 kg còn lại",
        minStockLevel: 10,
        currentStock: 2
      },
      {
        id: "2",
        name: "Sữa tươi",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=60&h=60&fit=crop",
        stock: "5 lít còn lại", 
        minStockLevel: 20,
        currentStock: 5
      }
    ];
  }

  // Products
  async getProducts(storeId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.storeId, storeId));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Customers
  async getCustomers(storeId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.storeId, storeId));
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  // Orders
  async getOrders(storeId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.storeId, storeId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    
    if (items.length > 0) {
      const orderItemsWithOrderId = items.map(item => ({
        ...item,
        orderId: order.id
      }));
      await db.insert(orderItems).values(orderItemsWithOrderId);
    }
    
    return order;
  }

  // Categories  
  async getCategories(storeId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.storeId, storeId));
  }

  // Inventory
  async getInventoryMovements(storeId: string): Promise<InventoryMovement[]> {
    return await db.select().from(inventoryMovements).where(eq(inventoryMovements.storeId, storeId)).orderBy(desc(inventoryMovements.createdAt));
  }

  async adjustInventory(productId: string, quantity: number, reason: string, userId: string, storeId: string): Promise<InventoryMovement> {
    // Get current product stock
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      throw new Error("Product not found");
    }

    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;

    // Update product stock
    await db
      .update(products)
      .set({ stockQuantity: newStock })
      .where(eq(products.id, productId));

    // Create inventory movement record
    const [movement] = await db
      .insert(inventoryMovements)
      .values({
        productId,
        type: quantity > 0 ? 'purchase' : 'adjustment',
        quantity: Math.abs(quantity),
        previousStock,
        newStock,
        reason,
        userId,
        storeId
      })
      .returning();

    return movement;
  }

  // Reports
  async getSalesReport(storeId: string, startDate: string, endDate: string): Promise<any> {
    // Mock data for now
    return {
      totalRevenue: "125.750.000₫",
      totalOrders: 356,
      averageOrderValue: "353.232₫",
      topProducts: [
        { name: "Cà phê Espresso", revenue: "45.250.000₫", quantity: 892 },
        { name: "Bánh croissant", revenue: "28.450.000₫", quantity: 567 }
      ]
    };
  }
}

export const storage = new DatabaseStorage();