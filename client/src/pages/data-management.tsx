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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { dataManagementApi, type DatabaseInfo, type BackupResult, type BackupFile } from '@/lib/data-management-api';

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
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [selectedBackupFile, setSelectedBackupFile] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Load database info on component mount
  useEffect(() => {
    loadDatabaseInfo();
    loadBackupFiles();
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

  const loadBackupFiles = async () => {
    try {
      const files = await dataManagementApi.getBackupFiles();
      setBackupFiles(files);
    } catch (error: any) {
      console.error('Error loading backup files:', error);
      // Không hiển thị toast error cho việc load backup files vì có thể folder chưa tồn tại
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setBackupProgress(0);
    
    try {
      const result = await dataManagementApi.backupDatabase({
        backupPath: customBackupPath.trim() || undefined
      });
      
      setBackupProgress(100);
      toast({
        title: "Thành công",
        description: `Sao lưu database thành công! File: ${result.fileName}`
      });
      setCustomBackupPath('');
      await loadDatabaseInfo();
    } catch (error: any) {
      console.error('Error creating backup:', error);
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

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await dataManagementApi.uploadBackupFile(file);
      toast({
        title: "Thành công",
        description: `Upload file ${result.originalName} thành công!`
      });
      setUploadedFile(file);
      setRestoreFilePath(result.filePath);
      await loadBackupFiles(); // Reload backup files list
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || 'Lỗi khi upload file backup'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreDatabase = async () => {
    if (!restoreFilePath.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: 'Vui lòng chọn file backup hoặc upload file mới'
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
      setSelectedBackupFile('');
      setUploadedFile(null);
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
        description: 'Vui lòng nhập chính xác "DELETE SALES DATA"'
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
        description: 'Xóa dữ liệu bán hàng thành công!'
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
        description: 'Vui lòng nhập chính xác "DELETE ALL DATA"'
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
        description: 'Xóa toàn bộ dữ liệu thành công!'
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Dữ Liệu</h1>
        <Badge variant="outline">
          <Shield className="h-4 w-4 mr-1" />
          Cấp quyền
        </Badge>
      </div>

      {/* Database Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Thông Tin Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          {databaseInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Tên Database</p>
                  <p className="font-semibold">{databaseInfo.databaseName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Kích Thước</p>
                  <p className="font-semibold">{databaseInfo.sizeMB} MB</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Server</p>
                  <p className="font-semibold">{databaseInfo.serverName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Backup Cuối</p>
                  <p className="font-semibold">{databaseInfo.lastBackup || 'Chưa có'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Đang tải thông tin...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="Để trống sẽ dùng đường dẫn mặc định"
                value={customBackupPath}
                onChange={(e) => setCustomBackupPath(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600">
                Mặc định: C:\temp\RetailPoint_backup_[timestamp].bak
              </p>
            </div>

            {backupProgress > 0 && (
              <div className="space-y-2">
                <Label>Tiến trình sao lưu:</Label>
                <Progress value={backupProgress} className="w-full" />
              </div>
            )}

            <Button
              onClick={handleCreateBackup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang sao lưu...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Tạo Backup
                </>
              )}
            </Button>
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Phục Hồi Database</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Phục hồi sẽ ghi đè toàn bộ dữ liệu hiện tại!
                    </AlertDescription>
                  </Alert>

                  {/* Chọn từ backup files đã có */}
                  {backupFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Chọn từ backup files đã upload:</Label>
                      <Select 
                        value={selectedBackupFile} 
                        onValueChange={(value) => {
                          setSelectedBackupFile(value);
                          setRestoreFilePath(value);
                          setUploadedFile(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn file backup..." />
                        </SelectTrigger>
                        <SelectContent>
                          {backupFiles.map((file) => (
                            <SelectItem key={file.fileName} value={file.filePath}>
                              <div className="flex flex-col">
                                <span className="font-medium">{file.fileName}</span>
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(file.size)} - {new Date(file.lastModified).toLocaleString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-sm text-gray-500">HOẶC</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {/* Upload file mới */}
                  <div className="space-y-2">
                    <Label>Upload file backup mới:</Label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click để chọn</span> hoặc kéo thả file
                          </p>
                          <p className="text-xs text-gray-500">.bak hoặc .sql files</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".bak,.sql"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file);
                              setSelectedBackupFile('');
                            }
                          }}
                          disabled={isLoading}
                        />
                      </label>
                    </div>
                    
                    {uploadedFile && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          ✓ Đã upload: {uploadedFile.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {restoreProgress > 0 && (
                    <div className="space-y-2">
                      <Label>Tiến trình phục hồi:</Label>
                      <Progress value={restoreProgress} className="w-full" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRestoreDialog(false);
                      setRestoreFilePath('');
                      setSelectedBackupFile('');
                      setUploadedFile(null);
                    }}
                    disabled={isLoading}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleRestoreDatabase}
                    disabled={isLoading || !restoreFilePath.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang phục hồi...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Phục Hồi
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Data Deletion Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Delete Sales Data Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-yellow-600" />
              Xóa Dữ Liệu Bán Hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Xóa tất cả đơn hàng, chi tiết đơn hàng và dữ liệu thanh toán
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Nhập "DELETE SALES DATA" để xác nhận:</Label>
              <Input
                placeholder="DELETE SALES DATA"
                value={salesDataConfirmation}
                onChange={(e) => setSalesDataConfirmation(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isLoading || salesDataConfirmation !== 'DELETE SALES DATA'}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa Dữ Liệu Bán Hàng
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Thao tác này sẽ xóa vĩnh viễn tất cả dữ liệu bán hàng và không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSalesData}>
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Delete All Data Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Xóa Toàn Bộ Dữ Liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>NGUY HIỂM:</strong> Xóa toàn bộ dữ liệu trong database!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Nhập "DELETE ALL DATA" để xác nhận:</Label>
              <Input
                placeholder="DELETE ALL DATA"
                value={allDataConfirmation}
                onChange={(e) => setAllDataConfirmation(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isLoading || allDataConfirmation !== 'DELETE ALL DATA'}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Xóa Toàn Bộ Dữ Liệu
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>CẢNH BÁO: Xóa toàn bộ dữ liệu!</AlertDialogTitle>
                  <AlertDialogDescription>
                    Thao tác này sẽ xóa VĨNh VIỄN toàn bộ dữ liệu trong database và KHÔNG THỂ hoàn tác. 
                    Hãy chắc chắn bạn đã sao lưu dữ liệu trước khi thực hiện!
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllData} className="bg-red-600 hover:bg-red-700">
                    Xóa Tất Cả
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataManagement;