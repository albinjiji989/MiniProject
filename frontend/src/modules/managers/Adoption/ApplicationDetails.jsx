import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, adoptionAPI, resolveMediaUrl } from '../../../services/api'
import OTPInputModal from './OTPInputModal'

const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contractUrl, setContractUrl] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [handover, setHandover] = useState({
    scheduledAt: '',
    notes: '',
    status: 'none'
  })
  const [saving, setSaving] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get(`/adoption/manager/applications/${id}`)
      const data = res.data?.data
      setApp(data)
      setContractUrl(data?.contractURL || '')
      // Fix: Properly initialize handover data from the application
      const handoverData = data?.handover || {}
      setHandover({
        scheduledAt: handoverData.scheduledAt || '',
        notes: handoverData.notes || '',
        status: handoverData.status || 'none'
      })
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load application')
    } finally {
      setLoading(false)
    }
  }

  const generateCertificate = async () => {
    try {
      setSaving(true)
      // 1) Try to fetch existing contract
      let contractURL = ''
      try {
        const resGet = await apiClient.get(`/adoption/manager/certificates/${id}`)
        contractURL = resGet?.data?.data?.contractURL || ''
      } catch (e) {
        // 2) If not found, generate it
        if (e?.response?.status === 404) {
          const resGen = await apiClient.post(`/adoption/manager/certificates`, { applicationId: id })
          contractURL = resGen?.data?.data?.contractURL || ''
        } else {
          throw e
        }
      }

      if (!contractURL) {
        throw new Error('Contract URL not available')
      }

      // 3) Generate certificate with agreementFile
      const res = await adoptionAPI.generateCertificate(id, contractURL)
      const url = res?.data?.data?.agreementFile || res?.data?.data?.contractURL
      if (url) {
        await load()
        alert('Certificate generated successfully')
      }
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Failed to generate certificate')
    } finally {
      setSaving(false)
    }
  }

  const viewCertificate = async () => {
    try {
      setSaving(true)
      // Fix: Use the correct API endpoint - just /manager/... since baseURL includes /api/adoption
      const resp = await apiClient.get(`/adoption/manager/certificates/${id}/file`, { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
    } catch (e) {
      // Fallback: attempt to open provided URL if present
      const resolved = contractUrl ? resolveMediaUrl(contractUrl) : ''
      if (resolved) window.open(resolved, '_blank')
      else alert(e?.response?.data?.error || e?.message || 'Failed to fetch certificate')
    } finally {
      setSaving(false)
    }
  }

  const scheduleHandover = async () => {
    if (!handover.scheduledAt) {
      return alert('Please provide date/time for handover')
    }
    
    // Check prerequisites before attempting to schedule
    if (!canScheduleHandover()) {
      const prereqs = getHandoverPrerequisites()
      let errorMsg = 'Cannot schedule handover. Please ensure:'
      if (!prereqs.isApproved) errorMsg += '\n- Application is approved'
      if (!prereqs.isPaymentCompleted) errorMsg += '\n- Payment is completed'
      if (!prereqs.isContractGenerated) errorMsg += '\n- Contract is generated'
      return alert(errorMsg)
    }
    
    setSaving(true)
    try {
      const response = await apiClient.post(`/adoption/manager/applications/${id}/handover/schedule`, {
        scheduledAt: handover.scheduledAt,
        notes: handover.notes || ''
      })
      await load()
      const message = response?.data?.message || 'Handover scheduled successfully'
      alert(message)
      
      // If email failed to send, show additional warning
      if (response?.data?.emailError) {
        alert(`Warning: ${response.data.emailError}\n\nPlease inform the adopter about their handover details manually.`)
      }
    } catch (e) {
      const errorMessage = e?.response?.data?.error || 'Failed to schedule handover'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const regenerateOTP = async () => {
    if (!window.confirm('Are you sure you want to regenerate the OTP? The adopter will receive a new OTP via email.')) {
      return
    }
    
    setSaving(true)
    try {
      const response = await apiClient.post(`/adoption/manager/applications/${id}/handover/regenerate-otp`)
      const message = response?.data?.message || 'New OTP generated successfully'
      alert(message)
      
      // If email failed to send, show additional warning
      if (response?.data?.emailError) {
        alert(`Warning: ${response.data.emailError}\n\nPlease inform the adopter about their new OTP manually.`)
      }
    } catch (e) {
      const errorMessage = e?.response?.data?.error || 'Failed to regenerate OTP'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!app) return <div className="p-4">Application not found</div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* OTP Modal */}
      <OTPInputModal 
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onSubmit={handleOTPSubmit}
        onRegenerate={handleOTPRegenerate}
        applicationId={id}
        isRegenerating={saving}
      />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Adoption Application</h1>
          <p className="text-gray-600 mt-1">Application ID: #{app._id?.slice(-8)}</p>
        </div>
        <button 
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          onClick={() => navigate('/manager/adoption/applications')}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Applications
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{app.petId?.name}</h2>
                <p className="text-gray-600 mt-1">{app.petId?.breed} • {app.petId?.species}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex space-x-2">
                  {getStatusBadge(app.status)}
                  {getPaymentBadge(app.paymentStatus)}
                  {getHandoverBadge(app.handover?.status)}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Applied on {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Adoption Fee</p>
                <p className="text-lg font-semibold text-gray-900">₹{app.petId?.adoptionFee || 0}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Pet Age</p>
                <p className="text-lg font-semibold text-gray-900" title={`${app.petId?.age || 0} ${app.petId?.ageUnit || 'months'}`}>
                  {app.petId?.ageDisplay || 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Gender</p>
                <p className="text-lg font-semibold text-gray-900">
                  {app.petId?.gender ? app.petId.gender.charAt(0).toUpperCase() + app.petId.gender.slice(1) : 'N/A'}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{app.status}</p>
              </div>
            </div>
            
            {/* Additional Pet Details */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Species</p>
                <p className="text-lg font-semibold text-gray-900">{app.petId?.species || 'N/A'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Breed</p>
                <p className="text-lg font-semibold text-gray-900">{app.petId?.breed || 'N/A'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Health Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {app.petId?.healthStatus?.replace(/_/g, ' ') || 'N/A'}
                </p>
              </div>
            </div>

          </div>

          {/* Applicant Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Full Name</h4>
                <p className="text-gray-900">{app.userId?.name || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Email Address</h4>
                <p className="text-gray-900">{app.userId?.email || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h4>
                <p className="text-gray-900">{app.applicationData?.phone || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Home Type</h4>
                <p className="text-gray-900">{app.applicationData?.homeType || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Has Garden</h4>
                <p className="text-gray-900">{app.applicationData?.hasGarden ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Has Other Pets</h4>
                <p className="text-gray-900">{app.applicationData?.hasOtherPets ? 'Yes' : 'No'}</p>
              </div>
              {app.applicationData?.hasOtherPets && app.applicationData?.otherPetsDetails && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Other Pets Details</h4>
                  <p className="text-gray-900">{app.applicationData.otherPetsDetails}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                <p className="text-gray-900">
                  {app.applicationData?.address?.street ? 
                    `${app.applicationData.address.street}, ${app.applicationData.address.city}, ${app.applicationData.address.state} - ${app.applicationData.address.pincode}` : 
                    'N/A'}
                </p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Work Schedule</h4>
                <p className="text-gray-900">{app.applicationData?.workSchedule || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Time at Home</h4>
                <p className="text-gray-900">{app.applicationData?.timeAtHome || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Pet Experience</h4>
                <p className="text-gray-900">{app.applicationData?.petExperience || 'N/A'}</p>
              </div>
              {app.applicationData?.previousPets && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Previous Pets</h4>
                  <p className="text-gray-900">{app.applicationData.previousPets}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Reason for Adoption</h4>
                <p className="text-gray-900">{app.applicationData?.adoptionReason || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Expectations</h4>
                <p className="text-gray-900">{app.applicationData?.expectations || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Documents</h3>
            {getApplicantDocuments().length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No documents uploaded by applicant</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getApplicantDocuments().map((doc, index) => {
                  // Handle different document formats
                  const docObj = typeof doc === 'string' ? { url: doc } : doc;
                  const url = docObj?.url || '';
                  const name = docObj?.name || url.split('/').pop() || `Document ${index + 1}`;
                  const type = docObj?.type || (url.endsWith('.pdf') ? 'application/pdf' : 'image');
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {type === 'application/pdf' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          )}
                        </svg>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <a 
                          href={resolveMediaUrl(url)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </a>
                        <a 
                          href={resolveMediaUrl(url)} 
                          download={name}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Review Actions */}
          {app.status === 'pending' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Application</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please review this application and either approve or reject it. 
                The applicant is waiting for your decision.
              </p>
              <div className="space-y-3">
                <button 
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  onClick={async () => {
                    const notes = prompt('Add any notes for approval (optional):')
                    if (notes !== null) {
                      try {
                        setSaving(true)
                        await apiClient.patch(`/adoption/manager/applications/${id}`, {
                          status: 'approved',
                          notes: notes || ''
                        })
                        await load()
                        // Instead of showing an alert, show a more user-friendly message
                        // and avoid any immediate redirects or reloads that might cause token issues
                        setTimeout(() => {
                          alert('Application approved successfully')
                        }, 100)
                      } catch (e) {
                        // Handle error without causing redirects
                        setTimeout(() => {
                          alert(e?.response?.data?.error || 'Failed to approve application')
                        }, 100)
                      } finally {
                        setSaving(false)
                      }
                    }
                  }}
                  disabled={saving}
                >
                  {saving ? 'Approving...' : 'Approve Application'}
                </button>
                <button 
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  onClick={async () => {
                    const reason = prompt('Reason for rejection:')
                    if (reason) {
                      try {
                        setSaving(true)
                        await apiClient.patch(`/adoption/manager/applications/${id}`, {
                          status: 'rejected',
                          reason: reason
                        })
                        await load()
                        alert('Application rejected')
                      } catch (e) {
                        alert(e?.response?.data?.error || 'Failed to reject application')
                      } finally {
                        setSaving(false)
                      }
                    }
                  }}
                  disabled={saving}
                >
                  {saving ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </div>
          )}

          {/* Certificate & Contract */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate & Contract</h3>
            {app.contractURL ? (
              <div className="space-y-4">
                <div className="flex items-center text-green-700">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Contract Generated</span>
                </div>
                <div className="flex flex-col space-y-3">
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                      saving ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`} 
                    disabled={saving} 
                    onClick={viewCertificate}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {saving ? 'Opening...' : 'View Contract'}
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                      saving ? 'bg-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`} 
                    disabled={saving} 
                    onClick={generateCertificate}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {saving ? 'Regenerating...' : 'Regenerate Certificate'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-600">
                  <p className="mb-3">Generate contract and certificate before scheduling handover</p>
                  <p className="text-sm text-gray-500">This can only be done after the adopter has completed payment.</p>
                </div>
                <button 
                  className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                    saving ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`} 
                  disabled={saving} 
                  onClick={generateCertificate}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {saving ? 'Generating...' : 'Generate Certificate'}
                </button>
              </div>
            )}
          </div>

          {/* Handover Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Handover Management</h3>
            
            {(!app.handover || app.handover.status === 'none') && (
              <div className="space-y-4">
                {canScheduleHandover() ? (
                  <>
                    <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium">Schedule Handover</div>
                      <div className="mt-1">Schedule the handover appointment for the adopter.</div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input 
                          type="datetime-local" 
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          value={handover.scheduledAt ? new Date(handover.scheduledAt).toISOString().slice(0, 16) : ''} 
                          onChange={e=>setHandover(h=>({ ...h, scheduledAt: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes</label>
                        <textarea 
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          rows={3} 
                          value={handover.notes||''} 
                          onChange={e=>setHandover(h=>({ ...h, notes: e.target.value }))}
                          placeholder="Any special instructions for the adopter"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-amber-50 p-3 rounded-lg">
                      Note: An OTP will be generated and sent to the adopter's email upon scheduling.
                      The adopter must present this OTP at the adoption center to receive the pet.
                    </div>
                    <button 
                      className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                        saving ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`} 
                      disabled={saving} 
                      onClick={scheduleHandover}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {saving ? 'Scheduling...' : 'Schedule Handover'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                      <div className="font-medium">Handover Prerequisites</div>
                      <div className="mt-2">Please complete the following steps before scheduling handover:</div>
                    </div>
                    <div className="space-y-2">
                      <div className={`flex items-center ${getHandoverPrerequisites().isApproved ? 'text-green-600' : 'text-gray-600'}`}>
                        {getHandoverPrerequisites().isApproved ? (
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span>Application must be approved</span>
                        {app.status === 'pending' && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending Review</span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Rejected</span>
                        )}
                        {getHandoverPrerequisites().isApproved && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                        )}
                      </div>
                      <div className={`flex items-center ${getHandoverPrerequisites().isPaymentCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                        {getHandoverPrerequisites().isPaymentCompleted ? (
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span>Adoption payment must be completed</span>
                        {app.paymentStatus && app.paymentStatus !== 'completed' && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded capitalize">
                            {app.paymentStatus === 'processing' ? 'Processing' : 'Not Completed'}
                          </span>
                        )}
                        {getHandoverPrerequisites().isPaymentCompleted && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                        )}
                      </div>
                      <div className={`flex items-center ${getHandoverPrerequisites().isContractGenerated ? 'text-green-600' : 'text-gray-600'}`}>
                        {getHandoverPrerequisites().isContractGenerated ? (
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span>Contract/Certificate must be generated</span>
                        {getHandoverPrerequisites().isContractGenerated && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                        )}
                      </div>
                    </div>
                    {!getHandoverPrerequisites().isApproved && (
                      <div className="text-xs text-gray-500 mt-2">
                        {app.status === 'pending' 
                          ? 'Please review and approve this application first.' 
                          : app.status === 'rejected' 
                            ? 'This application has been rejected and cannot be scheduled for handover.' 
                            : 'Application approval is required before proceeding.'}
                      </div>
                    )}
                    {getHandoverPrerequisites().isApproved && !getHandoverPrerequisites().isPaymentCompleted && (
                      <div className="text-xs text-gray-500 mt-2">
                        The adopter must complete the adoption payment before handover can be scheduled.
                      </div>
                    )}
                    {getHandoverPrerequisites().isApproved && getHandoverPrerequisites().isPaymentCompleted && !getHandoverPrerequisites().isContractGenerated && (
                      <div className="text-xs text-gray-500 mt-2">
                        Generate the contract/certificate after payment is completed.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {app.handover && app.handover.status === 'scheduled' && (
              <div className="space-y-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="font-medium text-green-800 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Handover Scheduled
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    The adopter has been notified and will receive the pet at the adoption center.
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Scheduled Date</span>
                    <span className="text-sm font-medium">
                      {app.handover.scheduledAt ? new Date(app.handover.scheduledAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Location</span>
                    <span className="text-sm font-medium text-right">Adoption Center - Main Branch<br/>123 Pet Welfare Road, Animal City</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Contact</span>
                    <span className="text-sm font-medium">+91-9876543210</span>
                  </div>
                  {app.handover.notes && (
                    <div>
                      <span className="text-sm text-gray-500">Notes</span>
                      <p className="text-sm font-medium mt-1">{app.handover.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      value={handover.scheduledAt ? new Date(handover.scheduledAt).toISOString().slice(0, 16) : ''} 
                      onChange={e=>setHandover(h=>({ ...h, scheduledAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Notes</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      rows={2} 
                      value={handover.notes||''} 
                      onChange={e=>setHandover(h=>({ ...h, notes: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                      saving ? 'bg-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`} 
                    disabled={saving} 
                    onClick={completeHandover}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {saving ? 'Completing...' : 'Complete Handover (Requires OTP)'}
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                      saving ? 'bg-gray-400' : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`} 
                    disabled={saving} 
                    onClick={regenerateOTP}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {saving ? 'Regenerating...' : 'Regenerate OTP'}
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                      saving ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`} 
                    disabled={saving} 
                    onClick={updateHandover}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {saving ? 'Updating...' : 'Update Schedule'}
                  </button>
                </div>
                
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                  Note: To complete the handover, you must verify the OTP provided by the adopter.
                  This ensures the pet is actually transferred to the new owner.
                </div>
              </div>
            )}
            
            {app.handover && app.handover.status === 'completed' && (
              <div className="text-sm bg-green-50 p-4 rounded-lg">
                <div className="font-medium text-green-800 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Handover Completed
                </div>
                <div className="text-green-700 mt-2">
                  The handover was completed on {app.handoverCompletedAt ? new Date(app.handoverCompletedAt).toLocaleString() : 'recently'}.
                  The pet is now officially owned by {app.userId?.name} and will appear in their dashboard.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationDetails