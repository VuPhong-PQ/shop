import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Sales from "@/pages/sales";
import Products from "@/pages/products";
import ProductGroups from "@/pages/product-groups";
import Customers from "@/pages/customers";
import OrderManagement from "@/pages/order-management";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import Staff from "@/pages/staff";
import Settings from "@/pages/settings";
import OrdersPage from "@/pages/orders";
import PrintOrder from "@/pages/print-order";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sales" component={Sales} />
      <Route path="/products" component={Products} />
      <Route path="/product-groups" component={ProductGroups} />
      <Route path="/customers" component={Customers} />
      <Route path="/order-management" component={OrderManagement} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/reports" component={Reports} />
      <Route path="/staff" component={Staff} />
      <Route path="/settings" component={Settings} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/print-order/:orderId" component={PrintOrder} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
