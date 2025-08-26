import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function Staff() {
  return (
    <AppLayout title="Nhân viên">
      <div data-testid="staff-page">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quản lý nhân viên
              </h2>
              <p className="text-gray-600">
                Tài khoản, phân quyền, nhật ký hoạt động sẽ được triển khai ở đây
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
