// Data Management API Types
export interface DatabaseInfo {
  databaseName: string;
  sizeMB: number;
  serverName: string;
  lastBackup: string;
}

export interface BackupRequest {
  backupPath?: string;
}

export interface BackupResult {
  message: string;
  backupPath: string;
  fileName: string;
  timestamp: string;
}

export interface RestoreRequest {
  backupFilePath: string;
}

export interface BackupFile {
  fileName: string;
  filePath: string;
  size: number;
  lastModified: string;
  extension: string;
}

export interface UploadBackupResponse {
  message: string;
  filePath: string;
  fileName: string;
  originalName: string;
  size: number;
}

export interface DeleteConfirmation {
  confirmationText: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Data Management API functions
const API_BASE = '/api/DataManagement';

export const dataManagementApi = {
  // Get database info
  getDatabaseInfo: async (): Promise<DatabaseInfo> => {
    const staffId = localStorage.getItem('staffId');
    const response = await fetch(`${API_BASE}/database-info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'StaffId': staffId || ''
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi tải thông tin database');
    }

    return response.json();
  },

  // Backup database
  backupDatabase: async (request: BackupRequest): Promise<BackupResult> => {
    const staffId = localStorage.getItem('staffId');
    const response = await fetch(`${API_BASE}/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'StaffId': staffId || ''
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi sao lưu database');
    }

    return response.json();
  },

  // Get backup files list
  getBackupFiles: async (): Promise<BackupFile[]> => {
    const staffId = localStorage.getItem('staffId');
    const response = await fetch(`${API_BASE}/backup-files`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'StaffId': staffId || ''
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi lấy danh sách backup files');
    }

    const result = await response.json();
    return result.files;
  },

  // Upload backup file
  uploadBackupFile: async (file: File): Promise<UploadBackupResponse> => {
    const staffId = localStorage.getItem('staffId');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload-backup`, {
      method: 'POST',
      headers: {
        'StaffId': staffId || ''
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi upload backup file');
    }

    return response.json();
  },

  // Restore database
  restoreDatabase: async (request: RestoreRequest): Promise<{ message: string; restoredFrom: string }> => {
    const staffId = localStorage.getItem('staffId');
    const response = await fetch(`${API_BASE}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'StaffId': staffId || ''
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi phục hồi database');
    }

    return response.json();
  },

  // Delete sales data
  deleteSalesData: async (confirmation: DeleteConfirmation): Promise<{ message: string; timestamp: string }> => {
    const staffId = localStorage.getItem('staffId');
    const response = await fetch(`${API_BASE}/sales-data`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'StaffId': staffId || ''
      },
      body: JSON.stringify(confirmation)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi xóa dữ liệu bán hàng');
    }

    return response.json();
  },

  // Delete all data
  deleteAllData: async (confirmation: DeleteConfirmation): Promise<{ message: string; timestamp: string }> => {
    const staffId = localStorage.getItem('staffId');
    const response = await fetch(`${API_BASE}/all-data`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'StaffId': staffId || ''
      },
      body: JSON.stringify(confirmation)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi xóa toàn bộ dữ liệu');
    }

    return response.json();
  }
};

// React Query hooks for data management
export const useDataManagement = () => {
  return {
    getDatabaseInfo: () => dataManagementApi.getDatabaseInfo(),
    backupDatabase: (request: BackupRequest) => dataManagementApi.backupDatabase(request),
    getBackupFiles: () => dataManagementApi.getBackupFiles(),
    uploadBackupFile: (file: File) => dataManagementApi.uploadBackupFile(file),
    restoreDatabase: (request: RestoreRequest) => dataManagementApi.restoreDatabase(request),
    deleteSalesData: (confirmation: DeleteConfirmation) => dataManagementApi.deleteSalesData(confirmation),
    deleteAllData: (confirmation: DeleteConfirmation) => dataManagementApi.deleteAllData(confirmation)
  };
};