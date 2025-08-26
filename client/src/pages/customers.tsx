import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function Customers() {
  return (
    <AppLayout title="Khách hàng">
      <div data-testid="customers-page">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quản lý khách hàng
              </h2>
              <p className="text-gray-600">
                CRM, thông tin khách hàng, phân nhóm, lịch sử mua hàng sẽ được triển khai ở đây
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
