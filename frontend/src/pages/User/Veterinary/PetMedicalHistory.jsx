import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { veterinaryAPI } from '../../../services/api'

const PetMedicalHistory = () => {
  const { petId } = useParams()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await veterinaryAPI.userListMedicalRecordsForPet(petId)
        if (!mounted) return
        setRecords(res.data?.data?.records || [])
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load medical history')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [petId])

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>

  return (
    <div style={{ padding: 24 }}>
      <h2>Medical History</h2>
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
      {records.length === 0 ? <div>No records found.</div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {records.map(r => (
            <div key={r._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div><strong>Date:</strong> {new Date(r.visitDate).toLocaleDateString()}</div>
              {r.weightKg && <div><strong>Weight:</strong> {r.weightKg} kg</div>}
              {r.symptoms && <div><strong>Symptoms:</strong> {r.symptoms}</div>}
              {r.diagnosis && <div><strong>Diagnosis:</strong> {r.diagnosis}</div>}
              {Array.isArray(r.tests) && r.tests.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <strong>Tests:</strong>
                  <ul>
                    {r.tests.map((t, i) => <li key={i}>{t.name}: {t.result}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(r.injections) && r.injections.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <strong>Injections:</strong>
                  <ul>
                    {r.injections.map((t, i) => <li key={i}>{t.name} ({t.dose})</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(r.medications) && r.medications.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <strong>Medications:</strong>
                  <ul>
                    {r.medications.map((m, i) => <li key={i}>{m.name} - {m.dose} - {m.frequency} - {m.durationDays} days</li>)}
                  </ul>
                </div>
              )}
              {r.notes && <div style={{ marginTop: 6 }}><strong>Notes:</strong> {r.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PetMedicalHistory


