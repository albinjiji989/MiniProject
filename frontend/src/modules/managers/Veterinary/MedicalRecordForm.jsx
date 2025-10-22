import React, { useState } from 'react'
import { veterinaryAPI } from '../../../services/api'

const MedicalRecordForm = ({ petId }) => {
  const [form, setForm] = useState({ visitDate: '', weightKg: '', symptoms: '', diagnosis: '', notes: '' })
  const [tests, setTests] = useState([{ name: '', result: '' }])
  const [injections, setInjections] = useState([{ name: '', dose: '' }])
  const [medications, setMedications] = useState([{ name: '', dose: '', frequency: '', durationDays: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addRow = (setter, tpl) => setter((arr) => [...arr, { ...tpl }])
  const updateRow = (setter, idx, key, val) => setter((arr) => arr.map((x, i) => i === idx ? { ...x, [key]: val } : x))

  const submit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      await veterinaryAPI.managerCreateMedicalRecord(petId, { ...form, tests, injections, medications, weightKg: Number(form.weightKg) || null })
      setForm({ visitDate: '', weightKg: '', symptoms: '', diagnosis: '', notes: '' })
      setTests([{ name: '', result: '' }])
      setInjections([{ name: '', dose: '' }])
      setMedications([{ name: '', dose: '', frequency: '', durationDays: '' }])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 680 }}>
      {error && <div style={{ color: '#b00020' }}>{error}</div>}
      <input type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} />
      <input placeholder="Weight (kg)" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value.replace(/[^0-9.]/g, '') })} />
      <input placeholder="Symptoms" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
      <input placeholder="Diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
      <textarea placeholder="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <div>
        <strong>Tests</strong>
        {tests.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input placeholder="Name" value={t.name} onChange={(e) => updateRow(setTests, i, 'name', e.target.value)} />
            <input placeholder="Result" value={t.result} onChange={(e) => updateRow(setTests, i, 'result', e.target.value)} />
          </div>
        ))}
        <button type="button" onClick={() => addRow(setTests, { name: '', result: '' })}>Add Test</button>
      </div>

      <div>
        <strong>Injections</strong>
        {injections.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input placeholder="Name" value={t.name} onChange={(e) => updateRow(setInjections, i, 'name', e.target.value)} />
            <input placeholder="Dose" value={t.dose} onChange={(e) => updateRow(setInjections, i, 'dose', e.target.value)} />
          </div>
        ))}
        <button type="button" onClick={() => addRow(setInjections, { name: '', dose: '' })}>Add Injection</button>
      </div>

      <div>
        <strong>Medications</strong>
        {medications.map((m, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
            <input placeholder="Name" value={m.name} onChange={(e) => updateRow(setMedications, i, 'name', e.target.value)} />
            <input placeholder="Dose" value={m.dose} onChange={(e) => updateRow(setMedications, i, 'dose', e.target.value)} />
            <input placeholder="Frequency" value={m.frequency} onChange={(e) => updateRow(setMedications, i, 'frequency', e.target.value)} />
            <input placeholder="Days" value={m.durationDays} onChange={(e) => updateRow(setMedications, i, 'durationDays', e.target.value.replace(/\D/g, ''))} />
          </div>
        ))}
        <button type="button" onClick={() => addRow(setMedications, { name: '', dose: '', frequency: '', durationDays: '' })}>Add Medication</button>
      </div>

      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Record'}</button>
    </form>
  )
}

export default MedicalRecordForm


