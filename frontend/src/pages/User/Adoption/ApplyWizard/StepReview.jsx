import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adoptionAPI, resolveMediaUrl } from '../../../../services/api'

const KEY = 'adopt_apply_wizard'

export default function StepReview() {
  const navigate = useNavigate()
  const { petId } = useParams()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(() => { 
    try { 
      const rawData = localStorage.getItem(KEY);
      const parsedData = JSON.parse(rawData) || {};
      console.log('Raw parsed data:', parsedData);
      
      // Convert uploadedAt strings back to Date objects in documents
      if (parsedData.documents && Array.isArray(parsedData.documents)) {
        console.log('Converting documents:', parsedData.documents);
        parsedData.documents = parsedData.documents.map(doc => ({
          ...doc,
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date()
        }));
        console.log('Converted documents:', parsedData.documents);
      }


      return parsedData;
    } catch (err) { 
      console.error('Error parsing localStorage data:', err);
      return {} 
    } 
  })
  const [petData, setPetData] = useState(null)

  // Always sync petId from URL if present to avoid stale localStorage
  useEffect(() => {
    if (!petId) return
    const applicant = data.applicant || {}
    if (applicant.petId !== petId) {
      const next = { ...data, applicant: { ...applicant, petId: petId } }
      localStorage.setItem(KEY, JSON.stringify(next))
      setData(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId])
  
  // Fetch pet data to display pet code
  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const applicant = data.applicant || {}
        const petId = applicant.petId
        if (petId) {
          const petResponse = await adoptionAPI.getPet(petId);
          if (petResponse?.data?.data) {
            console.log('Pet data received:', petResponse.data.data);
            setPetData(petResponse.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pet data:', err);
      }
    };
    
    fetchPetData();
  }, [data.applicant?.petId]);

  const back = () => navigate(`/User/adoption/wizard/${petId}/documents`)

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const applicant = data.applicant || {}
      const home = data.home || {}
      const exp = data.experience || {}
      const docs = data.documents || []
      console.log('Documents data:', docs, 'Type:', typeof docs, 'Is array:', Array.isArray(docs))

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

      // Validate petId - more flexible validation
      const petId = applicant.petId;
      console.log('StepReview: submitting with petId =', petId)
      
      if (!petId || typeof petId !== 'string' || petId.trim().length === 0) {
        throw new Error('Invalid pet ID. Please start the application from the pet details page.')
      }

      // Additional validation: Check if pet exists before submitting
      try {
        const petResponse = await adoptionAPI.getPet(petId.trim());
        if (!petResponse?.data?.data) {
          throw new Error(`Pet with ID ${petId} not found. The pet may have been adopted or removed.`);
        }
        // Additional check to ensure pet is available
        const petData = petResponse.data.data;
        if (!petData.isActive) {
          throw new Error(`Pet with ID ${petId} is not currently active in the system.`);
        }
        if (petData.status !== 'available') {
          throw new Error(`Pet with ID ${petId} is not currently available for adoption. Current status: ${petData.status || 'unknown'}.`);
        }
      } catch (petError) {
        console.error('Pet validation error:', petError);
        // Provide more specific error message based on the error type
        if (petError?.response?.status === 404) {
          throw new Error(`Pet with ID ${petId} not found. The pet may have been adopted by another user, removed by the adoption manager, or the link you're using may be outdated. Please go back to the pet listings and select a currently available pet.`);
        } else if (petError?.response?.status === 403) {
          throw new Error(`Access denied to pet with ID ${petId}. This may happen if you don't have permission to view this pet.`);
        } else if (petError.message.includes('not currently available')) {
          throw petError; // Re-throw specific availability errors
        } else if (petError.message.includes('not currently active')) {
          throw petError; // Re-throw specific active status errors
        } else {
          throw new Error(`Unable to validate pet with ID ${petId}. ${petError?.response?.data?.error || petError.message || 'Please check your connection and try again.'}`);
        }
      }

      // Ensure documents is a proper array of objects
      const cleanDocs = Array.isArray(docs) ? docs.map(doc => ({
        ...doc,
        // Ensure uploadedAt is properly serialized
        uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : doc.uploadedAt
      })) : [];
      
      const payload = {
        petId: petId.trim(),
        documents: cleanDocs,
        applicationData: {
          fullName: applicant.fullName,
          email: applicant.email,
          phone: applicant.phone,
          address: home.address || {},
          homeType: home.homeType || 'apartment',
          hasGarden: !!home.hasGarden,
          hasOtherPets: !!home.hasOtherPets,
          otherPetsDetails: home.otherPetsDetails || '',
          workSchedule,
          timeAtHome,
          petExperience,
          previousPets: exp.previousPets || '',
          adoptionReason: exp.adoptionReason || '',
          expectations: exp.expectations || '',
        }
      }


      await adoptionAPI.submitRequest(payload)
      localStorage.removeItem(KEY)
      navigate('/User/adoption/applications')
    } catch (e) {
      // More detailed error handling
      const errorMessage = e?.response?.data?.error || e.message || 'Failed to submit application'
      setError(errorMessage)
      console.error('Adoption application error:', e)
      
      // If it's a pet not found error, provide additional guidance
      if (errorMessage.includes('not found') || errorMessage.includes('Pet ID') || errorMessage.includes('validate pet')) {
        setError(`${errorMessage} This may happen if the pet was removed, adopted by another user, or if you're using an outdated link. Please go back to the pet listings and select a currently available pet.`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const applicant = data.applicant || {}
  const home = data.home || {}
  const exp = data.experience || {}
  const docs = data.documents || []


  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm p-3 bg-red-50 rounded border border-red-200">
          <div className="font-medium">Error:</div>
          <div>{error}</div>
          {(error.includes('not found') || error.includes('Pet ID') || error.includes('validate pet') || error.includes('available') || error.includes('active')) && (
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="font-medium text-blue-800 mb-2">Next Steps:</div>
              <ul className="list-disc pl-5 space-y-1 text-blue-700">
                <li>Go back to the pet listings and select a currently available pet</li>
                <li>Use the Debug Pet Issues tool to check if a pet exists</li>
                <li>Reload the page to ensure you have the latest data</li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  onClick={() => navigate('/User/adoption')} 
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  ← Back to Pet Listings
                </button>
                <button 
                  onClick={() => navigate('/User/adoption/debug')} 
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Debug Pet Issues
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Applicant</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Name:</strong> {applicant.fullName || '-'}</li>
            <li><strong>Email:</strong> {applicant.email || '-'}</li>
            <li><strong>Phone:</strong> {applicant.phone || '-'}</li>
            <li><strong>Pet Code:</strong> {petData?.petCode || petData?.code || applicant.petId || '-'}</li>
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
            {(docs || []).map((doc, i) => (
              <li key={i}>
                <a className="text-blue-600 underline" href={typeof doc === 'string' ? doc : doc?.url} target="_blank" rel="noreferrer">
                  {typeof doc === 'string' ? doc : (doc?.name || 'Document')}
                </a>
              </li>
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