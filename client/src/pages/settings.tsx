import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function Settings() {
  return (
    <AppLayout title="Cài đặt">
      <div data-testid="settings-page">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Cài đặt hệ thống
              </h2>
              <p className="text-gray-600">
                Cấu hình cửa hàng, thuế, thanh toán, in ấn sẽ được triển khai ở đây
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
