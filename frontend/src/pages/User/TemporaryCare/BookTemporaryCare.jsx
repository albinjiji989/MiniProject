import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, Heart, DollarSign, Shield,
  ArrowRight, Check, Info, AlertCircle
} from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const BookTemporaryCare = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [bookingData, setBookingData] = useState({
    petId: '',
    serviceTypeId: '',
    startDate: '',
    endDate: '',
    locationType: 'facility',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    specialRequirements: {
      diet: '',
      medication: [],
      allergies: [],
      behaviorNotes: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      vetContact: {
        name: '',
        phone: '',
        clinicName: ''
      }
    }
  });

  const [pricingDetails, setPricingDetails] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, petsRes] = await Promise.all([
        api.get('/api/temporary-care/user/services'),
        api.get('/api/temporary-care/user/my-pets')
      ]);
      setServices(servicesRes.data.data);
      setMyPets(petsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!bookingData.serviceTypeId || !bookingData.startDate || !bookingData.endDate) {
      return;
    }

    try {
      const response = await api.post('/api/temporary-care/user/calculate-price', {
        serviceTypeId: bookingData.serviceTypeId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate
      });
      setPricingDetails(response.data.data);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  useEffect(() => {
    if (bookingData.serviceTypeId && bookingData.startDate && bookingData.endDate) {
      calculatePrice();
    }
  }, [bookingData.serviceTypeId, bookingData.startDate, bookingData.endDate]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/temporary-care/user/bookings', bookingData);
      const booking = response.data.data;
      
      // Redirect to payment page
      navigate(`/user/temporary-care/payment/${booking._id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Your Pet</h2>
      
      {myPets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">You don't have any pets yet</p>
          <button
            onClick={() => navigate('/user/pets/add')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Your Pet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myPets.map((pet) => (
            <div
              key={pet._id}
              onClick={() => {
                setBookingData({ ...bookingData, petId: pet._id });
                setStep(2);
              }}
              className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                bookingData.petId === pet._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-4">
                {pet.profileImage ? (
                  <img
                    src={pet.profileImage}
                    alt={pet.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{pet.name}</h3>
                  <p className="text-sm text-gray-600">{pet.species} • {pet.breed}</p>
                  <p className="text-xs text-gray-500">{pet.age} {pet.ageUnit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Service</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div
            key={service._id}
            onClick={() => setBookingData({ ...bookingData, serviceTypeId: service._id })}
            className={`border-2 rounded-lg p-6 cursor-pointer transition ${
              bookingData.serviceTypeId === service._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-xl">{service.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                  {service.category}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">₹{service.pricing.basePrice}</p>
                <p className="text-xs text-gray-500">{service.pricing.priceUnit.replace('_', ' ')}</p>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{service.description}</p>
            
            {service.features && service.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Includes:</p>
                {service.features.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!bookingData.serviceTypeId}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Booking Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={bookingData.startDate}
            onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={bookingData.endDate}
            onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
            min={bookingData.startDate || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Location
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="locationType"
              value="facility"
              checked={bookingData.locationType === 'facility'}
              onChange={(e) => setBookingData({ ...bookingData, locationType: e.target.value })}
              className="w-4 h-4 text-blue-600"
            />
            <span>At Facility</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="locationType"
              value="customer_home"
              checked={bookingData.locationType === 'customer_home'}
              onChange={(e) => setBookingData({ ...bookingData, locationType: e.target.value })}
              className="w-4 h-4 text-blue-600"
            />
            <span>At My Home</span>
          </label>
        </div>
      </div>

      {bookingData.locationType === 'customer_home' && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h3 className="font-medium">Home Address</h3>
          <input
            type="text"
            placeholder="Address Line 1"
            value={bookingData.address.addressLine1}
            onChange={(e) => setBookingData({
              ...bookingData,
              address: { ...bookingData.address, addressLine1: e.target.value }
            })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Address Line 2"
            value={bookingData.address.addressLine2}
            onChange={(e) => setBookingData({
              ...bookingData,
              address: { ...bookingData.address, addressLine2: e.target.value }
            })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="City"
              value={bookingData.address.city}
              onChange={(e) => setBookingData({
                ...bookingData,
                address: { ...bookingData.address, city: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="State"
              value={bookingData.address.state}
              onChange={(e) => setBookingData({
                ...bookingData,
                address: { ...bookingData.address, state: e.target.value }
              })}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <input
            type="text"
            placeholder="ZIP Code"
            value={bookingData.address.zipCode}
            onChange={(e) => setBookingData({
              ...bookingData,
              address: { ...bookingData.address, zipCode: e.target.value }
            })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      )}

      {pricingDetails && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Price Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Amount:</span>
              <span>₹{pricingDetails.baseAmount.toLocaleString()}</span>
            </div>
            {pricingDetails.additionalCharges > 0 && (
              <div className="flex justify-between">
                <span>Additional Charges:</span>
                <span>₹{pricingDetails.additionalCharges.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({pricingDetails.tax.percentage}%):</span>
              <span>₹{pricingDetails.tax.amount.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total Amount:</span>
              <span className="text-blue-600">₹{pricingDetails.totalAmount.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 text-green-600">
              <div className="flex justify-between">
                <span>Advance Payment ({pricingDetails.advancePercentage}%):</span>
                <span className="font-semibold">₹{pricingDetails.advanceAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs mt-1">
                <span>Remaining (Pay at checkout):</span>
                <span>₹{pricingDetails.remainingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => setStep(4)}
          disabled={!bookingData.startDate || !bookingData.endDate}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Special Requirements (Optional)</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diet Instructions
          </label>
          <textarea
            value={bookingData.specialRequirements.diet}
            onChange={(e) => setBookingData({
              ...bookingData,
              specialRequirements: { ...bookingData.specialRequirements, diet: e.target.value }
            })}
            rows={3}
            placeholder="Any specific food requirements or feeding schedule..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Behavior Notes
          </label>
          <textarea
            value={bookingData.specialRequirements.behaviorNotes}
            onChange={(e) => setBookingData({
              ...bookingData,
              specialRequirements: { ...bookingData.specialRequirements, behaviorNotes: e.target.value }
            })}
            rows={3}
            placeholder="Temperament, likes, dislikes, fears..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Contact Name"
              value={bookingData.specialRequirements.emergencyContact.name}
              onChange={(e) => setBookingData({
                ...bookingData,
                specialRequirements: {
                  ...bookingData.specialRequirements,
                  emergencyContact: { ...bookingData.specialRequirements.emergencyContact, name: e.target.value }
                }
              })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={bookingData.specialRequirements.emergencyContact.phone}
              onChange={(e) => setBookingData({
                ...bookingData,
                specialRequirements: {
                  ...bookingData.specialRequirements,
                  emergencyContact: { ...bookingData.specialRequirements.emergencyContact, phone: e.target.value }
                }
              })}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Veterinarian Contact</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Vet Name"
              value={bookingData.specialRequirements.vetContact.name}
              onChange={(e) => setBookingData({
                ...bookingData,
                specialRequirements: {
                  ...bookingData.specialRequirements,
                  vetContact: { ...bookingData.specialRequirements.vetContact, name: e.target.value }
                }
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Clinic Name"
              value={bookingData.specialRequirements.vetContact.clinicName}
              onChange={(e) => setBookingData({
                ...bookingData,
                specialRequirements: {
                  ...bookingData.specialRequirements,
                  vetContact: { ...bookingData.specialRequirements.vetContact, clinicName: e.target.value }
                }
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Clinic Phone"
              value={bookingData.specialRequirements.vetContact.phone}
              onChange={(e) => setBookingData({
                ...bookingData,
                specialRequirements: {
                  ...bookingData.specialRequirements,
                  vetContact: { ...bookingData.specialRequirements.vetContact, phone: e.target.value }
                }
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(3)}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? 'Creating Booking...' : 'Proceed to Payment'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {s}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden md:block">
                    {s === 1 && 'Select Pet'}
                    {s === 2 && 'Choose Service'}
                    {s === 3 && 'Booking Details'}
                    {s === 4 && 'Requirements'}
                  </span>
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-4 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
};

export default BookTemporaryCare;
