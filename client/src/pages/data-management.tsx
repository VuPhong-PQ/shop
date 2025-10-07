import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  FileText,
  HardDrive,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dataManagementApi, type DatabaseInfo, type BackupResult } from '@/lib/data-management-api';

const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [customBackupPath, setCustomBackupPath] = useState('');
  const [restoreFilePath, setRestoreFilePath] = useState('');
  const [salesDataConfirmation, setSalesDataConfirmation] = useState('');
  const [allDataConfirmation, setAllDataConfirmation] = useState('');
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // Load database info on component mount
  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      const data = await dataManagementApi.getDatabaseInfo();
      setDatabaseInfo(data);
    } catch (error: any) {
      console.error('Error loading database info:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || 'Lỗi khi tải thông tin database'
      });
    }
  };

  const handleBackupDatabase = async () => {
    setIsLoading(true);
    setBackupProgress(0);
    
    try {
      const result = await dataManagementApi.backupDatabase({
        backupPath: customBackupPath || undefined
      });
      
      setBackupProgress(100);
      toast({
        title: "Thành công",
        description: `Sao lưu database thành công! File: ${result.fileName}`
      });
      setCustomBackupPath('');
      await loadDatabaseInfo();
    } catch (error: any) {
      console.error('Error backing up database:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || 'Lỗi khi sao lưu database'
      });
    } finally {
      setIsLoading(false);
      setBackupProgress(0);
    }
  };

  const handleRestoreDatabase = async () => {
    if (!restoreFilePath.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: 'Vui lòng nhập đường dẫn file backup'
      });
      return;
    }

    setIsLoading(true);
    setRestoreProgress(0);
    
    try {
      const result = await dataManagementApi.restoreDatabase({
        backupFilePath: restoreFilePath
      });
      
      setRestoreProgress(100);
      toast({
        title: "Thành công",
        description: 'Phục hồi database thành công!'
      });
      setRestoreFilePath('');
      setShowRestoreDialog(false);
      await loadDatabaseInfo();
    } catch (error: any) {
      console.error('Error restoring database:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || 'Lỗi khi phục hồi database'
      });
    } finally {
      setIsLoading(false);
      setRestoreProgress(0);
    }
  };

  const handleDeleteSalesData = async () => {
    if (salesDataConfirmation !== 'DELETE SALES DATA') {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: 'Vui lòng nhập đúng text xác nhận: DELETE SALES DATA'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await dataManagementApi.deleteSalesData({
        confirmationText: salesDataConfirmation
      });
      
      toast({
        title: "Thành công",
        description: 'Đã xóa dữ liệu bán hàng thành công!'
      });
      setSalesDataConfirmation('');
      await loadDatabaseInfo();
    } catch (error: any) {
      console.error('Error deleting sales data:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || 'Lỗi khi xóa dữ liệu bán hàng'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (allDataConfirmation !== 'DELETE ALL DATA') {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: 'Vui lòng nhập đúng text xác nhận: DELETE ALL DATA'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await dataManagementApi.deleteAllData({
        confirmationText: allDataConfirmation
      });
      
      toast({
        title: "Thành công",
        description: 'Đã xóa toàn bộ dữ liệu thành công!'
      });
      setAllDataConfirmation('');
      await loadDatabaseInfo();
    } catch (error: any) {
      console.error('Error deleting all data:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || 'Lỗi khi xóa toàn bộ dữ liệu'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Dữ Liệu</h1>
        <Badge variant="secondary" className="ml-auto">
          <Shield className="h-4 w-4 mr-1" />
          Cần phân quyền
        </Badge>
      </div>

      {/* Database Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Thông Tin Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          {databaseInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <Label className="text-sm text-gray-600">Tên Database</Label>
                <span className="font-semibold">{databaseInfo.databaseName}</span>
              </div>
              <div className="flex flex-col">
                <Label className="text-sm text-gray-600">Kích Thước</Label>
                <span className="font-semibold">{databaseInfo.sizeMB} MB</span>
              </div>
              <div className="flex flex-col">
                <Label className="text-sm text-gray-600">Server</Label>
                <span className="font-semibold">{databaseInfo.serverName}</span>
              </div>
              <div className="flex flex-col">
                <Label className="text-sm text-gray-600">Backup Cuối</Label>
                <span className="font-semibold">{databaseInfo.lastBackup}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải thông tin database...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Database Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Sao Lưu Dữ Liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Đường dẫn sao lưu (tùy chọn)</Label>
              <Input
                placeholder="Ví dụ: C:\Backups"
                value={customBackupPath}
                onChange={(e) => setCustomBackupPath(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600">
                Để trống sẽ sử dụng đường dẫn mặc định: C:\temp
              </p>
            </div>

            {backupProgress > 0 && (
              <div className="space-y-2">
                <Progress value={backupProgress} className="w-full" />
                <p className="text-sm text-center">Đang sao lưu... {backupProgress}%</p>
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Sao Lưu Database
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận sao lưu</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn sao lưu toàn bộ database? 
                    Quá trình này có thể mất vài phút tùy thuộc vào kích thước dữ liệu.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBackupDatabase}>
                    Sao Lưu
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Restore Database Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Phục Hồi Dữ Liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cảnh báo:</strong> Phục hồi sẽ ghi đè toàn bộ dữ liệu hiện tại!
              </AlertDescription>
            </Alert>

            <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={isLoading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Phục Hồi Database
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Phục Hồi Database</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Đường dẫn file backup (.bak)</Label>
                    <Input
                      placeholder="Ví dụ: C:\Backups\database_backup_20241007_120000.bak"
                      value={restoreFilePath}
                      onChange={(e) => setRestoreFilePath(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {restoreProgress > 0 && (
                    <div className="space-y-2">
                      <Progress value={restoreProgress} className="w-full" />
                      <p className="text-sm text-center">Đang phục hồi... {restoreProgress}%</p>
                    </div>
                  )}

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Thao tác này sẽ thay thế hoàn toàn dữ liệu hiện tại. Đảm bảo bạn đã sao lưu trước khi thực hiện!
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleRestoreDatabase} disabled={isLoading || !restoreFilePath.trim()}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Phục Hồi
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delete Sales Data Card */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Trash2 className="h-5 w-5" />
              Xóa Dữ Liệu Bán Hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Xóa toàn bộ đơn hàng, khách hàng, báo cáo. <br />
                <strong>Giữ lại:</strong> Sản phẩm, nhóm hàng, nhân viên, cài đặt.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Nhập "DELETE SALES DATA" để xác nhận:</Label>
              <Input
                value={salesDataConfirmation}
                onChange={(e) => setSalesDataConfirmation(e.target.value)}
                placeholder="DELETE SALES DATA"
                disabled={isLoading}
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  disabled={isLoading || salesDataConfirmation !== 'DELETE SALES DATA'}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Xóa Dữ Liệu Bán Hàng
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-orange-700">
                    Xóa Dữ Liệu Bán Hàng
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>Cảnh báo nghiêm trọng!</strong><br />
                    Thao tác này sẽ xóa vĩnh viễn:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Tất cả đơn hàng và chi tiết đơn hàng</li>
                      <li>Thông tin khách hàng</li>
                      <li>Lịch sử xuất nhập kho</li>
                      <li>Báo cáo bán hàng</li>
                    </ul>
                    <br />
                    <strong>Dữ liệu được giữ lại:</strong> Sản phẩm, nhóm hàng, nhân viên, cài đặt hệ thống.
                    <br /><br />
                    Bạn có chắc chắn muốn tiếp tục?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSalesData} className="bg-orange-600 hover:bg-orange-700">
                    Xóa Dữ Liệu Bán Hàng
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Delete All Data Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Xóa Toàn Bộ Dữ Liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>NGUY HIỂM!</strong> Xóa toàn bộ dữ liệu hệ thống. <br />
                <strong>Giữ lại:</strong> Chỉ cấu hình permissions cơ bản.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Nhập "DELETE ALL DATA" để xác nhận:</Label>
              <Input
                value={allDataConfirmation}
                onChange={(e) => setAllDataConfirmation(e.target.value)}
                placeholder="DELETE ALL DATA"
                disabled={isLoading}
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  disabled={isLoading || allDataConfirmation !== 'DELETE ALL DATA'}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Xóa Toàn Bộ Dữ Liệu
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-700">
                    XÓA TOÀN BỘ DỮ LIỆU HỆ THỐNG
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong className="text-red-600">CẢNH BÁO CỰC KỲ NGHIÊM TRỌNG!</strong><br />
                    Thao tác này sẽ xóa vĩnh viễn:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Tất cả sản phẩm và nhóm hàng</strong></li>
                      <li><strong>Tất cả đơn hàng và dữ liệu bán hàng</strong></li>
                      <li><strong>Tất cả khách hàng</strong></li>
                      <li><strong>Tất cả nhân viên và phân quyền</strong></li>
                      <li><strong>Tất cả cài đặt hệ thống</strong></li>
                      <li><strong>Tất cả báo cáo và lịch sử</strong></li>
                    </ul>
                    <br />
                    <strong className="text-green-600">Chỉ giữ lại:</strong> Cấu hình permissions cơ bản của hệ thống.
                    <br /><br />
                    <strong className="text-red-600">THAO TÁC NÀY KHÔNG THỂ HOÀN TÁC!</strong>
                    <br />
                    Bạn có chắc chắn muốn tiếp tục?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllData} className="bg-red-600 hover:bg-red-700">
                    XÓA TOÀN BỘ DỮ LIỆU
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Information Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">Lưu Ý Quan Trọng</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Sao lưu thường xuyên:</strong> Thực hiện backup định kỳ để bảo vệ dữ liệu</li>
                <li>• <strong>Kiểm tra file backup:</strong> Đảm bảo file backup có thể sử dụng được trước khi xóa dữ liệu</li>
                <li>• <strong>Phân quyền:</strong> Chỉ người có quyền mới có thể thực hiện các thao tác này</li>
                <li>• <strong>Thời gian thực hiện:</strong> Backup/Restore có thể mất thời gian tùy thuộc kích thước dữ liệu</li>
                <li>• <strong>Kết nối ổn định:</strong> Đảm bảo kết nối internet và database ổn định trong quá trình thực hiện</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;