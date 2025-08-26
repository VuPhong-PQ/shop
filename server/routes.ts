import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertOrderSchema, insertCustomerSchema, insertProductSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Dashboard Analytics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const metrics = await storage.getDashboardMetrics(storeId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/revenue-chart", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const days = parseInt(req.query.days as string) || 7;
      const data = await storage.getRevenueChartData(storeId, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue chart data" });
    }
  });

  app.get("/api/dashboard/top-products", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const limit = parseInt(req.query.limit as string) || 5;
      const products = await storage.getTopProducts(storeId, limit);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  app.get("/api/dashboard/recent-orders", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await storage.getRecentOrders(storeId, limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  });

  app.get("/api/dashboard/low-stock", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const products = await storage.getLowStockProducts(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const products = await storage.getProducts(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      broadcast({ type: 'product_created', data: product });
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      broadcast({ type: 'product_updated', data: product });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      broadcast({ type: 'product_deleted', data: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const customers = await storage.getCustomers(storeId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      broadcast({ type: 'customer_created', data: customer });
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid customer data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create customer" });
      }
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const orders = await storage.getOrders(storeId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData, req.body.items);
      broadcast({ type: 'order_created', data: order });
      broadcast({ type: 'metrics_updated' }); // Trigger dashboard refresh
      res.json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order", details: error.message });
      }
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const categories = await storage.getCategories(storeId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Inventory
  app.get("/api/inventory/movements", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const movements = await storage.getInventoryMovements(storeId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory movements" });
    }
  });

  app.post("/api/inventory/adjust", async (req, res) => {
    try {
      const { productId, quantity, reason, userId, storeId } = req.body;
      const movement = await storage.adjustInventory(productId, quantity, reason, userId, storeId);
      broadcast({ type: 'inventory_updated', data: movement });
      res.json(movement);
    } catch (error) {
      res.status(500).json({ error: "Failed to adjust inventory" });
    }
  });

  // Reports
  app.get("/api/reports/sales", async (req, res) => {
    try {
      const storeId = req.headers['x-store-id'] as string || '';
      const { startDate, endDate } = req.query;
      const report = await storage.getSalesReport(storeId, startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate sales report" });
    }
  });

  return httpServer;
}
