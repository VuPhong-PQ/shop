import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function Reports() {
  return (
    <AppLayout title="Báo cáo">
      <div data-testid="reports-page">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Báo cáo & Phân tích
              </h2>
              <p className="text-gray-600">
                Báo cáo doanh thu, sản phẩm bán chạy, lợi nhuận, biểu đồ phân tích sẽ được triển khai ở đây
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
