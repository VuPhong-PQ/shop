import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";
import { Store, Printer, CreditCard, Calculator } from "lucide-react";

type StoreInfo = {
  name: string;
  address?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
};

export default function SettingsPage() {
  const [tab, setTab] = useState("store");
  // --- Store Info logic ---
  const queryClient = useQueryClient();
  const { data: storeInfo } = useQuery<StoreInfo | null>({
    queryKey: ["/api/StoreInfo"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/StoreInfo");
      if (res.status === 404) return null;
      return res.json();
    },
  });
  const [form, setForm] = useState<StoreInfo>({
    name: "",
    address: "",
    taxCode: "",
    phone: "",
    email: "",
  });
  useEffect(() => {
    if (storeInfo) setForm(storeInfo);
  }, [storeInfo]);
  const mutation = useMutation({
    mutationFn: async (data: StoreInfo) => {
      const res = await apiRequest("POST", "/api/StoreInfo", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/StoreInfo"]);
      alert("Đã lưu thông tin cửa hàng!");
    },
  });
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  return (
    <AppLayout title="Cài đặt hệ thống">
      <div>
        <h1 className="text-2xl font-bold mb-1">Cài đặt hệ thống</h1>
        <p className="text-gray-500 mb-6">Quản lý cấu hình và tuỳ chỉnh hệ thống POS</p>
        <div className="flex mb-8 bg-gray-100 rounded-full overflow-hidden">
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition ${tab === "store" ? "bg-white shadow text-primary" : "text-gray-700"}`}
            onClick={() => setTab("store")}
          >
            <Store className="w-5 h-5" /> Cửa hàng
          </button>
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition ${tab === "tax" ? "bg-white shadow text-primary" : "text-gray-700"}`}
            onClick={() => setTab("tax")}
          >
            <Calculator className="w-5 h-5" /> Thuế
          </button>
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition ${tab === "payment" ? "bg-white shadow text-primary" : "text-gray-700"}`}
            onClick={() => setTab("payment")}
          >
            <CreditCard className="w-5 h-5" /> Thanh toán
          </button>
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition ${tab === "print" ? "bg-white shadow text-primary" : "text-gray-700"}`}
            onClick={() => setTab("print")}
          >
            <Printer className="w-5 h-5" /> In ấn
          </button>
        </div>

        {tab === "store" && (
          <div className="max-w-xl mx-auto">
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block font-medium">Tên cửa hàng *</label>
                    <input name="name" value={form.name} onChange={handleChange} required className="border rounded px-2 py-1 w-full" />
                  </div>
                  <div>
                    <label className="block font-medium">Địa chỉ</label>
                    <input name="address" value={form.address} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                  </div>
                  <div>
                    <label className="block font-medium">Mã số thuế</label>
                    <input name="taxCode" value={form.taxCode} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                  </div>
                  <div>
                    <label className="block font-medium">Số điện thoại</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                  </div>
                  <div>
                    <label className="block font-medium">Email</label>
                    <input name="email" value={form.email} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                  </div>
                  <div className="pt-2">
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Đang lưu..." : "Lưu thông tin"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
        {tab === "tax" && (
          <div className="max-w-xl mx-auto text-center text-gray-400 py-12">Chức năng đang phát triển...</div>
        )}
        {tab === "payment" && (
          <div className="max-w-xl mx-auto text-center text-gray-400 py-12">Chức năng đang phát triển...</div>
        )}
        {tab === "print" && (
          <div className="max-w-xl mx-auto text-center text-gray-400 py-12">Chức năng đang phát triển...</div>
        )}
      </div>
    </AppLayout>
  );
}