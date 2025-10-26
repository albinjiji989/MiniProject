import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerNewAppointment() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [owners, setOwners] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    petId: '',
    ownerId: '',
    serviceId: '',
    staffId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '',
    reason: '',
    visitType: 'consultation',
    
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would fetch actual data
      // For now, we'll use sample data
      setPatients([
        { _id: '1', name: 'Max', species: 'Dog', breed: 'Golden Retriever', owner: '101' },
        { _id: '2', name: 'Bella', species: 'Cat', breed: 'Persian', owner: '102' },
        { _id: '3', name: 'Charlie', species: 'Dog', breed: 'Bulldog', owner: '103' }
      ]);
      
      setOwners([
        { _id: '101', name: 'John Smith', email: 'john@example.com', phone: '555-1234' },
        { _id: '102', name: 'Jane Doe', email: 'jane@example.com', phone: '555-5678' },
        { _id: '103', name: 'Bob Johnson', email: 'bob@example.com', phone: '555-9012' }
      ]);
      
      setServices([
        { _id: '201', name: 'Routine Checkup', price: 50, duration: 30 },
        { _id: '202', name: 'Vaccination', price: 35, duration: 20 },
        { _id: '203', name: 'Emergency Consultation', price: 100, duration: 45 }
      ]);
      
      setStaff([
        { _id: '301', name: 'Dr. Sarah Wilson', role: 'veterinarian' },
        { _id: '302', name: 'Dr. Michael Brown', role: 'veterinarian' },
        { _id: '303', name: 'Nurse Amy Taylor', role: 'veterinary_technician' }
      ]);
      
      // Generate sample time slots
      generateTimeSlots(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (date) => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}-${(minute === 30 ? hour : hour + 1).toString().padStart(2, '0')}:${(minute === 30 ? '00' : '30')}`;
        slots.push(timeSlot);
      }
    }
    
    setAvailableSlots(slots);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If pet is selected, auto-select the owner
    if (field === 'petId') {
      const pet = patients.find(p => p._id === value);
      if (pet) {
        setFormData(prev => ({
          ...prev,
          ownerId: pet.owner
        }));
      }
    }
    
    // If date changes, regenerate time slots
    if (field === 'appointmentDate') {
      generateTimeSlots(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await veterinaryAPI.managerCreateAppointment(formData);
      navigate('/manager/veterinary/appointments');
    } catch (error) {
      console.error('Failed to create appointment:', error);
      alert('Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagerModuleLayout
      title="New Appointment"
      subtitle="Create a new veterinary appointment"
      actions={[
        {
          label: 'Back to Appointments',
          onClick: () => navigate('/manager/veterinary/appointments')
        }
      ]}
    >
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient and Owner Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="petId" className="block text-sm font-medium text-gray-700">
                    Select Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="petId"
                    required
                    value={formData.petId}
                    onChange={(e) => handleInputChange('petId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a patient</option>
                    {patients.map((pet) => (
                      <option key={pet._id} value={pet._id}>
                        {pet.name} ({pet.species} - {pet.breed})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
                    Owner <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="ownerId"
                    required
                    value={formData.ownerId}
                    onChange={(e) => handleInputChange('ownerId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select an owner</option>
                    {owners.map((owner) => (
                      <option key={owner._id} value={owner._id}>
                        {owner.name} ({owner.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Service and Staff Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">
                    Service <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="serviceId"
                    required
                    value={formData.serviceId}
                    onChange={(e) => handleInputChange('serviceId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.name} (${service.price} - {service.duration} min)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="staffId" className="block text-sm font-medium text-gray-700">
                    Assigned Staff
                  </label>
                  <select
                    id="staffId"
                    value={formData.staffId}
                    onChange={(e) => handleInputChange('staffId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select staff member</option>
                    {staff.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="visitType" className="block text-sm font-medium text-gray-700">
                    Visit Type
                  </label>
                  <select
                    id="visitType"
                    value={formData.visitType}
                    onChange={(e) => handleInputChange('visitType', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="routine_checkup">Routine Checkup</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="surgery">Surgery</option>
                    <option value="emergency">Emergency</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="consultation">Consultation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Appointment Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
                    Appointment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="appointmentDate"
                    required
                    value={formData.appointmentDate}
                    onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700">
                    Time Slot <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="timeSlot"
                    required
                    value={formData.timeSlot}
                    onChange={(e) => handleInputChange('timeSlot', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map((slot, index) => (
                      <option key={index} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                
                
              </div>
              
              <div className="mt-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reason"
                  required
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="Describe the reason for the visit..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/manager/veterinary/appointments')}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}