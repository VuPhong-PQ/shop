import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Sales from "@/pages/sales";
import Products from "@/pages/products";
import ProductGroups from "@/pages/product-groups";
import Customers from "@/pages/customers";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import Staff from "@/pages/staff";
import Settings from "@/pages/settings";
import OrdersPage from "@/pages/orders";
import PrintOrder from "@/pages/print-order";
import EInvoiceSettings from "@/pages/einvoice-settings";
import VNPTTest from "@/pages/vnpt-test";

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/">
        <ProtectedRoute requiredPermission="ViewOrders">
          <Sales />
        </ProtectedRoute>
      </Route>
      <Route path="/sales">
        <ProtectedRoute requiredPermission="ViewOrders">
          <Sales />
        </ProtectedRoute>
      </Route>
      <Route path="/products">
        <ProtectedRoute requiredPermission="ViewProducts">
          <Products />
        </ProtectedRoute>
      </Route>
      <Route path="/product-groups">
        <ProtectedRoute requiredPermission="ViewProducts">
          <ProductGroups />
        </ProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute requiredPermission="ViewCustomers">
          <Customers />
        </ProtectedRoute>
      </Route>
      <Route path="/inventory">
        <ProtectedRoute requiredPermission="ViewProducts">
          <Inventory />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute requiredPermission="ViewReports">
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/staff">
        <ProtectedRoute requiredPermission="ViewStaff">
          <Staff />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute requiredPermission="ViewSettings">
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute requiredPermission="ViewOrders">
          <OrdersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/print-order/:orderId">
        <ProtectedRoute requiredPermission="ViewOrders">
          <PrintOrder />
        </ProtectedRoute>
      </Route>
      <Route path="/einvoice-settings">
        <ProtectedRoute requiredPermission="ViewSettings">
          <EInvoiceSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/vnpt-test">
        <ProtectedRoute requiredPermission="ViewSettings">
          <VNPTTest />
        </ProtectedRoute>
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
