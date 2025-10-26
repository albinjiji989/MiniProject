import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerServiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Preventive Care',
    basePrice: '',
    duration: '',
    availability: 'all',
    isActive: true,
    requiresAppointment: true,
    preparationInstructions: '',
    followUpRecommended: false,
    followUpInterval: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      loadService();
    }
  }, [id]);

  const loadService = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch actual service data
      // For now, we'll use sample data
      const sampleService = {
        name: 'Routine Checkup',
        description: 'Comprehensive health examination for pets including physical examination, weight check, and health assessment',
        category: 'Preventive Care',
        basePrice: 75.00,
        duration: 30,
        availability: 'all',
        isActive: true,
        requiresAppointment: true,
        preparationInstructions: 'Please bring any previous medical records and list of current medications',
        followUpRecommended: true,
        followUpInterval: 365
      };
      
      setFormData(sampleService);
    } catch (error) {
      console.error('Failed to load service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Service name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.basePrice) newErrors.basePrice = 'Base price is required';
    if (formData.basePrice && isNaN(formData.basePrice)) newErrors.basePrice = 'Price must be a valid number';
    if (formData.duration && isNaN(formData.duration)) newErrors.duration = 'Duration must be a valid number';
    if (formData.followUpRecommended && !formData.followUpInterval) {
      newErrors.followUpInterval = 'Follow-up interval is required when follow-up is recommended';
    }
    if (formData.followUpInterval && isNaN(formData.followUpInterval)) {
      newErrors.followUpInterval = 'Follow-up interval must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const serviceData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        duration: formData.duration ? parseInt(formData.duration) : 0,
        followUpInterval: formData.followUpInterval ? parseInt(formData.followUpInterval) : 0
      };
      
      if (isEdit) {
        // Update existing service
        await veterinaryAPI.updateService(id, serviceData);
      } else {
        // Create new service
        await veterinaryAPI.createService(serviceData);
      }
      
      navigate('/manager/veterinary/services');
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryOptions = () => {
    return [
      'Preventive Care',
      'Dental Care',
      'Surgery',
      'Emergency',
      'Diagnostic',
      'Therapy',
      'Other'
    ];
  };

  return (
    <ManagerModuleLayout
      title={isEdit ? "Edit Service" : "Add New Service"}
      subtitle={isEdit ? "Update veterinary service details" : "Create a new veterinary service"}
      actions={[
        {
          label: 'Back to Services',
          onClick: () => navigate('/manager/veterinary/services')
        }
      ]}
    >
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {getCategoryOptions().map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
                  Base Price ($) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="basePrice"
                    id="basePrice"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.basePrice ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.basePrice && <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="duration"
                    id="duration"
                    min="0"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.duration ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                  <p className="mt-1 text-sm text-gray-500">Enter 0 for variable duration</p>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                  Availability
                </label>
                <div className="mt-1">
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Pets</option>
                    <option value="dogs">Dogs Only</option>
                    <option value="cats">Cats Only</option>
                    <option value="small">Small Animals Only</option>
                    <option value="large">Large Animals Only</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="preparationInstructions" className="block text-sm font-medium text-gray-700">
                  Preparation Instructions
                </label>
                <div className="mt-1">
                  <textarea
                    id="preparationInstructions"
                    name="preparationInstructions"
                    rows={3}
                    value={formData.preparationInstructions}
                    onChange={handleInputChange}
                    placeholder="Instructions for pet owners before the service..."
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="isActive" className="font-medium text-gray-700">
                      Active Service
                    </label>
                    <p className="text-gray-500">Uncheck to deactivate this service</p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="requiresAppointment"
                      name="requiresAppointment"
                      type="checkbox"
                      checked={formData.requiresAppointment}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="requiresAppointment" className="font-medium text-gray-700">
                      Requires Appointment
                    </label>
                    <p className="text-gray-500">Uncheck if this service is available on walk-in basis</p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="followUpRecommended"
                      name="followUpRecommended"
                      type="checkbox"
                      checked={formData.followUpRecommended}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="followUpRecommended" className="font-medium text-gray-700">
                      Follow-up Recommended
                    </label>
                    <p className="text-gray-500">Check if a follow-up visit is typically recommended</p>
                  </div>
                </div>
              </div>

              {formData.followUpRecommended && (
                <div className="sm:col-span-3">
                  <label htmlFor="followUpInterval" className="block text-sm font-medium text-gray-700">
                    Follow-up Interval (days) <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="followUpInterval"
                      id="followUpInterval"
                      min="1"
                      value={formData.followUpInterval}
                      onChange={handleInputChange}
                      className={`block w-full border ${errors.followUpInterval ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.followUpInterval && <p className="mt-1 text-sm text-red-600">{errors.followUpInterval}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/manager/veterinary/services')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}