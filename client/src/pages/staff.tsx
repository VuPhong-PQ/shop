import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  User,
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
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  phoneNumber: z.string().optional(),
  roleId: z.number().min(1, "Vai trò là bắt buộc"),
  isActive: z.boolean().default(true),
  notes: z.string().optional()
}).refine((data) => {
  // For new staff, password is required and must be at least 6 chars
  // For editing staff, password is optional but if provided must be at least 6 chars
  if (data.password && data.password.length > 0) {
    return data.password.length >= 6;
  }
  return true;
}, {
  message: "Mật khẩu tối thiểu 6 ký tự",
  path: ["password"]
});

type StaffFormData = z.infer<typeof staffFormSchema>;

const getRoleBadgeColor = (roleName: string) => {
  const colors: { [key: string]: string } = {
    "Admin": "bg-red-100 text-red-800",
    "Quản lý": "bg-blue-100 text-blue-800",
    "Thu ngân": "bg-green-100 text-green-800",
    staff: "bg-gray-100 text-gray-800",
    inventory: "bg-orange-100 text-orange-800"
  };
  return colors[roleName] || colors.staff;
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
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedConfigRole, setSelectedConfigRole] = useState<any | null>(null);

  // Fetch data
  const { data: staff = [], isLoading: staffLoading } = useQuery<any[]>({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<any[]>({
    queryKey: ['/api/role'],
    queryFn: async () => {
      const response = await fetch('/api/role');
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<any[]>({
    queryKey: ['/api/permission'],
    queryFn: async () => {
      const response = await fetch('/api/permission');
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
  });

  // Mock groups data for now (will be implemented later)
  const groups = [
    { id: 1, name: 'Admin', count: 1 },
    { id: 2, name: 'Thu ngân', count: 1 }
  ];

  const isLoading = staffLoading || rolesLoading || permissionsLoading;

  // Form
  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      email: "",
      phoneNumber: "",
      roleId: 0,
      isActive: true,
      notes: "",
    },
  });

  // Mutations
  const addStaffMutation = useMutation({
    mutationFn: async (staffData: StaffFormData) => {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create staff: ${response.status} - ${errorText}`);
      }
      
      // Handle 204 No Content response
      if (response.status === 204) {
        return null;
      }
      
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<StaffFormData> }) => {
      console.log('Updating staff with ID:', id);
      console.log('Data being sent:', data);
      
      const response = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', response.status, errorText);
        throw new Error(`Failed to update staff: ${response.status} - ${errorText}`);
      }
      
      // Handle 204 No Content response
      if (response.status === 204) {
        console.log('Success: 204 No Content');
        return null;
      }
      
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
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete staff');
      
      // Handle 204 No Content response
      if (response.status === 204) {
        return {};
      }
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

  // Permission management functions
  const togglePermission = useMutation({
    mutationFn: async ({ roleId, permissionId, action }: { roleId: number, permissionId: number, action: 'add' | 'remove' }) => {
      const url = action === 'add' 
        ? '/api/role/assign-permission' 
        : '/api/role/remove-permission';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, permissionId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to update permission: ${response.status}`);
      }
      
      // Handle 204 No Content response
      if (response.status === 204) {
        return {};
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Quyền hạn đã được cập nhật",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/role'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permission'] });
      
      // Update selectedConfigRole with fresh data
      if (selectedConfigRole) {
        setTimeout(() => {
          const roles = queryClient.getQueryData(['/api/role']) as any[];
          const updatedRole = roles?.find(r => r.roleId === selectedConfigRole.roleId);
          if (updatedRole) {
            setSelectedConfigRole(updatedRole);
          }
        }, 100);
      }
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quyền hạn",
        variant: "destructive",
      });
    }
  });

  const handlePermissionToggle = (permissionId: number, hasPermission: boolean) => {
    if (!selectedConfigRole) {
      console.error('No role selected for permission toggle');
      return;
    }
    
    const requestData = {
      roleId: selectedConfigRole.roleId,
      permissionId,
      action: (hasPermission ? 'remove' : 'add') as 'add' | 'remove'
    };
    
    console.log('Toggling permission:', requestData);
    console.log('Selected role:', selectedConfigRole);
    
    togglePermission.mutate(requestData);
  };

  const openConfigDialog = (role: any) => {
    console.log('Opening config dialog for role:', role);
    setSelectedConfigRole(role);
    setIsConfigDialogOpen(true);
  };

  // Auto-update selectedConfigRole when roles data changes
  useEffect(() => {
    if (selectedConfigRole && roles.length > 0) {
      const updatedRole = roles.find((r: any) => r.roleId === selectedConfigRole.roleId);
      if (updatedRole) {
        setSelectedConfigRole(updatedRole);
      }
    }
  }, [roles, selectedConfigRole?.roleId]);

  // Select/Deselect all permissions
  const selectAllPermissions = useMutation({
    mutationFn: async () => {
      if (!selectedConfigRole) throw new Error('No role selected');
      
      const currentPermissionIds = selectedConfigRole.permissions?.map((p: any) => p.permissionId) || [];
      const allPermissionIds = permissions.map((p: any) => p.permissionId);
      const toAssign = allPermissionIds.filter(id => !currentPermissionIds.includes(id));
      
      // Assign missing permissions
      for (const permissionId of toAssign) {
        const response = await fetch('/api/role/assign-permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: selectedConfigRole.roleId, permissionId })
        });
        if (!response.ok) throw new Error('Failed to assign permission');
      }
      
      return { assigned: toAssign.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: `Đã chọn tất cả quyền hạn (${data.assigned} quyền mới)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/role'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể chọn tất cả quyền hạn",
        variant: "destructive",
      });
    }
  });

  const deselectAllPermissions = useMutation({
    mutationFn: async () => {
      if (!selectedConfigRole) throw new Error('No role selected');
      
      const currentPermissionIds = selectedConfigRole.permissions?.map((p: any) => p.permissionId) || [];
      
      // Remove all permissions
      for (const permissionId of currentPermissionIds) {
        const response = await fetch('/api/role/remove-permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: selectedConfigRole.roleId, permissionId })
        });
        if (!response.ok) throw new Error('Failed to remove permission');
      }
      
      return { removed: currentPermissionIds.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: `Đã hủy tất cả quyền hạn (${data.removed} quyền)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/role'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể hủy tất cả quyền hạn",
        variant: "destructive",
      });
    }
  });

  // Filter staff
  const filteredStaff = staff.filter((member: any) => {
    const matchesSearch = member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phoneNumber?.includes(searchTerm);
    const matchesRole = selectedRole === "all" || member.roleId?.toString() === selectedRole;
    return matchesSearch && matchesRole;
  });

  const onSubmit = (data: StaffFormData) => {
    console.log('onSubmit called with data:', data);
    console.log('editingStaff:', editingStaff);
    
    // For new staff, password is required
    if (!editingStaff && (!data.password || data.password.length < 6)) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu là bắt buộc và tối thiểu 6 ký tự khi tạo nhân viên mới",
        variant: "destructive",
      });
      return;
    }

    // For updating staff, only send password if it's provided
    if (editingStaff) {
      const updateData = { ...data };
      if (!data.password || data.password.length === 0) {
        delete updateData.password;
      }
      console.log('Calling updateStaffMutation with:', { id: editingStaff.staffId, data: updateData });
      updateStaffMutation.mutate({ id: editingStaff.staffId, data: updateData });
    } else {
      console.log('Calling addStaffMutation with:', data);
      addStaffMutation.mutate(data);
    }
  };

  const handleEditStaff = (member: any) => {
    setEditingStaff(member);
    form.reset({
      fullName: member.fullName || "",
      username: member.username || "",
      password: "", // Don't populate password for editing
      email: member.email || "",
      phoneNumber: member.phoneNumber || "",
      roleId: member.roleId || 0,
      isActive: member.isActive ?? true,
      notes: member.notes || ""
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteStaff = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      deleteStaffMutation.mutate(id);
    }
  };

  // Staff statistics
  const totalStaff = staff.length;
  const activeStaff = staff.filter((member: any) => member.isActive).length;
  const staffByRole = roles.map((role: any) => ({
    ...role,
    count: staff.filter((s: any) => s.roleId === role.roleId).length
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
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên đăng nhập *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-staff-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {editingStaff ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                placeholder={editingStaff ? "Nhập mật khẩu mới..." : "Tối thiểu 6 ký tự"}
                                data-testid="input-staff-password" 
                              />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-staff-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-staff-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vai trò *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-staff-role">
                                  <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role: any) => (
                                  <SelectItem key={role.roleId} value={role.roleId.toString()}>
                                    {role.roleName}
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
                        <SelectItem key={role.roleId} value={role.roleId.toString()}>
                          {role.roleName}
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
                  <Card key={member.staffId} className="hover:shadow-md transition-shadow" data-testid={`staff-card-${member.staffId}`}>
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
                            <p className="text-sm text-gray-500">{member.email || member.username}</p>
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
                              onClick={() => handleDeleteStaff(member.staffId)}
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
                          <Badge className={getRoleBadgeColor(member.roleName || 'N/A')} variant="outline">
                            {getRoleIcon(member.roleName || 'N/A')}
                            <span className="ml-1">{member.roleName || 'N/A'}</span>
                          </Badge>
                          <Badge variant={member.isActive ? 'default' : 'secondary'}>
                            {member.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {member.username}
                          </div>
                          {member.phoneNumber && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {member.phoneNumber}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Tạo: {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          {member.notes && (
                            <div className="flex items-start">
                              <Award className="w-4 h-4 mr-2 mt-0.5" />
                              <span className="text-xs">{member.notes}</span>
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
                          {role.permissions.map((permission: any) => (
                            <Badge key={permission.permissionId} variant="outline" className="text-xs">
                              {permission.permissionName.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
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
                          <Button variant="outline" size="sm" onClick={() => openConfigDialog(role)}>
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

      {/* Permission Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Cấu hình quyền hạn - {selectedConfigRole?.roleName}
            </DialogTitle>
          </DialogHeader>
          
          {/* Bulk Actions */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="text-sm text-gray-600">
              Đã chọn: {selectedConfigRole?.permissions?.length || 0} / {permissions.length} quyền
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => selectAllPermissions.mutate()}
                disabled={selectAllPermissions.isPending}
              >
                Chọn tất cả
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => deselectAllPermissions.mutate()}
                disabled={deselectAllPermissions.isPending}
              >
                Hủy tất cả
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissions.map((permission: any) => {
                const hasPermission = selectedConfigRole?.permissions?.some(
                  (p: any) => p.permissionId === permission.permissionId
                );
                
                return (
                  <div key={`permission-${permission.permissionId}`} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={`permission-${permission.permissionId}`}
                      checked={hasPermission}
                      onCheckedChange={() => handlePermissionToggle(permission.permissionId, hasPermission)}
                      className="mt-1"
                      aria-describedby={`permission-desc-${permission.permissionId}`}
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={`permission-${permission.permissionId}`}
                        className="block text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {permission.permissionName}
                      </label>
                      <p 
                        id={`permission-desc-${permission.permissionId}`}
                        className="text-xs text-gray-500 mt-1"
                      >
                        {permission.description}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {permission.category}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {permissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Không có quyền hạn nào được tìm thấy</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Đóng
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Thành công",
                    description: "Cấu hình quyền hạn đã được lưu",
                  });
                  setIsConfigDialogOpen(false);
                }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}