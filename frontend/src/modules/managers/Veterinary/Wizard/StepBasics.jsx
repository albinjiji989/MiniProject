import React, { useContext } from 'react'
import { WizardContext } from './WizardLayout'

const StepBasics = () => {
  const { data, setData, navigate } = useContext(WizardContext)
  return (
    <div style={{ display: 'grid', gap: 10, maxWidth: 600 }}>
      <input placeholder="Pet ID" value={data.petId} onChange={(e) => setData({ ...data, petId: e.target.value })} />
      <input type="date" value={data.visitDate} onChange={(e) => setData({ ...data, visitDate: e.target.value })} />
      <input placeholder="Weight (kg)" value={data.weightKg} onChange={(e) => setData({ ...data, weightKg: e.target.value.replace(/[^0-9.]/g, '') })} />
      <input placeholder="Symptoms" value={data.symptoms} onChange={(e) => setData({ ...data, symptoms: e.target.value })} />
      <input placeholder="Diagnosis" value={data.diagnosis} onChange={(e) => setData({ ...data, diagnosis: e.target.value })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => navigate('../tests')}>Next: Tests</button>
      </div>
    </div>
  )
}

export default StepBasics


