import React, { useState, useEffect } from 'react';
import { ChevronDown, Store, MapPin } from 'lucide-react';

interface Store {
  storeId: number;
  name: string;
  address: string;
  phone?: string;
  manager?: string;
}

interface StoreSwitcherProps {
  onStoreChange?: (store: Store) => void;
}

export default function StoreSwitcher({ onStoreChange }: StoreSwitcherProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch available stores for current user
  useEffect(() => {
    fetchMyStores();
    fetchCurrentStore();
  }, []);

  const fetchMyStores = async () => {
    try {
      const response = await fetch('http://localhost:5271/api/storeswitch/my-stores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Username': 'admin' // Tạm thời hardcode, sau này lấy từ context/auth
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchCurrentStore = async () => {
    try {
      const response = await fetch('http://localhost:5271/api/storeswitch/current', {
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
          const store = stores.find(s => s.storeId === data.storeId);
          if (store) {
            setCurrentStore(store);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current store:', error);
    }
  };

  const handleStoreSelect = async (store: Store) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5271/api/storeswitch/set-current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Username': 'admin'
        },
        credentials: 'include',
        body: JSON.stringify({ storeId: store.storeId })
      });

      if (response.ok) {
        setCurrentStore(store);
        setIsOpen(false);
        onStoreChange?.(store);
        
        // Show success message
        alert(`Đã chuyển sang ${store.name}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Có lỗi xảy ra khi chuyển cửa hàng');
      }
    } catch (error) {
      console.error('Error setting current store:', error);
      alert('Có lỗi xảy ra khi chuyển cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  if (stores.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Không có quyền truy cập cửa hàng nào
      </div>
    );
  }

  if (stores.length === 1) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Store className="w-4 h-4 text-blue-600" />
        <div>
          <div className="font-medium">{stores[0].name}</div>
          <div className="text-gray-500 text-xs flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {stores[0].address}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          <Store className="w-4 h-4 text-blue-600" />
          <div className="text-left">
            <div className="font-medium text-sm">
              {currentStore?.name || 'Chọn cửa hàng'}
            </div>
            {currentStore && (
              <div className="text-gray-500 text-xs flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {currentStore.address}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {stores.map((store) => (
            <button
              key={store.storeId}
              onClick={() => handleStoreSelect(store)}
              disabled={loading}
              className={`w-full text-left p-3 hover:bg-gray-50 transition-colors duration-200 ${
                currentStore?.storeId === store.storeId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <Store className={`w-4 h-4 ${currentStore?.storeId === store.storeId ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium text-sm">{store.name}</div>
                  <div className="text-gray-500 text-xs flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {store.address}
                  </div>
                  {store.manager && (
                    <div className="text-gray-400 text-xs mt-1">
                      Quản lý: {store.manager}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}