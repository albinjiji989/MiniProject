import React from 'react'
import { Link } from 'react-router-dom'

const VeterinaryWorkerDashboard = () => {
  return (
    <div style={{ padding: 24 }}>
      <h2>Veterinary Staff Dashboard</h2>
      <p>Quick actions for veterinary staff.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <Link to="/manager/veterinary/wizard/basic" style={{ padding: '8px 12px', background: '#5b8cff', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Start Visit Wizard</Link>
        <Link to="/manager/veterinary/manage" style={{ padding: '8px 12px', background: '#eee', border: '1px solid #ddd', borderRadius: 6, textDecoration: 'none' }}>Add Medical Record</Link>
      </div>
    </div>
  )
}

export default VeterinaryWorkerDashboard


