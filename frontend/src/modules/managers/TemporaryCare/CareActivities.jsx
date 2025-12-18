import React, { useState, useEffect } from 'react';
import { temporaryCareAPI } from '../../../services/api';

const CareActivities = () => {
  const [loading, setLoading] = useState(true);
  const [cares, setCares] = useState([]);
  const [selectedCare, setSelectedCare] = useState(null);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCares();
  }, []);

  const loadCares = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.getTemporaryCares({});
      setCares(response.data.data.cares || []);
    } catch (err) {
      setError('Failed to load care records');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (careId) => {
    try {
      const response = await temporaryCareAPI.getCareActivities(careId);
      setActivities(response.data.data.activities || []);
      setSelectedCare(careId);
    } catch (err) {
      setError('Failed to load care activities');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Care Activities</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Care Records List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Active Care Records</h3>
          {cares.length === 0 ? (
            <p className="text-gray-500">No active care records found.</p>
          ) : (
            <div className="space-y-4">
              {cares.map(care => (
                <div 
                  key={care._id} 
                  className={`border rounded p-4 cursor-pointer hover:bg-gray-50 ${selectedCare === care._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => loadActivities(care._id)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{care.pet?.name || 'Unknown Pet'}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      care.status === 'active' ? 'bg-green-100 text-green-800' :
                      care.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {care.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {new Date(care.startDate).toLocaleDateString()} - {new Date(care.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Caregiver: {care.caregiver?.name || 'Unassigned'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Activities Detail */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            {selectedCare 
              ? `Activities for ${cares.find(c => c._id === selectedCare)?.pet?.name || 'Pet'}` 
              : 'Select a care record'}
          </h3>
          
          {selectedCare ? (
            <div>
              {activities.length === 0 ? (
                <p className="text-gray-500">No activities logged yet.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium capitalize">{activity.activityType}</h4>
                          <p className="text-gray-600 text-sm">{activity.notes}</p>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Select a care record to view activities</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareActivities;