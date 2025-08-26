import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function Sales() {
  return (
    <AppLayout title="Bán hàng">
      <div data-testid="sales-page">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Giao diện bán hàng
              </h2>
              <p className="text-gray-600">
                Chức năng bán hàng POS sẽ được triển khai ở đây
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
