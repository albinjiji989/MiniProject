import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

export const WizardContext = React.createContext(null)

const WizardLayout = () => {
  const navigate = useNavigate()
  const [data, setData] = useState({ petId: '', visitDate: '', weightKg: '', symptoms: '', diagnosis: '', tests: [], injections: [], medications: [], notes: '' })

  return (
    <WizardContext.Provider value={{ data, setData, navigate }}>
      <div style={{ padding: 24 }}>
        <h2>Veterinary Visit Wizard</h2>
        <Outlet />
      </div>
    </WizardContext.Provider>
  )
}

export default WizardLayout


