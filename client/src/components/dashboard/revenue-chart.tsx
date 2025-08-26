import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import type { RevenueChartData } from "@/lib/types";

interface RevenueChartProps {
  data: RevenueChartData[] | null;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [period, setPeriod] = useState("7");

  return (
    <Card className="lg:col-span-2 shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900" data-testid="revenue-chart-title">
            Doanh thu 7 ngày qua
          </h3>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày qua</SelectItem>
              <SelectItem value="30">30 ngày qua</SelectItem>
              <SelectItem value="90">3 tháng qua</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300" data-testid="revenue-chart-placeholder">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">Biểu đồ doanh thu real-time</p>
            <p className="text-sm text-gray-400">Chart.js integration required</p>
            {data && (
              <p className="text-xs text-gray-400 mt-2">
                {data.length} data points available
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
