import React, { useContext, useState } from 'react'
import { WizardContext } from './WizardLayout'
import { veterinaryAPI } from '../../../../services/api'

const StepMedicationsReview = () => {
  const { data, setData, navigate } = useContext(WizardContext)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const add = () => setData({ ...data, medications: [ ...(data.medications || []), { name: '', dose: '', frequency: '', durationDays: '' } ] })
  const upd = (idx, field, val) => setData({ ...data, medications: (data.medications || []).map((x, i) => i === idx ? { ...x, [field]: val } : x) })

  const submit = async () => {
    try {
      setSaving(true)
      setError('')
      const payload = {
        visitDate: data.visitDate,
        weightKg: Number(data.weightKg) || null,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        tests: data.tests,
        injections: data.injections,
        medications: data.medications,
        notes: data.notes,
      }
      await veterinaryAPI.managerCreateMedicalRecord(data.petId, payload)
      navigate('/manager/veterinary/manage')
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit record')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 680 }}>
      <div>
        <strong>Medications</strong>
        {(data.medications || []).map((m, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
            <input placeholder="Name" value={m.name || ''} onChange={(e) => upd(i, 'name', e.target.value)} />
            <input placeholder="Dose" value={m.dose || ''} onChange={(e) => upd(i, 'dose', e.target.value)} />
            <input placeholder="Frequency" value={m.frequency || ''} onChange={(e) => upd(i, 'frequency', e.target.value)} />
            <input placeholder="Days" value={m.durationDays || ''} onChange={(e) => upd(i, 'durationDays', e.target.value.replace(/\D/g, ''))} />
          </div>
        ))}
        <button onClick={add}>Add Medication</button>
      </div>
      <textarea placeholder="Notes" rows={3} value={data.notes || ''} onChange={(e) => setData({ ...data, notes: e.target.value })} />
      {error && <div style={{ color: '#b00020' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => navigate('../tests')}>Back</button>
        <button onClick={submit} disabled={saving}>{saving ? 'Submitting…' : 'Submit Record'}</button>
      </div>
    </div>
  )
}

export default StepMedicationsReview


