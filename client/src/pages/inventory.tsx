import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function Inventory() {
  return (
    <AppLayout title="Kho hàng">
      <div data-testid="inventory-page">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quản lý kho hàng
              </h2>
              <p className="text-gray-600">
                Quản lý tồn kho, nhập xuất hàng, cảnh báo hết hàng sẽ được triển khai ở đây
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
