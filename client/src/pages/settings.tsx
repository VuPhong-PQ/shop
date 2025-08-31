import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type StoreInfo = {
  name: string;
  address?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
};

export default function SettingsPage() {
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
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cài đặt thông tin cửa hàng</h1>
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
  );
}