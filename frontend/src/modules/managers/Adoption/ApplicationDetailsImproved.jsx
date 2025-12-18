import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, adoptionAPI, resolveMediaUrl } from '../../../services/api'
import OTPInputModal from './OTPInputModal'

const ApplicationDetailsImproved = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contractUrl, setContractUrl] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const defaultHandover = {
    scheduledAt: '',
    notes: '',
    status: 'none'
  }

  const [handover, setHandover] = useState(defaultHandover)
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
          // Check if payment is completed before generating contract
          if (app.paymentStatus !== 'completed') {
            throw new Error('Payment must be completed before generating contract')
          }
          
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
      
      // Automatically switch to the Actions tab to make it easier for managers to complete handover
      setActiveTab('actions')
      
      // Show a more prominent notification about the next step
      setTimeout(() => {
        const nextStep = confirm("Handover scheduled successfully! An OTP has been sent to the adopter's email.\n\nClick OK to open the OTP entry form now, or Cancel to do it later.");
        if (nextStep) {
          // Automatically show the OTP modal
          setShowOTPModal(true);
        }
      }, 500);
      
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

  // Add approve application function
  const approveApplication = async () => {
    const notes = prompt('Add any notes for approval (optional):')
    if (notes !== null) {
      try {
        setSaving(true)
        await adoptionAPI.managerPatchRequest(id, {
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
  }

  // Add reject application function
  const rejectApplication = async () => {
    const reason = prompt('Reason for rejection:')
    if (reason) {
      try {
        setSaving(true)
        await adoptionAPI.managerPatchRequest(id, {
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
  }

  useEffect(() => { load() }, [id])

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
  
  if (error) return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">Error</h3>
        </div>
        <div className="mt-2 text-red-700">
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/manager/adoption/applications')}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Back to Applications
          </button>
        </div>
      </div>
    </div>
  )
  
  if (!app) return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800">Application Not Found</h3>
        </div>
        <div className="mt-2 text-yellow-700">
          <p>The requested adoption application could not be found.</p>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/manager/adoption/applications')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Back to Applications
          </button>
        </div>
      </div>
    </div>
  )

  // Get application status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Pending Review', bg: 'bg-yellow-100', textClass: 'text-yellow-800' },
      approved: { text: 'Approved', bg: 'bg-green-100', textClass: 'text-green-800' },
      rejected: { text: 'Rejected', bg: 'bg-red-100', textClass: 'text-red-800' },
      payment_pending: { text: 'Payment Pending', bg: 'bg-orange-100', textClass: 'text-orange-800' },
      payment_completed: { text: 'Payment Completed', bg: 'bg-blue-100', textClass: 'text-blue-800' },
      completed: { text: 'Completed', bg: 'bg-purple-100', textClass: 'text-purple-800' }
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
      pending: { text: 'Not Started', bg: 'bg-gray-100', textClass: 'text-gray-800' },
      processing: { text: 'Processing', bg: 'bg-yellow-100', textClass: 'text-yellow-800' },
      completed: { text: 'Completed', bg: 'bg-green-100', textClass: 'text-green-800' },
      failed: { text: 'Failed', bg: 'bg-red-100', textClass: 'text-red-800' }
    }
    const statusInfo = statusMap[status] || { text: 'Unknown', bg: 'bg-gray-100', textClass: 'text-gray-800' }
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
      (app?.status === 'approved' || app?.status === 'completed' || app?.status === 'payment_completed') &&
      app?.paymentStatus === 'completed' &&
      app?.contractURL
    )
  }

  // Get handover prerequisites status
  const getHandoverPrerequisites = () => {
    return {
      isApproved: (app?.status === 'approved' || app?.status === 'completed' || app?.status === 'payment_completed'),
      isPaymentCompleted: app?.paymentStatus === 'completed',
      isContractGenerated: !!app?.contractURL
    }
  }

  const completeHandover = async () => {
    // Show OTP modal instead of prompt
    setShowOTPModal(true)
  }

  const handleOTPSubmit = async (otp) => {
    setSaving(true)
    try {
      // Fix: Use the correct API endpoint - just /manager/... since baseURL includes /api/adoption
      const response = await apiClient.post(`/adoption/manager/applications/${id}/handover/complete`, {
        otp: otp
      })
      await load()
      const message = response?.data?.message || 'Handover completed successfully'
      alert(message)
      setShowOTPModal(false)
    } catch (e) {
      const errorMessage = e?.response?.data?.error || 'Failed to complete handover'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleOTPRegenerate = async () => {
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

  // Add the missing updateHandover function
  const updateHandover = async () => {
    if (!handover.scheduledAt) {
      return alert('Please provide date/time for handover')
    }
    
    setSaving(true)
    try {
      const response = await apiClient.post(`/adoption/manager/applications/${id}/handover/schedule`, {
        scheduledAt: handover.scheduledAt,
        notes: handover.notes || ''
      })
      await load()
      const message = response?.data?.message || 'Handover updated successfully'
      alert(message)
      
      // If email failed to send, show additional warning
      if (response?.data?.emailError) {
        alert(`Warning: ${response.data.emailError}\n\nPlease inform the adopter about their updated handover details manually.`)
      }
    } catch (e) {
      const errorMessage = e?.response?.data?.error || 'Failed to update handover'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Adoption Application</h1>
          <p className="text-gray-600 mt-1">Application ID: #{app._id?.slice(-8)}</p>
        </div>
        <button 
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center whitespace-nowrap"
          onClick={() => navigate('/manager/adoption/applications')}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Applications
        </button>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {getStatusBadge(app.status)}
        {getPaymentBadge(app.paymentStatus)}
        {getHandoverBadge(app.handover?.status)}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'applicant', name: 'Applicant Info' },
            { id: 'pet', name: 'Pet Details' },
            { id: 'documents', name: 'Documents' },
            { id: 'actions', name: 'Actions' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pet Information Card */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pet Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{app.petId?.name || 'N/A'}</h4>
                      <p className="text-gray-500">{app.petId?.breed || 'N/A'} • {app.petId?.species || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Adoption Fee</p>
                      <p className="text-lg font-semibold text-gray-900">₹{app.petId?.adoptionFee || 0}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Age</p>
                      <p className="text-lg font-semibold text-gray-900">{app.petId?.ageDisplay || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Gender</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {app.petId?.gender ? app.petId.gender.charAt(0).toUpperCase() + app.petId.gender.slice(1) : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Health Status</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {app.petId?.healthStatus?.replace(/_/g, ' ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Application Details Card */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{app.userId?.name || 'N/A'}</h4>
                      <p className="text-gray-500">{app.userId?.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-500">Applied On</span>
                      <span className="font-medium">{formatDate(app.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-500">Application Status</span>
                      <span>{getStatusBadge(app.status)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-500">Payment Status</span>
                      <span>{getPaymentBadge(app.paymentStatus)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-500">Handover Status</span>
                      <span>{getHandoverBadge(app.handover?.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applicant' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Full Name</span>
                      <span className="font-medium">{app.userId?.name || app.applicationData?.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email Address</span>
                      <span className="font-medium">{app.userId?.email || app.applicationData?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone Number</span>
                      <span className="font-medium">{app.applicationData?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address</span>
                      <span className="font-medium text-right">
                        {app.applicationData?.address?.street ? 
                          `${app.applicationData.address.street}, ${app.applicationData.address.city}, ${app.applicationData.address.state} - ${app.applicationData.address.pincode}` : 
                          'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Home Environment</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Home Type</span>
                      <span className="font-medium capitalize">{app.applicationData?.homeType?.replace(/_/g, ' ') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Has Garden</span>
                      <span className="font-medium">{app.applicationData?.hasGarden ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Has Other Pets</span>
                      <span className="font-medium">{app.applicationData?.hasOtherPets ? 'Yes' : 'No'}</span>
                    </div>
                    {app.applicationData?.hasOtherPets && app.applicationData?.otherPetsDetails && (
                      <div>
                        <span className="text-gray-500">Other Pets Details</span>
                        <p className="mt-1 font-medium">{app.applicationData.otherPetsDetails}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Experience & Lifestyle</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pet Experience</span>
                      <span className="font-medium capitalize">
                        {app.applicationData?.petExperience === 'none' ? 'No experience' : 
                         app.applicationData?.petExperience === 'some' ? 'Some experience' : 
                         app.applicationData?.petExperience === 'extensive' ? 'Extensive experience' : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Previous Pets</span>
                      <span className="font-medium">{app.applicationData?.previousPets || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Work Schedule</span>
                      <span className="font-medium capitalize">
                        {app.applicationData?.workSchedule?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time at Home</span>
                      <span className="font-medium capitalize">
                        {app.applicationData?.timeAtHome === 'less_than_4_hours' ? 'Less than 4 hours' :
                         app.applicationData?.timeAtHome === '4_8_hours' ? '4-8 hours' :
                         app.applicationData?.timeAtHome === '8_12_hours' ? '8-12 hours' :
                         app.applicationData?.timeAtHome === 'more_than_12_hours' ? 'More than 12 hours' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Motivation</h4>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-500">Reason for Adoption</span>
                      <p className="mt-1 font-medium">{app.applicationData?.adoptionReason || 'N/A'}</p>
                    </div>
                    {app.applicationData?.expectations && (
                      <div>
                        <span className="text-gray-500">Expectations</span>
                        <p className="mt-1 font-medium">{app.applicationData.expectations}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pet' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Pet Details</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{app.petId?.name || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Species</p>
                      <p className="font-medium capitalize">{app.petId?.species || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Breed</p>
                      <p className="font-medium">{app.petId?.breed || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Gender</p>
                      <p className="font-medium capitalize">{app.petId?.gender || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Age</p>
                      <p className="font-medium">{app.petId?.ageDisplay || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="font-medium">{app.petId?.weight ? `${app.petId.weight} kg` : 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Color</p>
                      <p className="font-medium capitalize">{app.petId?.color || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Temperament</p>
                      <p className="font-medium capitalize">{app.petId?.temperament?.replace(/_/g, ' ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Health Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Health Status</p>
                      <p className="font-medium capitalize">{app.petId?.healthStatus?.replace(/_/g, ' ') || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Vaccination Status</p>
                      <p className="font-medium capitalize">{app.petId?.vaccinationStatus?.replace(/_/g, ' ') || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2 bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Description</p>
                      <p className="font-medium">{app.petId?.description || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Images</h4>
                  {app.petId?.images && app.petId.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {app.petId.images.map((img, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                          <img 
                            src={resolveMediaUrl(img.url)} 
                            alt={img.caption || `Pet image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2">No images available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Applicant Documents</h3>
            {getApplicantDocuments().length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">No documents have been uploaded by the applicant.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getApplicantDocuments().map((doc, index) => {
                  const docObj = typeof doc === 'string' ? { url: doc } : doc;
                  const url = resolveMediaUrl(docObj.url);
                  const type = docObj.type || (url.match(/\.(pdf|doc|docx)$/i) ? 'application/' + (url.match(/\.pdf$/i) ? 'pdf' : url.match(/\.docx$/i) ? 'vnd.openxmlformats-officedocument.wordprocessingml.document' : 'msword') : 'image');
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      {type === 'application/pdf' ? (
                        <div className="bg-red-50 aspect-video flex items-center justify-center">
                          <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      ) : type.startsWith('image') ? (
                        <div className="aspect-video bg-gray-200">
                          <img src={url} alt={docObj.name || `Document ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="bg-blue-50 aspect-video flex items-center justify-center">
                          <svg className="h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="font-medium text-sm truncate">{docObj.name || `Document ${index + 1}`}</h4>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">{type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Application Actions</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Review Actions */}
              <div className="lg:col-span-2 space-y-6">
                {app.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                    <h4 className="text-lg font-medium text-yellow-800 mb-3">Review Application</h4>
                    <p className="text-yellow-700 mb-4">
                      Please review this application and either approve or reject it. 
                      The applicant is waiting for your decision.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex-1"
                        onClick={approveApplication}
                        disabled={saving}
                      >
                        {saving ? 'Approving...' : 'Approve Application'}
                      </button>
                      <button 
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex-1"
                        onClick={rejectApplication}
                        disabled={saving}
                      >
                        {saving ? 'Rejecting...' : 'Reject Application'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Handover Management */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Handover Management</h4>
                  
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
                                <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            {app.handover.scheduledAt ? formatDateTime(app.handover.scheduledAt) : 'N/A'}
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
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center ${
                            saving ? 'bg-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          } flex-1`} 
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
                          } flex-1`} 
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
                          } flex-1`} 
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
                        <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Handover Completed
                      </div>
                      <div className="text-green-700 mt-2">
                        The handover was completed on {app.handoverCompletedAt ? formatDateTime(app.handoverCompletedAt) : 'recently'}.
                        The pet is now officially owned by {app.userId?.name} and will appear in their dashboard.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Certificate & Contract */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Certificate & Contract</h4>
                  {app.contractURL ? (
                    <div className="space-y-4">
                      <div className="flex items-center text-green-700">
                        <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                
                {/* Application History */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Application History</h4>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-gray-500">Application submitted</p>
                        <p className="text-sm font-medium">{formatDateTime(app.createdAt)}</p>
                      </div>
                    </div>
                    
                    {app.statusHistory && app.statusHistory.map((history, index) => (
                      <div key={index} className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className={`w-3 h-3 rounded-full ${history.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          {index < app.statusHistory.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                        </div>
                        <div className={`pb-4 ${index === app.statusHistory.length - 1 ? '' : 'mb-4'}`}>
                          <p className="text-sm font-medium">
                            Application {history.status === 'approved' ? 'Approved' : 'Rejected'}
                          </p>
                          <p className="text-sm text-gray-500">{formatDateTime(history.changedAt)}</p>
                          {history.notes && (
                            <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{history.notes}</p>
                          )}
                          {history.changedBy && (
                            <p className="text-xs text-gray-400 mt-1">By: {history.changedBy.name || 'Manager'}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-3 h-3 rounded-full ${app.status === 'approved' ? 'bg-green-500' : app.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {app.status === 'approved' ? 'Currently Approved' : 
                           app.status === 'rejected' ? 'Currently Rejected' : 'Pending Review'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {app.status === 'approved' || app.status === 'rejected' 
                            ? formatDateTime(app.reviewedAt) 
                            : 'Awaiting manager review'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationDetailsImproved