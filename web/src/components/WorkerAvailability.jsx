import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WorkerAvailability = ({ serviceId, selectedDate, onWorkerSelect }) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (serviceId && selectedDate) {
      fetchAvailableWorkers();
    }
  }, [serviceId, selectedDate]);

  const fetchAvailableWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/bookings/available-workers', {
        params: {
          serviceId,
          date: selectedDate
        }
      });
      setWorkers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách thợ');
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWorkloadColor = (workload, maxCapacity) => {
    const percentage = (workload / maxCapacity) * 100;
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadText = (workload, maxCapacity) => {
    if (workload === 0) return 'Rảnh';
    if (workload < maxCapacity * 0.5) return 'Ít việc';
    if (workload < maxCapacity * 0.8) return 'Bình thường';
    return 'Bận';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Danh sách thợ</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tìm thợ khả dụng...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Danh sách thợ</h3>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchAvailableWorkers}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!workers.availableWorkers && !workers.unavailableWorkers) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Danh sách thợ</h3>
        <div className="text-sm text-gray-600">
          {workers.availableCount}/{workers.totalWorkers} thợ khả dụng
        </div>
      </div>

      {workers.message && (
        <div className={`p-3 rounded-lg mb-4 ${
          workers.availableCount > 0 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }`}>
          {workers.message}
        </div>
      )}

      {/* Available Workers */}
      {workers.availableWorkers && workers.availableWorkers.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-green-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Thợ khả dụng ({workers.availableWorkers.length})
          </h4>
          <div className="space-y-3">
            {workers.availableWorkers.map((worker) => (
              <div 
                key={worker._id}
                className="border border-green-200 rounded-lg p-4 hover:bg-green-50 cursor-pointer transition-colors"
                onClick={() => onWorkerSelect && onWorkerSelect(worker)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-semibold">
                          {worker.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{worker.name}</h5>
                        <p className="text-sm text-gray-600">{worker.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getWorkloadColor(worker.workload, worker.maxCapacity)}`}>
                      {getWorkloadText(worker.workload, worker.maxCapacity)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {worker.workload}/{worker.maxCapacity} việc hôm nay
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Workers */}
      {workers.unavailableWorkers && workers.unavailableWorkers.length > 0 && (
        <div>
          <h4 className="font-medium text-red-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Thợ không khả dụng ({workers.unavailableWorkers.length})
          </h4>
          <div className="space-y-3">
            {workers.unavailableWorkers.map((worker) => (
              <div 
                key={worker._id}
                className="border border-red-200 rounded-lg p-4 bg-red-50 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-700 font-semibold">
                          {worker.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{worker.name}</h5>
                        <p className="text-sm text-gray-600">{worker.phone}</p>
                        {worker.reason && (
                          <p className="text-xs text-red-600 mt-1">{worker.reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      Không khả dụng
                    </div>
                    {worker.hasTimeConflict && (
                      <div className="text-xs text-gray-500">
                        Trùng lịch hẹn
                      </div>
                    )}
                    {worker.nextAvailableSlot && (
                      <div className="text-xs text-blue-600 mt-1">
                        Rảnh lúc: {formatTime(worker.nextAvailableSlot)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Info */}
      {workers.service && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Dịch vụ:</strong> {workers.service.name} - {workers.service.basePrice.toLocaleString('vi-VN')}đ
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <strong>Thời gian:</strong> {formatTime(workers.requestedDate)}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerAvailability;