import React, { useState, useEffect } from 'react';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerStore() {
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    contact: {
      phone: '',
      email: ''
    },
    services: []
  });
  const [clinics, setClinics] = useState([]);
  const [clinicForm, setClinicForm] = useState({
    name: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    contact: {
      phone: '',
      email: ''
    },
    location: {
      coordinates: ['', '']
    }
  });
  const [showClinicForm, setShowClinicForm] = useState(false);
  const [editingClinicId, setEditingClinicId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStoreInfo();
    loadMyClinics();
  }, []);

  const loadStoreInfo = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetMyStore();
      if (response.data.success) {
        setStoreInfo(response.data.data.store || {
          storeName: '',
          address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: 'USA'
          },
          contact: {
            phone: '',
            email: ''
          },
          services: []
        });
      }
    } catch (error) {
      console.error('Failed to load store info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyClinics = async () => {
    try {
      const response = await veterinaryAPI.managerGetMyClinics();
      if (response.data.success) {
        setClinics(response.data.data.clinics || []);
      }
    } catch (error) {
      console.error('Failed to load clinics:', error);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setStoreInfo(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setStoreInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleClinicInputChange = (section, field, value) => {
    if (section) {
      setClinicForm(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setClinicForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await veterinaryAPI.managerUpdateMyStore(storeInfo);
      alert('Store information updated successfully');
    } catch (error) {
      console.error('Failed to update store info:', error);
      alert('Failed to update store information');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClinic = async () => {
    setSaving(true);
    try {
      // Prepare clinic data
      const clinicData = {
        name: clinicForm.name,
        address: {
          addressLine1: clinicForm.address.addressLine1,
          addressLine2: clinicForm.address.addressLine2,
          city: clinicForm.address.city,
          state: clinicForm.address.state,
          zipCode: clinicForm.address.zipCode,
          country: clinicForm.address.country
        },
        contact: {
          phone: clinicForm.contact.phone,
          email: clinicForm.contact.email
        },
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(clinicForm.location.coordinates[0]) || 0,
            parseFloat(clinicForm.location.coordinates[1]) || 0
          ]
        }
      };

      if (editingClinicId) {
        // Update existing clinic
        await veterinaryAPI.managerUpdateClinic(editingClinicId, clinicData);
        alert('Clinic updated successfully');
      } else {
        // Create new clinic
        await veterinaryAPI.managerCreateClinic(clinicData);
        alert('Clinic created successfully');
      }
      
      // Reset form and refresh clinic list
      setClinicForm({
        name: '',
        address: {
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        contact: {
          phone: '',
          email: ''
        },
        location: {
          coordinates: ['', '']
        }
      });
      setShowClinicForm(false);
      setEditingClinicId(null);
      loadMyClinics();
    } catch (error) {
      console.error('Failed to save clinic:', error);
      alert('Failed to save clinic');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClinic = (clinic) => {
    setClinicForm({
      name: clinic.name,
      address: {
        addressLine1: clinic.address?.addressLine1 || '',
        addressLine2: clinic.address?.addressLine2 || '',
        city: clinic.address?.city || '',
        state: clinic.address?.state || '',
        zipCode: clinic.address?.zipCode || '',
        country: clinic.address?.country || 'USA'
      },
      contact: {
        phone: clinic.contact?.phone || '',
        email: clinic.contact?.email || ''
      },
      location: {
        coordinates: [
          clinic.location?.coordinates?.[0] || '',
          clinic.location?.coordinates?.[1] || ''
        ]
      }
    });
    setEditingClinicId(clinic._id);
    setShowClinicForm(true);
  };

  const handleDeleteClinic = async (clinicId) => {
    if (window.confirm('Are you sure you want to delete this clinic?')) {
      try {
        await veterinaryAPI.managerDeleteClinic(clinicId);
        alert('Clinic deleted successfully');
        loadMyClinics();
      } catch (error) {
        console.error('Failed to delete clinic:', error);
        alert('Failed to delete clinic');
      }
    }
  };

  const handleCancelClinicForm = () => {
    setClinicForm({
      name: '',
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      contact: {
        phone: '',
        email: ''
      },
      location: {
        coordinates: ['', '']
      }
    });
    setShowClinicForm(false);
    setEditingClinicId(null);
  };

  return (
    <ManagerModuleLayout
      title="Veterinary Store Setup"
      subtitle="Configure your veterinary clinic information"
    >
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Clinic Information</h3>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Store Name */}
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                  Clinic Name
                </label>
                <input
                  type="text"
                  id="storeName"
                  value={storeInfo.storeName}
                  onChange={(e) => handleInputChange(null, 'storeName', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              {/* Address Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Address</h4>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="street"
                      value={storeInfo.address.street}
                      onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={storeInfo.address.city}
                      onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={storeInfo.address.state}
                      onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zip"
                      value={storeInfo.address.zip}
                      onChange={(e) => handleInputChange('address', 'zip', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      value={storeInfo.address.country}
                      onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Contact Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={storeInfo.contact.phone}
                      onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={storeInfo.contact.email}
                      onChange={(e) => handleInputChange('contact', 'email', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Services Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Services Offered</h4>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="vaccination"
                        name="services"
                        type="checkbox"
                        checked={storeInfo.services.includes('vaccination')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange(null, 'services', [...storeInfo.services, 'vaccination']);
                          } else {
                            handleInputChange(null, 'services', storeInfo.services.filter(s => s !== 'vaccination'));
                          }
                        }}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="vaccination" className="font-medium text-gray-700">Vaccinations</label>
                      <p className="text-gray-500">Routine and specialized vaccinations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="surgery"
                        name="services"
                        type="checkbox"
                        checked={storeInfo.services.includes('surgery')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange(null, 'services', [...storeInfo.services, 'surgery']);
                          } else {
                            handleInputChange(null, 'services', storeInfo.services.filter(s => s !== 'surgery'));
                          }
                        }}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="surgery" className="font-medium text-gray-700">Surgery</label>
                      <p className="text-gray-500">General and specialized surgical procedures</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="dental"
                        name="services"
                        type="checkbox"
                        checked={storeInfo.services.includes('dental')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange(null, 'services', [...storeInfo.services, 'dental']);
                          } else {
                            handleInputChange(null, 'services', storeInfo.services.filter(s => s !== 'dental'));
                          }
                        }}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="dental" className="font-medium text-gray-700">Dental Care</label>
                      <p className="text-gray-500">Dental cleaning, extractions, and care</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="emergency"
                        name="services"
                        type="checkbox"
                        checked={storeInfo.services.includes('emergency')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange(null, 'services', [...storeInfo.services, 'emergency']);
                          } else {
                            handleInputChange(null, 'services', storeInfo.services.filter(s => s !== 'emergency'));
                          }
                        }}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="emergency" className="font-medium text-gray-700">Emergency Care</label>
                      <p className="text-gray-500">24/7 emergency veterinary services</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Save Button */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clinics Management Section */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Manage Clinics</h3>
            <button
              onClick={() => setShowClinicForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add New Clinic
            </button>
          </div>

          {/* Clinic Form */}
          {showClinicForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                {editingClinicId ? 'Edit Clinic' : 'Add New Clinic'}
              </h4>
              <div className="space-y-4">
                {/* Clinic Name */}
                <div>
                  <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    id="clinicName"
                    value={clinicForm.name}
                    onChange={(e) => handleClinicInputChange(null, 'name', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Address Section */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Address</h5>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        id="addressLine1"
                        value={clinicForm.address.addressLine1}
                        onChange={(e) => handleClinicInputChange('address', 'addressLine1', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        id="addressLine2"
                        value={clinicForm.address.addressLine2}
                        onChange={(e) => handleClinicInputChange('address', 'addressLine2', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="clinicCity" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        id="clinicCity"
                        value={clinicForm.address.city}
                        onChange={(e) => handleClinicInputChange('address', 'city', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="clinicState" className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        type="text"
                        id="clinicState"
                        value={clinicForm.address.state}
                        onChange={(e) => handleClinicInputChange('address', 'state', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-1">
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        value={clinicForm.address.zipCode}
                        onChange={(e) => handleClinicInputChange('address', 'zipCode', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-1">
                      <label htmlFor="clinicCountry" className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        type="text"
                        id="clinicCountry"
                        value={clinicForm.address.country}
                        onChange={(e) => handleClinicInputChange('address', 'country', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h5>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="clinicPhone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="clinicPhone"
                        value={clinicForm.contact.phone}
                        onChange={(e) => handleClinicInputChange('contact', 'phone', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="clinicEmail" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="clinicEmail"
                        value={clinicForm.contact.email}
                        onChange={(e) => handleClinicInputChange('contact', 'email', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Location Coordinates</h5>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                        Longitude
                      </label>
                      <input
                        type="text"
                        id="longitude"
                        value={clinicForm.location.coordinates[0]}
                        onChange={(e) => {
                          const newCoords = [...clinicForm.location.coordinates];
                          newCoords[0] = e.target.value;
                          handleClinicInputChange('location', 'coordinates', newCoords);
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                        Latitude
                      </label>
                      <input
                        type="text"
                        id="latitude"
                        value={clinicForm.location.coordinates[1]}
                        onChange={(e) => {
                          const newCoords = [...clinicForm.location.coordinates];
                          newCoords[1] = e.target.value;
                          handleClinicInputChange('location', 'coordinates', newCoords);
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelClinicForm}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateClinic}
                    disabled={saving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (editingClinicId ? 'Update Clinic' : 'Create Clinic')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clinics List */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Your Clinics</h4>
            {clinics.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No clinics</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new clinic.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clinics.map((clinic) => (
                  <div key={clinic._id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{clinic.name}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClinic(clinic)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClinic(clinic._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {clinic.address?.addressLine1}, {clinic.address?.city}
                      </p>
                      <p className="text-sm text-gray-500">{clinic.contact?.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Store: {clinic.storeName || clinic.storeId || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}