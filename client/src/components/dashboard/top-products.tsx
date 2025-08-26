import { Card, CardContent } from "@/components/ui/card";
import type { TopProduct } from "@/lib/types";

interface TopProductsProps {
  products: TopProduct[] | null;
}

export function TopProducts({ products }: TopProductsProps) {
  if (!products) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sản phẩm bán chạy</h3>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6" data-testid="top-products-title">
          Sản phẩm bán chạy
        </h3>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between" data-testid={`top-product-${index}`}>
              <div className="flex items-center space-x-3">
                <img 
                  src={product.image || "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=60&h=60"} 
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover"
                  data-testid={`product-image-${index}`}
                />
                <div>
                  <p className="font-medium text-gray-900" data-testid={`product-name-${index}`}>
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-500" data-testid={`product-sold-${index}`}>
                    Đã bán: {product.soldCount}
                  </p>
                </div>
              </div>
              <p className="font-semibold text-gray-900" data-testid={`product-revenue-${index}`}>
                {product.revenue}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
