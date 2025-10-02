import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import { apiClient } from '../../../services/api';

const AdoptionDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [petsRes, applicationsRes] = await Promise.all([
        apiClient.get('/adoption/pets'),
        apiClient.get('/adoption/applications/my')
      ]);

      setPets(petsRes.data.data.pets);
      setApplications(applicationsRes.data.data);
    } catch (error) {
      console.error('Error fetching adoption data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adoption Center</h1>
          <p className="text-gray-600">Find your perfect companion</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🐾</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Pets</p>
              <p className="text-2xl font-bold text-gray-900">{pets.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Applications</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Adopted Pets</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <div key={pet._id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {pet.images && pet.images.length > 0 && (
              <img
                src={pet.images[0].url}
                alt={pet.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{pet.name}</h3>
                  <p className="text-gray-600">{pet.breed} • {pet.species}</p>
                </div>
                <span className="text-lg font-bold text-green-600">₹{pet.adoptionFee}</span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><span className="font-medium">Age:</span> {pet.ageDisplay || `${pet.age} ${pet.ageUnit}`}</p>
                <p><span className="font-medium">Gender:</span> {pet.gender}</p>
                <p><span className="font-medium">Health:</span> {pet.healthStatus}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/user/adoption/pets/${pet._id}`)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/user/adoption/apply/${pet._id}`)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Adopt
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdoptionDashboard;