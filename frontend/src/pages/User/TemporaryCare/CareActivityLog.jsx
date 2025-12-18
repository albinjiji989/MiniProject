import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { temporaryCareAPI } from '../../../services/api';

const CareActivityLog = () => {
  const { temporaryCareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [care, setCare] = useState(null);
  const [activities, setActivities] = useState([]);
  const [formData, setFormData] = useState({
    activityType: 'feeding',
    notes: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadCareDetails();
    loadActivities();
  }, [temporaryCareId]);

  const loadCareDetails = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.getTemporaryCare(temporaryCareId);
      setCare(response.data.data.care);
    } catch (err) {
      setError('Failed to load care details');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await temporaryCareAPI.getCareActivities(temporaryCareId);
      setActivities(response.data.data.activities || []);
    } catch (err) {
      setError('Failed to load care activities');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      
      await temporaryCareAPI.logCareActivity({
        temporaryCareId,
        activityType: formData.activityType,
        notes: formData.notes
      });
      
      // Reset form and reload activities
      setFormData({
        activityType: 'feeding',
        notes: ''
      });
      
      loadActivities();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to log activity');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!care) {
    return <div className="p-6">Care record not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Care Activities</h2>
        <button
          onClick={() => navigate('/User/temporary-care')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Back
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Pet: {care.pet?.name || 'N/A'}</h3>
        <p className="text-gray-600 mb-2">
          Care Period: {new Date(care.startDate).toLocaleDateString()} - {new Date(care.endDate).toLocaleDateString()}
        </p>
        <p className="text-gray-600">
          Status: <span className="font-medium capitalize">{care.status}</span>
        </p>
      </div>
      
      {/* Log new activity form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Log New Activity</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="activityType">
              Activity Type
            </label>
            <select
              id="activityType"
              name="activityType"
              value={formData.activityType}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="feeding">Feeding</option>
              <option value="bathing">Bathing</option>
              <option value="walking">Walking</option>
              <option value="medication">Medication</option>
              <option value="playtime">Playtime</option>
              <option value="health_check">Health Check</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Add any additional notes about the activity..."
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {saving ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Activity history */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Activity History</h3>
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
    </div>
  );
};

export default CareActivityLog;