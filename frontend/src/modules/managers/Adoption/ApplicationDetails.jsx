import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, adoptionAPI, resolveMediaUrl } from '../../../services/api'

const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contractUrl, setContractUrl] = useState('')

  const defaultHandover = {
    scheduledAt: '',
    notes: '',
    status: 'none'
  }

  const [handover, setHandover] = useState(defaultHandover)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get(`/adoption/manager/applications/${id}`)
      const data = res.data?.data
      setApp(data)
      setContractUrl(data?.contractURL || '')
      setHandover({
        ...defaultHandover,
        ...(data?.handover || {})
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
        const resGet = await apiClient.get(`/adoption/manager/contracts/${id}`)
        contractURL = resGet?.data?.data?.contractURL || ''
      } catch (e) {
        // 2) If not found, generate it
        if (e?.response?.status === 404) {
          const resGen = await apiClient.post(`/adoption/manager/contracts/generate/${id}`)
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
      // Directly stream from backend to avoid CORS
      const resp = await apiClient.get(`/adoption/certificates/${id}/file`, { responseType: 'blob' })
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
      await apiClient.post(`/adoption/manager/applications/${id}/handover/schedule`, {
        scheduledAt: handover.scheduledAt,
        notes: handover.notes || ''
      })
      await load()
      alert('Handover scheduled. OTP has been sent to the adopter\'s email.')
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to schedule handover')
    } finally {
      setSaving(false)
    }
  }

  const updateHandover = async () => {
    setSaving(true)
    try {
      await apiClient.patch(`/adoption/manager/applications/${id}/handover`, {
        scheduledAt: handover.scheduledAt,
        notes: handover.notes
      })
      await load()
      alert('Handover updated')
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to update handover')
    } finally {
      setSaving(false)
    }
  }

  const completeHandover = async () => {
    const otp = prompt('Enter the OTP provided by the adopter:')
    if (!otp) return
    
    setSaving(true)
    try {
      await apiClient.post(`/adoption/manager/applications/${id}/handover/complete`, {
        otp: otp
      })
      await load()
      alert('Handover completed and ownership transferred')
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to complete handover')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!app) return <div className="p-4">Application not found</div>

  // Get application status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Pending Review', bg: 'bg-yellow-100', textClass: 'text-yellow-800' },
      approved: { text: 'Approved', bg: 'bg-green-100', textClass: 'text-green-800' },
      rejected: { text: 'Rejected', bg: 'bg-red-100', textClass: 'text-red-800' }
    }
    const statusInfo = statusMap[status] || { text: status, bg: 'bg-gray-100', textClass: 'text-gray-800' }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.textClass}`}>
        {statusInfo.text}
      </span>
    )
  }

  // Get payment status badge
  const getPaymentBadge = (status) => {
    const statusMap = {
      processing: { text: 'Processing', bg: 'bg-yellow-100', textClass: 'text-yellow-800' },
      completed: { text: 'Completed', bg: 'bg-green-100', textClass: 'text-green-800' },
      failed: { text: 'Failed', bg: 'bg-red-100', textClass: 'text-red-800' }
    }
    const statusInfo = statusMap[status] || { text: 'Not Started', bg: 'bg-gray-100', textClass: 'text-gray-800' }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.textClass}`}>
        {statusInfo.text}
      </span>
    )
  }

  // Get handover status badge
  const getHandoverBadge = (status) => {
    const statusMap = {
      none: { text: 'Not Scheduled', bg: 'bg-gray-100', textClass: 'text-gray-800' },
      scheduled: { text: 'Scheduled', bg: 'bg-blue-100', textClass: 'text-blue-800' },
      completed: { text: 'Completed', bg: 'bg-green-100', textClass: 'text-green-800' }
    }
    const statusInfo = statusMap[status] || { text: status, bg: 'bg-gray-100', textClass: 'text-gray-800' }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.textClass}`}>
        {statusInfo.text}
      </span>
    )
  }

  // Get applicant documents
  const getApplicantDocuments = () => {
    const d1 = Array.isArray(app?.documents) ? app.documents : []
    const d2 = Array.isArray(app?.applicationData?.documents) ? app.applicationData.documents : []
    return [...d1, ...d2]
  }

  // Check if handover can be scheduled
  const canScheduleHandover = () => {
    return (
      app.status === 'approved' &&
      app.paymentStatus === 'completed' &&
      app.contractURL
    )
  }

  // Get handover prerequisites status
  const getHandoverPrerequisites = () => {
    return {
      isApproved: app.status === 'approved',
      isPaymentCompleted: app.paymentStatus === 'completed',
      isContractGenerated: !!app.contractURL
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
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
                <p className="text-lg font-semibold text-gray-900">{app.petId?.ageDisplay || 'N/A'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Gender</p>
                <p className="text-lg font-semibold text-gray-900">{app.petId?.gender || 'N/A'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{app.status}</p>
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
                <h4 className="text-sm font-medium text-gray-500 mb-1">Has Children</h4>
                <p className="text-gray-900">{app.applicationData?.hasChildren ? 'Yes' : 'No'}</p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                <p className="text-gray-900">
                  {app.applicationData?.address?.street ? 
                    `${app.applicationData.address.street}, ${app.applicationData.address.city}, ${app.applicationData.address.state} - ${app.applicationData.address.pincode}` : 
                    'N/A'}
                </p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Adoption Reason</h4>
                <p className="text-gray-900">{app.applicationData?.adoptionReason || 'N/A'}</p>
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
                  const url = typeof doc === 'string' ? doc : (doc?.url || '')
                  const name = doc?.name || url.split('/').pop() || `Document ${index + 1}`
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{name}</span>
                      </div>
                      <a 
                        href={resolveMediaUrl(url)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </a>
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
                        await apiClient.patch(`/adoption/requests/${id}`, {
                          status: 'approved',
                          notes: notes || ''
                        })
                        await load()
                        alert('Application approved successfully')
                      } catch (e) {
                        alert(e?.response?.data?.error || 'Failed to approve application')
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
                        await apiClient.patch(`/adoption/requests/${id}`, {
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
                          value={handover.scheduledAt} 
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
                      </div>
                    </div>
                    {!getHandoverPrerequisites().isApproved && app.status === 'pending' && (
                      <div className="text-xs text-gray-500 mt-2">
                        Please review and approve this application first.
                      </div>
                    )}
                    {!getHandoverPrerequisites().isPaymentCompleted && getHandoverPrerequisites().isApproved && (
                      <div className="text-xs text-gray-500 mt-2">
                        The adopter must complete the adoption payment before handover can be scheduled.
                      </div>
                    )}
                    {!getHandoverPrerequisites().isContractGenerated && getHandoverPrerequisites().isPaymentCompleted && (
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
                      {handover.scheduledAt ? new Date(handover.scheduledAt).toLocaleString() : 'N/A'}
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
                  {handover.notes && (
                    <div>
                      <span className="text-sm text-gray-500">Notes</span>
                      <p className="text-sm font-medium mt-1">{handover.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      value={handover.scheduledAt} 
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