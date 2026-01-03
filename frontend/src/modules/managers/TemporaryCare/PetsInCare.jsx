import React, { useEffect, useState } from 'react';
import { temporaryCareAPI } from '../../../services/api';

const PetsInCare = () => {
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [error, setError] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [activities, setActivities] = useState([]);

  const loadPets = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.getTemporaryCareByManager();
      const activePets = response.data?.data?.cares?.filter(care => care.status === 'active') || [];
      setPets(activePets);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pets in care');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const loadActivities = async (temporaryCareId) => {
    try {
      const response = await temporaryCareAPI.getCareActivities(temporaryCareId);
      return response.data?.data?.activities || [];
    } catch (e) {
      console.error('Failed to load activities:', e);
      return [];
    }
  };

  const logActivity = async (temporaryCareId, activityType, notes) => {
    try {
      await temporaryCareAPI.logCareActivity({
        temporaryCareId,
        activityType,
        notes
      });
      // Reload activities for this pet
      const updatedActivities = await loadActivities(temporaryCareId);
      setActivities(updatedActivities);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to log activity');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'active': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading pets in care...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Pets in Care</h2>
      
      {error && <div style={{ color: '#b00020', marginBottom: 16 }}>{error}</div>}

      {pets.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: '#f5f5f5', borderRadius: 8 }}>
          No pets currently in care
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {pets.map(pet => (
            <div key={pet._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0 }}>{pet.pet?.name || 'Unnamed Pet'}</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Owner: {pet.owner?.userId?.name || 'N/A'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    Caregiver: {pet.caregiver?.name || 'N/A'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: 4, 
                    background: getStatusColor(pet.status), 
                    color: 'white', 
                    fontSize: 12 
                  }}>
                    {pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}
                  </span>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                    {new Date(pet.startDate).toLocaleDateString()} - {new Date(pet.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={async () => {
                    setSelectedPet(pet);
                    const petActivities = await loadActivities(pet._id);
                    setActivities(petActivities);
                  }}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    background: '#5b8cff', 
                    color: 'white', 
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  View Details & Log Care
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pet Details Modal */}
      {selectedPet && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 8,
            maxWidth: 800,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 16 }}>{selectedPet.pet?.name || 'Pet'} Details</h3>
            
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Pet Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                <div><strong>Name:</strong> {selectedPet.pet?.name || 'N/A'}</div>
                <div><strong>Species:</strong> {selectedPet.pet?.species || 'N/A'}</div>
                <div><strong>Breed:</strong> {selectedPet.pet?.breed || 'N/A'}</div>
                <div><strong>Owner:</strong> {selectedPet.owner?.userId?.name || 'N/A'}</div>
                <div><strong>Caregiver:</strong> {selectedPet.caregiver?.name || 'N/A'}</div>
                <div><strong>Status:</strong> {selectedPet.status}</div>
                <div><strong>Period:</strong> {new Date(selectedPet.startDate).toLocaleDateString()} - {new Date(selectedPet.endDate).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Log New Activity</h4>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select id="activityType" style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4 }}>
                  <option value="feeding">Feeding</option>
                  <option value="bathing">Bathing</option>
                  <option value="walking">Walking</option>
                  <option value="medication">Medication</option>
                  <option value="playtime">Playtime</option>
                  <option value="health_check">Health Check</option>
                  <option value="other">Other</option>
                </select>
                <input
                  id="activityNotes"
                  type="text"
                  placeholder="Add notes..."
                  style={{ flex: 2, padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                />
                <button
                  onClick={() => {
                    const type = document.getElementById('activityType').value;
                    const notes = document.getElementById('activityNotes').value;
                    logActivity(selectedPet._id, type, notes);
                    document.getElementById('activityNotes').value = '';
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Log
                </button>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: 8 }}>Care Activities</h4>
              {activities.length === 0 ? (
                <p>No activities logged yet.</p>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4, padding: 8 }}>
                  {activities.map((activity, index) => (
                    <div key={index} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{activity.activityType}</strong>
                        <span style={{ color: '#666', fontSize: '0.9em' }}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {activity.notes && <div style={{ fontSize: '0.9em', color: '#555', marginTop: 4 }}>{activity.notes}</div>}
                      {activity.caregiver && <div style={{ fontSize: '0.8em', color: '#888', marginTop: 4 }}>By: {activity.caregiver.name}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                onClick={() => setSelectedPet(null)}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 4, 
                  background: '#f44336', 
                  color: 'white', 
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetsInCare;