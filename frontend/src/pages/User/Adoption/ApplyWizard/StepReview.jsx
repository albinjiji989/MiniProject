import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adoptionAPI } from '../../../../services/api'

const KEY = 'adopt_apply_wizard'

export default function StepReview() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } })

  // Always sync petId from URL if present to avoid stale localStorage
  useEffect(() => {
    const pid = params.get('petId')
    if (!pid) return
    const applicant = data.applicant || {}
    if (applicant.petId !== pid) {
      const next = { ...data, applicant: { ...applicant, petId: pid } }
      localStorage.setItem(KEY, JSON.stringify(next))
      setData(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const back = () => navigate('/User/adoption/apply/documents')

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const applicant = data.applicant || {}
      const home = data.home || {}
      const exp = data.experience || {}
      const docs = data.documents || {}

      if (!applicant.petId) throw new Error('Missing petId. Start from the pet details page (Apply/Adopt button) or reopen the wizard from a pet listing.')

      // Normalize legacy values from older UI versions
      const normalizeExp = (v) => {
        if (!v) return 'none'
        const map = { beginner: 'some', intermediate: 'some', advanced: 'extensive' }
        return map[v] || v
      }
      const normalizeWork = (v) => {
        if (!v) return 'full_time'
        const map = { remote: 'work_from_home', flexible: 'work_from_home' }
        return map[v] || v
      }
      const normalizeTimeAtHome = (v) => {
        if (!v) return '4_8_hours'
        const map = { less_4_hours: 'less_than_4_hours', more_8_hours: '8_12_hours' }
        return map[v] || v
      }

      const workSchedule = normalizeWork(home.workSchedule)
      const timeAtHome = normalizeTimeAtHome(home.timeAtHome)
      const petExperience = normalizeExp(exp.petExperience)

      // Basic front-end required checks
      if (!workSchedule || !timeAtHome || !petExperience) {
        throw new Error('Please complete Home and Experience steps (Work schedule, Time at home, Experience).')
      }

      // Debug and validate petId
      const petId = applicant.petId;
      console.log('StepReview: submitting with petId =', petId)
      console.log('StepReview: petId length =', petId?.length)
      console.log('StepReview: full applicant data =', applicant)
      
      if (!petId || typeof petId !== 'string' || petId.length !== 24) {
        throw new Error(`Invalid pet ID: "${petId}". Please start the application from the pet details page.`);
      }

      const payload = {
        petId: petId,
        documents: (docs.documents || []).map(u => ({ url: u })),
        applicationData: {
          fullName: applicant.fullName,
          email: applicant.email,
          phone: applicant.phone,
          address: home.address || {},
          homeType: home.homeType,
          hasGarden: !!home.hasGarden,
          hasOtherPets: !!home.hasOtherPets,
          otherPetsDetails: home.otherPetsDetails || '',
          workSchedule,
          timeAtHome,
          petExperience,
          previousPets: exp.previousPets,
          adoptionReason: exp.adoptionReason,
          expectations: exp.expectations,
        }
      }

      await adoptionAPI.submitRequest(payload)
      localStorage.removeItem(KEY)
      navigate('/User/adoption/applications')
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const applicant = data.applicant || {}
  const home = data.home || {}
  const exp = data.experience || {}
  const docs = data.documents || {}

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Applicant</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Name:</strong> {applicant.fullName || '-'}</li>
            <li><strong>Email:</strong> {applicant.email || '-'}</li>
            <li><strong>Phone:</strong> {applicant.phone || '-'}</li>
            <li><strong>Pet ID:</strong> {applicant.petId || '-'}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Home</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Type:</strong> {home.homeType || '-'}</li>
            <li><strong>Garden:</strong> {home.hasGarden ? 'Yes' : 'No'}</li>
            <li><strong>Other Pets:</strong> {home.hasOtherPets ? 'Yes' : 'No'}</li>
            <li><strong>Other Pets Details:</strong> {home.otherPetsDetails || '-'}</li>
            <li><strong>Work:</strong> {home.workSchedule || '-'}</li>
            <li><strong>Time at Home:</strong> {home.timeAtHome || '-'}</li>
            <li><strong>Address:</strong> {`${home.address?.street || ''} ${home.address?.city || ''} ${home.address?.state || ''} ${home.address?.pincode || ''} ${home.address?.country || ''}`.trim()}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Experience</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Experience:</strong> {exp.petExperience || '-'}</li>
            <li><strong>Previous Pets:</strong> {exp.previousPets || '-'}</li>
            <li><strong>Reason:</strong> {exp.adoptionReason || '-'}</li>
            <li><strong>Expectations:</strong> {exp.expectations || '-'}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Documents</h3>
          <ul className="text-sm space-y-1">
            {(docs.documents || []).map((u, i) => (
              <li key={i}><a className="text-blue-600 underline" href={u} target="_blank" rel="noreferrer">{u}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex justify-between">
        <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={back} disabled={submitting}>Back</button>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</button>
      </div>
    </div>
  )
}
