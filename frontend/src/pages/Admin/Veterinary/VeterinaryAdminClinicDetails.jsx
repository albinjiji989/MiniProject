import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryAdminClinicDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadClinic();
    }
  }, [id]);

  const loadClinic = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would fetch actual clinic data
      // For now, we'll use sample data
      const sampleClinic = {
        _id: id,
        name: 'Paws & Claws Veterinary Clinic',
        address: {
          street: '123 Pet Street',
          city: 'Animalville',
          state: 'CA',
          zip: '90210',
          country: 'USA'
        },
        contact: {
          phone: '555-0123',
          email: 'info@pawsandclaws.com'
        },
        services: ['consultation', 'vaccination', 'surgery', 'dental', 'emergency'],
        isActive: true,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-10-15')
      };
      
      setClinic(sampleClinic);
    } catch (error) {
      console.error('Failed to load clinic:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateClinicStatus = async (isActive) => {
    setUpdating(true);
    try {
      await veterinaryAPI.adminUpdateClinicStatus(id, isActive);
      setClinic(prev => ({ ...prev, isActive }));
      alert(`Clinic ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to update clinic status:', error);
      alert('Failed to update clinic status');
    } finally {
      setUpdating(false);
    }
  };

  const getServicesList = (services) => {
    const serviceLabels = {
      consultation: 'Consultation',
      vaccination: 'Vaccination',
      surgery: 'Surgery',
      dental: 'Dental',
      grooming: 'Grooming',
      emergency: 'Emergency',
      other: 'Other'
    };
    
    return services.map(service => serviceLabels[service] || service).join(', ');
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>
    );
  };

  if (loading) {
    return (
      <AdminLayout
        title="Clinic Details"
        subtitle="View veterinary clinic information"
      >
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!clinic) {
    return (
      <AdminLayout
        title="Clinic Details"
        subtitle="View veterinary clinic information"
      >
        <div className="bg-white shadow sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">Clinic not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Clinic Details"
      subtitle="View veterinary clinic information"
      actions={[
        {
          label: 'Back to Clinics',
          onClick: () => navigate('/admin/veterinary/clinics')
        }
      ]}
    >
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {clinic.name}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {getStatusBadge(clinic.isActive)}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => updateClinicStatus(!clinic.isActive)}
                disabled={updating}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  clinic.isActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {updating ? 'Updating...' : clinic.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Address</h4>
              <div className="mt-2 text-sm text-gray-500">
                <p>{clinic.address?.street}</p>
                <p>{clinic.address?.city}, {clinic.address?.state} {clinic.address?.zip}</p>
                <p>{clinic.address?.country}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
              <div className="mt-2 text-sm text-gray-500">
                <p>Phone: {clinic.contact?.phone}</p>
                <p>Email: {clinic.contact?.email}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Services</h4>
              <div className="mt-2 text-sm text-gray-500">
                <p>{getServicesList(clinic.services || [])}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Dates</h4>
              <div className="mt-2 text-sm text-gray-500">
                <p>Created: {new Date(clinic.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(clinic.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
