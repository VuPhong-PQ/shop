import React, { useState, useEffect } from 'react';
import { Store } from 'lucide-react';

interface StoreInfo {
  storeId: number;
  storeName: string;
  shortName: string;
}

const StoreInfoHeader: React.FC = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentStoreInfo();
    
    // Lắng nghe event khi store thay đổi
    const handleStoreChange = () => {
      fetchCurrentStoreInfo();
    };
    
    window.addEventListener('storeChanged', handleStoreChange);
    
    return () => {
      window.removeEventListener('storeChanged', handleStoreChange);
    };
  }, []);

  const fetchCurrentStoreInfo = async () => {
    try {
      const response = await fetch('http://localhost:5271/api/storeswitch/current-info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Username': 'admin'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.storeId) {
          setStoreInfo(data);
        } else {
          setStoreInfo(null);
        }
      }
    } catch (error) {
      console.error('Error fetching store info:', error);
      setStoreInfo(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-300 rounded"></div>
          <div className="w-32 h-4 bg-blue-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!storeInfo) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <Store className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500 font-medium">Chưa chọn cửa hàng</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
      <Store className="w-4 h-4 text-blue-600" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-blue-900" title={storeInfo.storeName}>
          {storeInfo.shortName}
        </span>
        <span className="text-xs text-blue-600">Cửa hàng hiện tại</span>
      </div>
    </div>
  );
};

export default StoreInfoHeader;