import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: 'consultation'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterAndSortServices();
  }, [services, searchTerm, filterCategory, filterStatus, sortBy]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetServices();
      setServices(response.data.data.services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      alert('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortServices = () => {
    let filtered = [...services];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(service => service.category === filterCategory);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(service => service.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'duration':
          return a.duration - b.duration;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredServices(filtered);
  };

  const getStatistics = () => {
    const total = services.length;
    const active = services.filter(s => s.status === 'active').length;
    const inactive = services.filter(s => s.status === 'inactive').length;
    const avgPrice = services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length)
      : 0;
    const categories = [...new Set(services.map(s => s.category))].length;

    return { total, active, inactive, avgPrice, categories };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Service name must be at least 3 characters';
    }
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (formData.price && formData.price > 50000) {
      newErrors.price = 'Price seems too high. Please verify.';
    }
    if (!formData.duration || formData.duration < 5) {
      newErrors.duration = 'Duration must be at least 5 minutes';
    }
    if (formData.duration && formData.duration > 480) {
      newErrors.duration = 'Duration cannot exceed 8 hours (480 minutes)';
    }
    
    // Check for duplicate service name (only when creating new)
    if (!editingService) {
      const duplicate = services.find(s =>
        s.name.toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (duplicate) {
        newErrors.name = 'A service with this name already exists';
      }
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
      if (editingService) {
        // Update existing service
        await veterinaryAPI.managerUpdateService(editingService._id, {
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration)
        });
        alert('Service updated successfully!');
      } else {
        // Create new service
        await veterinaryAPI.managerCreateService({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration)
        });
        alert('Service created successfully!');
      }
      
      // Reset form and refresh services
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        category: 'consultation'
      });
      setEditingService(null);
      setShowForm(false);
      loadServices();
    } catch (error) {
      console.error('Failed to save service:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to save service: ${error.response.data.message}`);
      } else {
        alert('Failed to save service. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category || 'other'
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      setLoading(true);
      try {
        await veterinaryAPI.managerDeleteService(serviceId);
        alert('Service deleted successfully!');
        loadServices();
      } catch (error) {
        console.error('Failed to delete service:', error);
        alert('Failed to delete service. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (serviceId, currentStatus) => {
    setLoading(true);
    try {
      await veterinaryAPI.managerToggleService(serviceId);
      alert(`Service ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully!`);
      loadServices();
    } catch (error) {
      console.error('Failed to toggle service status:', error);
      alert('Failed to update service status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: 'consultation'
    });
    setEditingService(null);
    setErrors({});
    setShowForm(false);
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      consultation: '💬',
      vaccination: '💉',
      checkup: '🔬',
      examination: '🔍',
      surgery: '⚕️',
      grooming: '✨',
      dentistry: '🦷',
      dental: '🦷',
      emergency: '🚨',
      diagnostic: '🔬',
      other: '📋'
    };
    return iconMap[category] || '🏥';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/manager/veterinary')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Veterinary Services Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Add and manage services that users can book appointments for
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Service
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Important Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                Services you add here will automatically appear on the user booking page. Users can select these services when booking appointments.
              </p>
              <p className="font-medium">
                💡 The price you set is the <strong>consultation/service fee only</strong>. Medicine and treatment costs will be charged separately at the clinic after examination.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {services.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Services</dt>
                    <dd className="text-lg font-semibold text-gray-900">{getStatistics().total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-semibold text-green-600">{getStatistics().active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inactive</dt>
                    <dd className="text-lg font-semibold text-gray-600">{getStatistics().inactive}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg. Fee</dt>
                    <dd className="text-lg font-semibold text-gray-900">₹{getStatistics().avgPrice}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
                    <dd className="text-lg font-semibold text-gray-900">{getStatistics().categories}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Form */}
      {showForm && (
        <div className="mb-8 bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Service Name */}
              <div className="sm:col-span-3">
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
                    className={`block w-full border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
              </div>

              {/* Category */}
              <div className="sm:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="consultation">💬 Consultation</option>
                    <option value="vaccination">💉 Vaccination</option>
                    <option value="checkup">🔬 Health Checkup</option>
                    <option value="examination">🔍 Examination</option>
                    <option value="emergency">🚨 Emergency</option>
                    <option value="surgery">⚕️ Surgery</option>
                    <option value="grooming">✨ Grooming</option>
                    <option value="dental">🦷 Dental</option>
                    <option value="dentistry">🦷 Dentistry</option>
                    <option value="diagnostic">🔬 Diagnostic</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Services will appear on user booking page based on category
                </p>
              </div>

              {/* Price */}
              <div className="sm:col-span-3">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Service Fee (₹) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    placeholder="500"
                    className={`block w-full pl-7 border ${errors.price ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Consultation/Service fee only (medicines charged separately at clinic)
                </p>
              </div>

              {/* Duration */}
              <div className="sm:col-span-3">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="duration"
                    id="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="5"
                    max="480"
                    step="1"
                    placeholder="30"
                    className={`block w-full border ${errors.duration ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Appointment time slot duration (e.g., 15, 20, 30, 45, 60 minutes)
                </p>
              </div>

              {/* Description */}
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the service..."
                    className={`block w-full border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (editingService ? 'Updating...' : 'Creating...') : (editingService ? 'Update Service' : 'Create Service')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Available Services</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filteredServices.length} of {services.length} services
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          {services.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search services..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Categories</option>
                  <option value="consultation">Consultation</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="checkup">Checkup</option>
                  <option value="examination">Examination</option>
                  <option value="emergency">Emergency</option>
                  <option value="surgery">Surgery</option>
                  <option value="grooming">Grooming</option>
                  <option value="dental">Dental</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          )}

          {/* Sort Options */}
          {services.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-2">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="duration">Duration</option>
                  <option value="category">Category</option>
                </select>
              </div>
              {(searchTerm || filterCategory !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                    setFilterStatus('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
        {loading && !services.length ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new veterinary service.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Service
              </button>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('all');
                  setFilterStatus('all');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredServices.map((service) => (
              <li key={service._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <span className="text-2xl">{getCategoryIcon(service.category)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {service.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {service.category || 'Other'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        ₹{service.price}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {service.duration} min
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {service.status === 'active' ? '✓ Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-500">
                      {service.description}
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(service._id, service.status)}
                      className="text-sm font-medium text-yellow-600 hover:text-yellow-900"
                    >
                      {service.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
                      className="text-sm font-medium text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}