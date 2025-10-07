import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dataManagementApi } from '@/lib/data-management-api';

const DataManagementDebug: React.FC = () => {
  const [staffId, setStaffId] = useState('');
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedStaffId = localStorage.getItem('staffId');
    setStaffId(storedStaffId || 'Not set');
  }, []);

  const testApi = async () => {
    setIsLoading(true);
    setApiError(null);
    setApiResult(null);

    try {
      const result = await dataManagementApi.getDatabaseInfo();
      setApiResult(result);
    } catch (error: any) {
      setApiError(error.message);
      console.error('API Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setDebugStaffId = () => {
    localStorage.setItem('staffId', '1');
    setStaffId('1');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug Data Management</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>LocalStorage Check</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Staff ID:</strong> {staffId}</p>
          <Button onClick={setDebugStaffId} className="mt-2">Set Staff ID = 1</Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testApi} disabled={isLoading} className="mb-4">
            {isLoading ? 'Testing...' : 'Test Database Info API'}
          </Button>
          
          {apiResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-semibold text-green-800 mb-2">Success:</h4>
              <pre className="text-sm">{JSON.stringify(apiResult, null, 2)}</pre>
            </div>
          )}

          {apiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="font-semibold text-red-800 mb-2">Error:</h4>
              <p className="text-sm">{apiError}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagementDebug;