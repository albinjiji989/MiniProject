import React, { useEffect, useState } from 'react';
import { temporaryCareAPI } from '../../../services/api';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.managerGetDashboardStats();
      setStats(response.data?.data || {});
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const generateReport = async () => {
    if (!dateRange.start || !dateRange.end) {
      setError('Please select a date range');
      return;
    }
    
    try {
      setLoading(true);
      // In a real implementation, we would call specific report endpoints
      // For now, just reload stats
      await loadStats();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading reports...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Reports & Analytics</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4 }}
          >
            <option value="overview">Overview</option>
            <option value="activity">Activity Report</option>
            <option value="caregiver">Caregiver Performance</option>
            <option value="care-type">Care Type Analysis</option>
          </select>
        </div>
      </div>

      {error && <div style={{ color: '#b00020', marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <h4 style={{ margin: 0, color: '#666' }}>Active Bookings</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{stats?.activeBookings || 0}</p>
        </div>
        <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <h4 style={{ margin: 0, color: '#666' }}>Pending Requests</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{stats?.pendingBookings || 0}</p>
        </div>
        <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <h4 style={{ margin: 0, color: '#666' }}>Caregivers</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{stats?.caregiversCount || 0}</p>
        </div>
        <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <h4 style={{ margin: 0, color: '#666' }}>Occupancy Rate</h4>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '8px 0 0 0' }}>{stats?.occupancyRate || 0}%</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ margin: 0 }}>Date Range</h3>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
            />
          </div>
          <button
            onClick={generateReport}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#5b8cff',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              alignSelf: 'flex-end'
            }}
          >
            Generate Report
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, border: '1px solid #ddd' }}>
        <h3 style={{ margin: 0 }}>Report Details</h3>
        <div style={{ marginTop: 16 }}>
          {reportType === 'overview' && (
            <div>
              <h4>Overview Report</h4>
              <p>This report shows key metrics and trends for your temporary care center.</p>
              <p>Total bookings: {stats?.totalBookings || 0}</p>
              <p>Completed bookings: {stats?.completedBookings || 0}</p>
              <p>Cancelled bookings: {stats?.cancelledBookings || 0}</p>
            </div>
          )}
          {reportType === 'activity' && (
            <div>
              <h4>Activity Report</h4>
              <p>Shows care activities performed during the selected period.</p>
              <p>Activity tracking functionality would be implemented here.</p>
            </div>
          )}
          {reportType === 'caregiver' && (
            <div>
              <h4>Caregiver Performance Report</h4>
              <p>Shows performance metrics for each caregiver.</p>
              <p>Caregiver performance tracking would be implemented here.</p>
            </div>
          )}
          {reportType === 'care-type' && (
            <div>
              <h4>Care Type Analysis</h4>
              <p>Shows distribution of different care types provided.</p>
              <p>Care type analysis would be implemented here.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => {
            // In a real implementation, this would download the report
            alert('Report download functionality would be implemented here');
          }}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: '#4caf50',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Download Report
        </button>
      </div>
    </div>
  );
};

export default Reports;