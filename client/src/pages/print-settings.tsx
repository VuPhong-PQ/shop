import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export type PrintConfig = {
  printerName: string;
  paperSize: string;
  printCopies: number;
  autoPrintBill: boolean;
  autoPrintOnOrder: boolean;
  printBarcode: boolean;
  printLogo: boolean;
  billHeader: string;
  billFooter: string;
};

const paperSizes = [
  { value: "80mm", label: "80mm" },
  { value: "A4", label: "A4" },
  { value: "58mm", label: "58mm" },
];

export function PrintSettings() {
  const queryClient = useQueryClient();
  const { data: config } = useQuery<PrintConfig | null>({
    queryKey: ["/api/PrintConfig"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/PrintConfig");
      if (res.status === 404) return null;
      return res.json();
    },
  });
  const [form, setForm] = useState<PrintConfig>({
    printerName: "",
    paperSize: "80mm",
    printCopies: 1,
    autoPrintBill: true,
    autoPrintOnOrder: false,
    printBarcode: true,
    printLogo: true,
    billHeader: "",
    billFooter: "",
  });
  useEffect(() => {
    if (config) setForm(config);
  }, [config]);
  const mutation = useMutation({
    mutationFn: async (data: PrintConfig) => {
      const res = await apiRequest("POST", "/api/PrintConfig", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/PrintConfig"]);
      alert("Đã lưu cấu hình in ấn!");
    },
  });
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }
  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="space-y-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Printer className="w-5 h-5" /> Cấu hình in ấn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium">Tên máy in</label>
              <input name="printerName" value={form.printerName || ""} onChange={handleChange} className="border rounded px-2 py-1 w-full" placeholder="Chọn máy in..." />
            </div>
            <div>
              <label className="block font-medium">Khổ giấy</label>
              <select name="paperSize" value={form.paperSize} onChange={handleChange} className="border rounded px-2 py-1 w-full">
                {paperSizes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium">Số bản in</label>
              <input name="printCopies" type="number" min={1} value={form.printCopies} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">In hóa đơn</div>
                <div className="text-gray-500 text-sm">Tự động in hóa đơn sau thanh toán</div>
              </div>
              <input type="checkbox" name="autoPrintBill" checked={form.autoPrintBill} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">Tự động in</div>
                <div className="text-gray-500 text-sm">In ngay khi hoàn thành đơn hàng</div>
              </div>
              <input type="checkbox" name="autoPrintOnOrder" checked={form.autoPrintOnOrder} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">In mã vạch</div>
                <div className="text-gray-500 text-sm">In mã vạch sản phẩm trên hóa đơn</div>
              </div>
              <input type="checkbox" name="printBarcode" checked={form.printBarcode} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">In logo</div>
                <div className="text-gray-500 text-sm">Hiển thị logo cửa hàng trên hóa đơn</div>
              </div>
              <input type="checkbox" name="printLogo" checked={form.printLogo} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
          </div>
          <div>
            <label className="block font-medium">Tiêu đề hóa đơn</label>
            <textarea name="billHeader" value={form.billHeader || ""} onChange={handleChange} className="border rounded px-2 py-1 w-full" rows={2} />
          </div>
          <div>
            <label className="block font-medium">Chân trang hóa đơn</label>
            <textarea name="billFooter" value={form.billFooter || ""} onChange={handleChange} className="border rounded px-2 py-1 w-full" rows={2} />
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v6M8 8v6m-4 4h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              In thử nghiệm
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Lưu cấu hình
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
