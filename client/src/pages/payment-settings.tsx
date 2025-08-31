import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode, Wallet, Banknote, BanknoteIcon, Split, Archive } from "lucide-react";

export type PaymentMethodConfig = {
  enableCash: boolean;
  enableBankCard: boolean;
  enableQRCode: boolean;
  enableEWallet: boolean;
  enableBankTransfer: boolean;
  enablePartialPayment: boolean;
  enableDrawer: boolean;
  defaultMethod: string;
};

const paymentOptions = [
  { value: "cash", label: "Tiền mặt", icon: <BanknoteIcon className="w-4 h-4 inline" /> },
  { value: "bankcard", label: "Thẻ ngân hàng", icon: <CreditCard className="w-4 h-4 inline" /> },
  { value: "qrcode", label: "QR Code", icon: <QrCode className="w-4 h-4 inline" /> },
  { value: "ewallet", label: "Ví điện tử", icon: <Wallet className="w-4 h-4 inline" /> },
  { value: "banktransfer", label: "Chuyển khoản", icon: <Banknote className="w-4 h-4 inline" /> },
  { value: "partial", label: "Thanh toán một phần", icon: <Split className="w-4 h-4 inline" /> },
];

export function PaymentSettings() {
  const queryClient = useQueryClient();
  const { data: config } = useQuery<PaymentMethodConfig | null>({
    queryKey: ["/api/PaymentMethodConfig"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/PaymentMethodConfig");
      if (res.status === 404) return null;
      return res.json();
    },
  });
  const [form, setForm] = useState<PaymentMethodConfig>({
    enableCash: true,
    enableBankCard: true,
    enableQRCode: true,
    enableEWallet: true,
    enableBankTransfer: true,
    enablePartialPayment: false,
    enableDrawer: true,
    defaultMethod: "cash",
  });
  useEffect(() => {
    if (config) setForm(config);
  }, [config]);
  const mutation = useMutation({
    mutationFn: async (data: PaymentMethodConfig) => {
      const res = await apiRequest("POST", "/api/PaymentMethodConfig", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/PaymentMethodConfig"]);
      alert("Đã lưu cấu hình thanh toán!");
    },
  });
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Phương thức thanh toán</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2"><BanknoteIcon /> Tiền mặt</div>
                <div className="text-gray-500 text-sm">Thanh toán bằng tiền mặt</div>
              </div>
              <input type="checkbox" name="enableCash" checked={form.enableCash} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2"><CreditCard /> Thẻ ngân hàng</div>
                <div className="text-gray-500 text-sm">Thẻ tín dụng, thẻ ghi nợ</div>
              </div>
              <input type="checkbox" name="enableBankCard" checked={form.enableBankCard} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2"><QrCode /> QR Code</div>
                <div className="text-gray-500 text-sm">VietQR, VNPAY QR</div>
              </div>
              <input type="checkbox" name="enableQRCode" checked={form.enableQRCode} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2"><Wallet /> Ví điện tử</div>
                <div className="text-gray-500 text-sm">MoMo, ZaloPay, ShopeePay</div>
              </div>
              <input type="checkbox" name="enableEWallet" checked={form.enableEWallet} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2"><Banknote /> Chuyển khoản</div>
                <div className="text-gray-500 text-sm">Chuyển khoản ngân hàng</div>
              </div>
              <input type="checkbox" name="enableBankTransfer" checked={form.enableBankTransfer} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2"><Split /> Thanh toán một phần</div>
                <div className="text-gray-500 text-sm">Cho phép thanh toán không đủ số tiền</div>
              </div>
              <input type="checkbox" name="enablePartialPayment" checked={form.enablePartialPayment} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between md:col-span-2">
              <div>
                <div className="font-semibold flex items-center gap-2"><Archive /> Ngăn kéo tiền</div>
                <div className="text-gray-500 text-sm">Tự động mở ngăn kéo khi thanh toán</div>
              </div>
              <input type="checkbox" name="enableDrawer" checked={form.enableDrawer} onChange={handleChange} className="w-10 h-5 accent-blue-600" />
            </div>
          </div>
          <div className="mt-8">
            <label className="block font-medium mb-2">Phương thức mặc định</label>
            <select name="defaultMethod" value={form.defaultMethod} onChange={handleChange} className="border rounded px-2 py-1 w-full">
              {paymentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-2">
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
