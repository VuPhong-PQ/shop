import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { vietqrBanks } from "@/lib/vietqrBanks";
import { queryClient } from "@/lib/queryClient";
import {
  Store,
  Receipt,
  CreditCard,
  Printer,
  Settings2,
  Save,
  TestTube,
  Wifi,
  QrCode,
  Banknote,
  Calculator,
  FileText,
  Globe,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building
} from "lucide-react";

// Form schemas
const storeFormSchema = z.object({
  name: z.string().min(1, "Tên cửa hàng là bắt buộc"),
  address: z.string().min(1, "Địa chỉ là bắt buộc"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  email: z.string().email("Email không hợp lệ").optional(),
  taxCode: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().default("VND"),
  timezone: z.string().default("Asia/Ho_Chi_Minh"),
  language: z.string().default("vi")
});

const taxFormSchema = z.object({
  vatRate: z.number().min(0).max(100),
  vatEnabled: z.boolean().default(true),
  includeTaxInPrice: z.boolean().default(true),
  taxLabel: z.string().default("VAT"),
  environmentTaxRate: z.number().min(0).max(100).default(0),
  environmentTaxEnabled: z.boolean().default(false)
});

const paymentFormSchema = z.object({
  cashEnabled: z.boolean().default(true),
  cardEnabled: z.boolean().default(true),
  qrEnabled: z.boolean().default(true),
  bankTransferEnabled: z.boolean().default(true),
  ewalletEnabled: z.boolean().default(true),
  allowPartialPayment: z.boolean().default(false),
  defaultPaymentMethod: z.string().default("cash"),
  cashDrawerEnabled: z.boolean().default(true),
  receiptRequired: z.boolean().default(true),
  // Bank account information
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional()
});

const printFormSchema = z.object({
  printerName: z.string().optional(),
  paperSize: z.string().default("80mm"),
  printReceipt: z.boolean().default(true),
  printKitchen: z.boolean().default(false),
  printBarcode: z.boolean().default(true),
  autoPrint: z.boolean().default(false),
  copies: z.number().min(1).max(5).default(1),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  logoEnabled: z.boolean().default(true)
});

type StoreFormData = z.infer<typeof storeFormSchema>;
type TaxFormData = z.infer<typeof taxFormSchema>;
type PaymentFormData = z.infer<typeof paymentFormSchema>;
type PrintFormData = z.infer<typeof printFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("store");

  // Fetch current settings
  const { data: storeSettings = {} as any, isLoading: storeLoading } = useQuery({
    queryKey: ['/api/settings/store'],
  });

  const { data: taxSettings = {} as any, isLoading: taxLoading } = useQuery({
    queryKey: ['/api/settings/tax'],
  });

  const { data: paymentSettings = {} as any, isLoading: paymentLoading } = useQuery({
    queryKey: ['/api/settings/payment'],
  });

  const { data: printSettings = {} as any, isLoading: printLoading } = useQuery({
    queryKey: ['/api/settings/print'],
  });

  // Forms
  const storeForm = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: storeSettings.name || "Cửa hàng ABC",
      address: storeSettings.address || "",
      phone: storeSettings.phone || "",
      email: storeSettings.email || "",
      taxCode: storeSettings.taxCode || "",
      website: storeSettings.website || "",
      description: storeSettings.description || "",
      currency: storeSettings.currency || "VND",
      timezone: storeSettings.timezone || "Asia/Ho_Chi_Minh",
      language: storeSettings.language || "vi"
    },
  });

  const taxForm = useForm<TaxFormData>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      vatRate: taxSettings.vatRate || 10,
      vatEnabled: taxSettings.vatEnabled ?? true,
      includeTaxInPrice: taxSettings.includeTaxInPrice ?? true,
      taxLabel: taxSettings.taxLabel || "VAT",
      environmentTaxRate: taxSettings.environmentTaxRate || 0,
      environmentTaxEnabled: taxSettings.environmentTaxEnabled ?? false
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cashEnabled: paymentSettings.cashEnabled ?? true,
      cardEnabled: paymentSettings.cardEnabled ?? true,
      qrEnabled: paymentSettings.qrEnabled ?? true,
      bankTransferEnabled: paymentSettings.bankTransferEnabled ?? true,
      ewalletEnabled: paymentSettings.ewalletEnabled ?? true,
      allowPartialPayment: paymentSettings.allowPartialPayment ?? false,
      defaultPaymentMethod: paymentSettings.defaultPaymentMethod || "cash",
      cashDrawerEnabled: paymentSettings.cashDrawerEnabled ?? true,
      receiptRequired: paymentSettings.receiptRequired ?? true,
      bankAccountName: paymentSettings.bankAccountName || "",
      bankAccountNumber: paymentSettings.bankAccountNumber || "",
      bankName: paymentSettings.bankName || "",
      bankBranch: paymentSettings.bankBranch || ""
    },
  });

  const printForm = useForm<PrintFormData>({
    resolver: zodResolver(printFormSchema),
    defaultValues: {
      printerName: printSettings.printerName || "",
      paperSize: printSettings.paperSize || "80mm",
      printReceipt: printSettings.printReceipt ?? true,
      printKitchen: printSettings.printKitchen ?? false,
      printBarcode: printSettings.printBarcode ?? true,
      autoPrint: printSettings.autoPrint ?? false,
      copies: printSettings.copies || 1,
      headerText: printSettings.headerText || "",
      footerText: printSettings.footerText || "",
      logoEnabled: printSettings.logoEnabled ?? true
    },
  });

  // Mutations
  const updateStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      const response = await apiRequest('PUT', '/api/settings/store', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cấu hình cửa hàng đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/store'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cấu hình cửa hàng",
        variant: "destructive",
      });
    }
  });

  const updateTaxMutation = useMutation({
    mutationFn: async (data: TaxFormData) => {
      const response = await apiRequest('PUT', '/api/settings/tax', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cấu hình thuế đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/tax'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cấu hình thuế",
        variant: "destructive",
      });
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest('PUT', '/api/settings/payment', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cấu hình thanh toán đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/payment'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cấu hình thanh toán",
        variant: "destructive",
      });
    }
  });

  const updatePrintMutation = useMutation({
    mutationFn: async (data: PrintFormData) => {
      const response = await apiRequest('PUT', '/api/settings/print', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cấu hình in ấn đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/print'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cấu hình in ấn",
        variant: "destructive",
      });
    }
  });

  const testPrintMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/settings/print/test');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "In thử nghiệm thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể in thử nghiệm",
        variant: "destructive",
      });
    }
  });

  const testQRMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/payment/test-qr', {
        AccountNumber: paymentForm.getValues('bankAccountNumber'),
        AccountHolder: paymentForm.getValues('bankAccountName'),
        BankName: paymentForm.getValues('bankName')
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: "QR Code thử nghiệm đã được tạo thành công!",
      });
      if (data.qrBase64 && data.qrBase64.startsWith('data:')) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>QR Code Thanh toán</title></head>
              <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
                <div style="text-align:center;background:white;padding:20px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                  <h3 style="margin:0 0 15px 0;color:#333;">QR Code Thanh toán</h3>
                  <img src="${data.qrBase64}" style="max-width:300px;height:auto;" />
                </div>
              </body>
            </html>
          `);
        }
      }
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo mã QR thử nghiệm. Vui lòng kiểm tra thông tin tài khoản ngân hàng.",
        variant: "destructive",
      });
    }
  });

  return (
    <AppLayout title="Cài đặt hệ thống">
      <div className="space-y-6" data-testid="settings-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
            <p className="text-gray-600">Quản lý cấu hình và tùy chỉnh hệ thống POS</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Cửa hàng
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Thuế
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Thanh toán
            </TabsTrigger>
            <TabsTrigger value="print" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              In ấn
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Thông tin cửa hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...storeForm}>
                  <form onSubmit={storeForm.handleSubmit((data) => updateStoreMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={storeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên cửa hàng *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-store-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-store-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-store-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="taxCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mã số thuế</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-store-tax-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-store-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Đơn vị tiền tệ</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-store-currency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="VND">VND - Việt Nam Đồng</SelectItem>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Múi giờ</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-store-timezone">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Asia/Ho_Chi_Minh">GMT+7 - Việt Nam</SelectItem>
                                <SelectItem value="Asia/Bangkok">GMT+7 - Bangkok</SelectItem>
                                <SelectItem value="Asia/Singapore">GMT+8 - Singapore</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ngôn ngữ</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-store-language">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="vi">Tiếng Việt</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={storeForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa chỉ *</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} data-testid="textarea-store-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={storeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-store-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateStoreMutation.isPending}
                        data-testid="button-save-store"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateStoreMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Settings */}
          <TabsContent value="tax" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Cấu hình thuế
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...taxForm}>
                  <form onSubmit={taxForm.handleSubmit((data) => updateTaxMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={taxForm.control}
                        name="vatEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Bật thuế VAT</FormLabel>
                              <FormDescription>
                                Áp dụng thuế giá trị gia tăng cho đơn hàng
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-vat-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="includeTaxInPrice"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Thuế bao gồm trong giá</FormLabel>
                              <FormDescription>
                                Giá sản phẩm đã bao gồm thuế
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-tax-included"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="vatRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thuế suất VAT (%)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                max="100" 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-vat-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="taxLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nhãn thuế</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-tax-label" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="environmentTaxEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Thuế bảo vệ môi trường</FormLabel>
                              <FormDescription>
                                Áp dụng cho một số mặt hàng
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-env-tax-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taxForm.control}
                        name="environmentTaxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thuế suất bảo vệ môi trường (%)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                max="100" 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-env-tax-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateTaxMutation.isPending}
                        data-testid="button-save-tax"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateTaxMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit((data) => updatePaymentMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={paymentForm.control}
                        name="cashEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center space-x-3">
                              <Banknote className="w-5 h-5 text-green-600" />
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Tiền mặt</FormLabel>
                                <FormDescription>Thanh toán bằng tiền mặt</FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-cash-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="cardEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center space-x-3">
                              <CreditCard className="w-5 h-5 text-blue-600" />
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Thẻ ngân hàng</FormLabel>
                                <FormDescription>Thẻ tín dụng, thẻ ghi nợ</FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-card-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="qrEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center space-x-3">
                              <QrCode className="w-5 h-5 text-purple-600" />
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">QR Code</FormLabel>
                                <FormDescription>VietQR, VNPAY QR</FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-qr-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="ewalletEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center space-x-3">
                              <Wifi className="w-5 h-5 text-orange-600" />
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Ví điện tử</FormLabel>
                                <FormDescription>MoMo, ZaloPay, ShopeePay</FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-ewallet-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="bankTransferEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center space-x-3">
                              <Building className="w-5 h-5 text-indigo-600" />
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Chuyển khoản</FormLabel>
                                <FormDescription>Chuyển khoản ngân hàng</FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-transfer-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="allowPartialPayment"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Thanh toán một phần</FormLabel>
                              <FormDescription>Cho phép thanh toán không đủ số tiền</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-partial-payment"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="defaultPaymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phương thức mặc định</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-default-payment">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Tiền mặt</SelectItem>
                                <SelectItem value="card">Thẻ ngân hàng</SelectItem>
                                <SelectItem value="qr">QR Code</SelectItem>
                                <SelectItem value="ewallet">Ví điện tử</SelectItem>
                                <SelectItem value="transfer">Chuyển khoản</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="cashDrawerEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Ngăn kéo tiền</FormLabel>
                              <FormDescription>Tự động mở ngăn kéo khi thanh toán</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-cash-drawer"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Bank Account Information */}
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Thông tin tài khoản ngân hàng
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={paymentForm.control}
                          name="bankAccountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tên tài khoản</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Tên chủ tài khoản"
                                  data-testid="input-bank-account-name" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentForm.control}
                          name="bankAccountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Số tài khoản</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Nhập số tài khoản"
                                  data-testid="input-bank-account-number" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentForm.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tên ngân hàng</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger data-testid="input-bank-name">
                                    <SelectValue placeholder="Chọn ngân hàng" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vietqrBanks.map(bank => (
                                      <SelectItem key={bank.code} value={bank.name}>{bank.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentForm.control}
                          name="bankBranch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chi nhánh</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Chi nhánh ngân hàng"
                                  data-testid="input-bank-branch" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* QR Code Test */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Kiểm tra QR thanh toán</h4>
                            <p className="text-sm text-gray-600">Tạo mã QR thử nghiệm để kiểm tra cấu hình</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => testQRMutation.mutate()}
                            disabled={testQRMutation.isPending}
                            data-testid="button-test-qr"
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            {testQRMutation.isPending ? "Đang tạo..." : "Tạo QR thử nghiệm"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updatePaymentMutation.isPending}
                        data-testid="button-save-payment"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updatePaymentMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Print Settings */}
          <TabsContent value="print" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  Cấu hình in ấn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...printForm}>
                  <form onSubmit={printForm.handleSubmit((data) => updatePrintMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={printForm.control}
                        name="printerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên máy in</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Chọn máy in..." data-testid="input-printer-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={printForm.control}
                        name="paperSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Khổ giấy</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-paper-size">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="58mm">58mm</SelectItem>
                                <SelectItem value="80mm">80mm</SelectItem>
                                <SelectItem value="A4">A4</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={printForm.control}
                        name="copies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số bản in</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1" 
                                max="5"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-print-copies"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={printForm.control}
                          name="printReceipt"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">In hóa đơn</FormLabel>
                                <FormDescription>Tự động in hóa đơn sau thanh toán</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-print-receipt"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={printForm.control}
                          name="autoPrint"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Tự động in</FormLabel>
                                <FormDescription>In ngay khi hoàn thành đơn hàng</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-auto-print"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={printForm.control}
                          name="printBarcode"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">In mã vạch</FormLabel>
                                <FormDescription>In mã vạch sản phẩm trên hóa đơn</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-print-barcode"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={printForm.control}
                          name="logoEnabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">In logo</FormLabel>
                                <FormDescription>Hiển thị logo cửa hàng trên hóa đơn</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-print-logo"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={printForm.control}
                        name="headerText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiêu đề hóa đơn</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={2} placeholder="Cảm ơn quý khách đã mua hàng!" data-testid="textarea-header-text" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={printForm.control}
                        name="footerText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chân trang hóa đơn</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={2} placeholder="Hẹn gặp lại quý khách!" data-testid="textarea-footer-text" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => testPrintMutation.mutate()}
                        disabled={testPrintMutation.isPending}
                        data-testid="button-test-print"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        {testPrintMutation.isPending ? "Đang in..." : "In thử nghiệm"}
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={updatePrintMutation.isPending}
                        data-testid="button-save-print"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updatePrintMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}