import React, { useEffect, useState } from 'react';
import { temporaryCareAPI } from '../../../services/api';

const Facilities = () => {
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', capacity: { total: 0 } });
  const [saving, setSaving] = useState(false);

  const loadCenter = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.getMyCenter();
      setCenter(response.data?.data?.center || null);
      if (response.data?.data?.center) {
        setForm({
          name: response.data.data.center.name || '',
          capacity: { total: response.data.data.center.capacity?.total || 0 }
        });
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCenter();
  }, []);

  const saveCenter = async () => {
    try {
      setSaving(true);
      await temporaryCareAPI.upsertMyCenter(form);
      await loadCenter();
      setEditing(false);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save center');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading facility...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Facility Management</h2>
      
      {error && <div style={{ color: '#b00020', marginBottom: 16 }}>{error}</div>}

      {center ? (
        <div style={{ maxWidth: 600 }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{center.name || 'Unnamed Center'}</h3>
            <p style={{ margin: '8px 0', color: '#666' }}>
              Capacity: {center.capacity?.total || 0} pets
            </p>
            <p style={{ margin: '8px 0', color: '#666' }}>
              Created: {new Date(center.createdAt).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={() => {
              setEditing(true);
              setForm({
                name: center.name || '',
                capacity: { total: center.capacity?.total || 0 }
              });
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#5b8cff',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginRight: 12
            }}
          >
            Edit Facility
          </button>
        </div>
      ) : (
        <div>
          <p>No facility setup yet. Create your temporary care facility.</p>
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#5b8cff',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Create Facility
          </button>
        </div>
      )}

      {editing && (
        <div style={{ marginTop: 24, maxWidth: 400 }}>
          <h3>{center ? 'Edit Facility' : 'Create Facility'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Facility Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter facility name"
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Total Capacity</label>
              <input
                type="number"
                value={form.capacity.total}
                onChange={(e) => setForm({ ...form, capacity: { ...form.capacity, total: parseInt(e.target.value) || 0 } })}
                placeholder="Enter total capacity"
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={saveCenter}
                disabled={saving}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facilities;