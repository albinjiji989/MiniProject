import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleDashboardLayout from '../../components/Module/ModuleDashboardLayout';
import { veterinaryAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function VeterinaryManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    totalStaff: 0,
    totalServices: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch dashboard stats
        const statsResponse = await veterinaryAPI.managerGetDashboardStats();
        setStats(statsResponse.data.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const actions = [
    { 
      label: 'New Appointment', 
      onClick: () => navigate('/manager/veterinary/appointments/new'),
      color: 'bg-blue-600' 
    },
    { 
      label: 'Add Medical Record', 
      onClick: () => navigate('/manager/veterinary/medical-records/new'),
      color: 'bg-green-600' 
    },
    { 
      label: 'Manage Staff', 
      onClick: () => navigate('/manager/veterinary/staff'),
      color: 'bg-purple-600' 
    },
    { 
      label: 'Services', 
      onClick: () => navigate('/manager/veterinary/services'),
      color: 'bg-indigo-600' 
    }
  ];

  const dashboardStats = [
    { label: 'Total Appointments', value: stats.totalAppointments, icon: '📅' },
    { label: 'Upcoming', value: stats.upcomingAppointments, icon: '⏰' },
    { label: 'Completed', value: stats.completedAppointments, icon: '✅' },
    { label: 'Patients', value: stats.totalPatients, icon: '🐾' },
    { label: 'Staff', value: stats.totalStaff, icon: '👨‍⚕️' },
    { label: 'Services', value: stats.totalServices, icon: '🩺' }
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'patients', label: 'Patients' },
    { key: 'staff', label: 'Staff' }
  ];

  const [activeTab, setActiveTab] = useState('overview');

  const Overview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Appointments</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Max (Golden Retriever)</p>
              <p className="text-sm text-gray-600">Dr. Smith • Today, 10:00 AM</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Scheduled</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Bella (Persian Cat)</p>
              <p className="text-sm text-gray-600">Dr. Johnson • Today, 11:30 AM</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Completed</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/manager/veterinary/appointments/new')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center"
          >
            <div className="text-2xl mb-1">📅</div>
            <div className="text-sm font-medium">New Appointment</div>
          </button>
          <button 
            onClick={() => navigate('/manager/veterinary/medical-records/new')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center"
          >
            <div className="text-2xl mb-1">📝</div>
            <div className="text-sm font-medium">Add Record</div>
          </button>
          <button 
            onClick={() => navigate('/manager/veterinary/patients')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center"
          >
            <div className="text-2xl mb-1">🐾</div>
            <div className="text-sm font-medium">View Patients</div>
          </button>
          <button 
            onClick={() => navigate('/manager/veterinary/staff')}
            className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-center"
          >
            <div className="text-2xl mb-1">👨‍⚕️</div>
            <div className="text-sm font-medium">Manage Staff</div>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm">09:00 - 09:30</span>
            <span className="text-sm font-medium">Available</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">09:30 - 10:00</span>
            <span className="text-sm font-medium text-blue-600">Max (G. Retriever)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">10:00 - 10:30</span>
            <span className="text-sm font-medium">Available</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">10:30 - 11:00</span>
            <span className="text-sm font-medium text-green-600">Bella (P. Cat)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const Appointments = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veterinarian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">Max</div>
                <div className="text-sm text-gray-500">Golden Retriever</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Today, 10:00 AM
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Dr. Smith
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  Scheduled
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  onClick={() => navigate('/manager/veterinary/appointments/1')}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  View
                </button>
                <button className="text-green-600 hover:text-green-900">
                  Check-in
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const Patients = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Recent Patients</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">Max</div>
                <div className="text-sm text-gray-500">Golden Retriever</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                John Doe
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Dog
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                2023-05-15
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  onClick={() => navigate('/manager/veterinary/patients/1')}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View Records
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const Staff = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Veterinary Staff</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">Dr. Jane Smith</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Veterinarian
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                jane.smith@clinic.com
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                (555) 123-4567
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <ModuleDashboardLayout
      title="Veterinary Manager Dashboard"
      description="Manage appointments, patients, staff, and medical records"
      actions={actions}
      stats={dashboardStats}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      storeInfo={{ storeId: user?.storeId, storeName: user?.storeName }}
    >
      {activeTab === 'overview' && <Overview />}
      {activeTab === 'appointments' && <Appointments />}
      {activeTab === 'patients' && <Patients />}
      {activeTab === 'staff' && <Staff />}
    </ModuleDashboardLayout>
  );
}