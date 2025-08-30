import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Users,
  UserPlus,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Shield,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Award,
  Group,
  Package
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const staffFormSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  address: z.string().optional(),
  role: z.string().min(1, "Vai trò là bắt buộc"),
  storeId: z.string().min(1, "Cửa hàng là bắt buộc"),
  workSchedule: z.string().optional(),
  salary: z.string().optional(),
  startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
  isActive: z.boolean().default(true),
  notes: z.string().optional()
});

type StaffFormData = z.infer<typeof staffFormSchema>;

const getRoleBadgeColor = (role: string) => {
  const colors: { [key: string]: string } = {
    admin: "bg-red-100 text-red-800",
    manager: "bg-blue-100 text-blue-800",
    cashier: "bg-green-100 text-green-800",
    staff: "bg-gray-100 text-gray-800",
    inventory: "bg-orange-100 text-orange-800"
  };
  return colors[role] || colors.staff;
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return <Shield className="w-4 h-4" />;
    case 'manager': return <Settings className="w-4 h-4" />;
    case 'cashier': return <UserCheck className="w-4 h-4" />;
    case 'inventory': return <Package className="w-4 h-4" />;
    default: return <Users className="w-4 h-4" />;
  }
};

export default function Staff() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  // Fetch data
  const { data: staff = [], isLoading: staffLoading } = useQuery<any[]>({
    queryKey: ['/api/staff'],
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<any[]>({
    queryKey: ['/api/roles'],
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery<any[]>({
    queryKey: ['/api/staff-groups'],
  });

  const isLoading = staffLoading || rolesLoading || groupsLoading;

  // Form
  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      role: "",
      storeId: "550e8400-e29b-41d4-a716-446655440002",
      workSchedule: "9:00-18:00",
      salary: "",
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      notes: ""
    },
  });

  // Mutations
  const addStaffMutation = useMutation({
    mutationFn: async (staffData: StaffFormData) => {
      const response = await apiRequest('POST', '/api/staff', staffData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Nhân viên đã được thêm thành công",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm nhân viên",
        variant: "destructive",
      });
    }
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffFormData> }) => {
      const response = await apiRequest('PUT', `/api/staff/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Thông tin nhân viên đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      setEditingStaff(null);
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật nhân viên",
        variant: "destructive",
      });
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/staff/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Nhân viên đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhân viên",
        variant: "destructive",
      });
    }
  });

  // Filter staff
  const filteredStaff = staff.filter((member: any) => {
    const matchesSearch = member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone?.includes(searchTerm);
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const onSubmit = (data: StaffFormData) => {
    if (editingStaff) {
      updateStaffMutation.mutate({ id: editingStaff.id, data });
    } else {
      addStaffMutation.mutate(data);
    }
  };

  const handleEditStaff = (member: any) => {
    setEditingStaff(member);
    form.reset({
      fullName: member.fullName || "",
      email: member.email || "",
      phone: member.phone || "",
      address: member.address || "",
      role: member.role || "",
      storeId: member.storeId || "550e8400-e29b-41d4-a716-446655440002",
      workSchedule: member.workSchedule || "9:00-18:00",
      salary: member.salary || "",
      startDate: member.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      isActive: member.isActive ?? true,
      notes: member.notes || ""
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      deleteStaffMutation.mutate(id);
    }
  };

  // Staff statistics
  const totalStaff = staff.length;
  const activeStaff = staff.filter((member: any) => member.isActive).length;
  const staffByRole = roles.map((role: any) => ({
    ...role,
    count: staff.filter((s: any) => s.role === role.id).length
  }));

  return (
    <AppLayout title="Quản lý nhân viên">
      <div className="space-y-6" data-testid="staff-page">
        {/* Staff Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng nhân viên</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-gray-900">{activeStaff}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vai trò</p>
                  <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Group className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Nhóm</p>
                  <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list">Danh sách nhân viên</TabsTrigger>
              <TabsTrigger value="roles">Vai trò & Quyền hạn</TabsTrigger>
              <TabsTrigger value="groups">Nhóm nhân viên</TabsTrigger>
              <TabsTrigger value="schedule">Lịch làm việc</TabsTrigger>
            </TabsList>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingStaff(null);
                    form.reset();
                  }}
                  data-testid="button-add-staff"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Thêm nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingStaff ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Họ và tên *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-staff-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-staff-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-staff-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vai trò *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-staff-role">
                                  <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role: any) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="workSchedule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giờ làm việc</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="9:00-18:00" data-testid="input-work-schedule" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lương (VNĐ)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" data-testid="input-staff-salary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ngày bắt đầu *</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-start-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Trạng thái hoạt động</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-staff-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa chỉ</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-staff-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ghi chú</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-staff-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={addStaffMutation.isPending || updateStaffMutation.isPending}
                        data-testid="button-save-staff"
                      >
                        {addStaffMutation.isPending || updateStaffMutation.isPending 
                          ? "Đang lưu..." 
                          : (editingStaff ? "Cập nhật" : "Thêm nhân viên")
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="list" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm nhân viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-staff"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full md:w-48" data-testid="select-filter-role">
                      <SelectValue placeholder="Lọc theo vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả vai trò</SelectItem>
                      {roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Staff List */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredStaff.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không tìm thấy nhân viên
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedRole !== "all" 
                      ? "Thử thay đổi bộ lọc tìm kiếm"
                      : "Bắt đầu bằng cách thêm nhân viên đầu tiên"
                    }
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Thêm nhân viên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStaff.map((member: any) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow" data-testid={`staff-card-${member.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              {member.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'NV'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{member.fullName}</h3>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditStaff(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStaff(member.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                            {getRoleIcon(member.role)}
                            <span className="ml-1">{roles.find((r: any) => r.id === member.role)?.name || member.role}</span>
                          </Badge>
                          <Badge variant={member.isActive ? 'default' : 'secondary'}>
                            {member.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {member.phone}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {member.workSchedule}
                          </div>
                          {member.salary && (
                            <div className="flex items-center">
                              <Award className="w-4 h-4 mr-2" />
                              {parseInt(member.salary).toLocaleString('vi-VN')}₫
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role: any) => {
                const staffCount = staff.filter((s: any) => s.role === role.id).length;
                return (
                  <Card key={role.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.id)}
                          {role.name}
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {staffCount} NV
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Quyền hạn:</h4>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission: string) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission.replace('_', ' ').toLowerCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">
                            Trạng thái: <span className={`font-medium ${staffCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {staffCount > 0 ? 'Đang sử dụng' : 'Chưa có NV'}
                            </span>
                          </p>
                          <Button variant="outline" size="sm">
                            <Settings className="w-3 h-3 mr-1" />
                            Cấu hình
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group: any) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Group className="w-5 h-5" />
                      {group.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {group.memberCount} thành viên
                      </Badge>
                      <Button variant="outline" size="sm">
                        Quản lý
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Schedule Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Lịch làm việc hôm nay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staff.filter((member: any) => member.isActive).slice(0, 5).map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {member.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'NV'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{member.fullName}</p>
                            <p className="text-xs text-gray-500">{roles.find((r: any) => r.id === member.role)?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.workSchedule || '9:00-18:00'}</p>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Đang làm việc
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {staff.filter((member: any) => member.isActive).length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-500">Chưa có nhân viên làm việc hôm nay</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thống kê nhanh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Đang làm việc</span>
                      <Badge variant="default">{activeStaff} người</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Nghỉ phép</span>
                      <Badge variant="secondary">0 người</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ca sáng</span>
                      <Badge variant="outline">{Math.floor(activeStaff * 0.6)} người</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ca chiều</span>
                      <Badge variant="outline">{Math.ceil(activeStaff * 0.4)} người</Badge>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button className="w-full" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Xem lịch đầy đủ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}