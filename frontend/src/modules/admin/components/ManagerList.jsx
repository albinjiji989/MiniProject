import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ManagerList() {
  const [managers, setManagers] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedManager, setSelectedManager] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    assignedModules: [],
    storeName: '',
    storeAddress: '',
    storeCity: '',
    storeState: ''
  });

  useEffect(() => {
    fetchManagers();
    fetchModules();
  }, []);

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/managers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setManagers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setModules(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  const handleEdit = (manager) => {
    setSelectedManager(manager);
    setEditFormData({
      assignedModules: manager.assignedModules.map(m => m._id),
      storeName: manager.storeInfo?.storeName || '',
      storeAddress: manager.storeInfo?.storeAddress || '',
      storeCity: manager.storeInfo?.storeCity || '',
      storeState: manager.storeInfo?.storeState || ''
    });
    setEditModalOpen(true);
  };

  const handleUpdateManager = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Update modules
      await axios.put(
        `${API_URL}/admin/managers/${selectedManager._id}/modules`,
        { assignedModules: editFormData.assignedModules },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update store info
      await axios.put(
        `${API_URL}/admin/managers/${selectedManager._id}/store`,
        {
          storeName: editFormData.storeName,
          storeAddress: editFormData.storeAddress,
          storeCity: editFormData.storeCity,
          storeState: editFormData.storeState
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Manager updated successfully!');
      setEditModalOpen(false);
      fetchManagers();
    } catch (error) {
      alert('Failed to update manager: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (managerId) => {
    if (!confirm('Are you sure you want to change this manager\'s status?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/admin/managers/${managerId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchManagers();
    } catch (error) {
      alert('Failed to toggle status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleResetPassword = async (managerId) => {
    if (!confirm('Generate a new temporary password for this manager?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/managers/${managerId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`New temporary password: ${response.data.data.temporaryPassword}\n\nPlease share this with the manager.`);
      }
    } catch (error) {
      alert('Failed to reset password: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (managerId) => {
    if (!confirm('Are you sure you want to delete this manager? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/managers/${managerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Manager deleted successfully');
      fetchManagers();
    } catch (error) {
      alert('Failed to delete manager: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredManagers = managers.filter(m =>
    m.name.toLowerCase().includes(filter.toLowerCase()) ||
    m.email.toLowerCase().includes(filter.toLowerCase()) ||
    m.storeInfo?.storeName?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading managers...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">All Managers</h2>
          <input
            type="text"
            placeholder="Search managers..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredManagers.map((manager) => (
              <tr key={manager._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{manager.name}</div>
                    <div className="text-sm text-gray-500">{manager.email}</div>
                    <div className="text-xs text-gray-400">{manager.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{manager.storeInfo?.storeName || 'N/A'}</div>
                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                      {manager.storeInfo?.storeId || 'No ID'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {manager.storeInfo?.storeCity}, {manager.storeInfo?.storeState}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {manager.assignedModules?.map((module) => (
                      <span
                        key={module._id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {module.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    manager.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {manager.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(manager)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(manager._id)}
                      className="text-yellow-600 hover:text-yellow-900 text-sm font-medium"
                    >
                      {manager.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(manager._id)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Reset Pwd
                    </button>
                    <button
                      onClick={() => handleDelete(manager._id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredManagers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No managers found
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Edit Manager</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Modules</label>
                <div className="space-y-2">
                  {modules.map((module) => (
                    <label key={module._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.assignedModules.includes(module._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditFormData({
                              ...editFormData,
                              assignedModules: [...editFormData.assignedModules, module._id]
                            });
                          } else {
                            setEditFormData({
                              ...editFormData,
                              assignedModules: editFormData.assignedModules.filter(id => id !== module._id)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      {module.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                <input
                  type="text"
                  value={editFormData.storeName}
                  onChange={(e) => setEditFormData({ ...editFormData, storeName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
                <input
                  type="text"
                  value={editFormData.storeAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, storeAddress: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={editFormData.storeCity}
                    onChange={(e) => setEditFormData({ ...editFormData, storeCity: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={editFormData.storeState}
                    onChange={(e) => setEditFormData({ ...editFormData, storeState: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateManager}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
              >
                Update Manager
              </button>
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
