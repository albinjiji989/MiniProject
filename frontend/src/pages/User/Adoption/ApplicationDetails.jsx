import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adoptionAPI, resolveMediaUrl } from '../../../services/api'

export default function UserAdoptionApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adoptionAPI.getMyRequestById(id)
      const data = res?.data?.data || res?.data
      setApp(data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load application')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const payNow = async () => {
    try {
      if (!app) return
      const ok = await loadRazorpay()
      if (!ok) return alert('Payment SDK failed to load. Please check your connection.')
      const create = await adoptionAPI.createPaymentOrder(app._id || id)
      const { key, orderId, amount, currency } = create?.data?.data || {}
      if (!key || !orderId) return alert('Failed to create payment order')

      const rzp = new window.Razorpay({
        key,
        amount,
        currency,
        name: 'Pet Adoption',
        description: `Adoption fee for ${app?.petId?.name || 'Pet'}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            await adoptionAPI.verifyPayment({
              applicationId: app._id || id,
              orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            await load()
            alert('Payment verified successfully')
          } catch (e) {
            alert(e?.response?.data?.error || 'Payment verification failed')
          }
        },
        theme: { color: '#10b981' }
      })
      rzp.open()
    } catch (e) {
      alert(e?.response?.data?.error || 'Payment failed to start')
    }
  }

  const downloadCertificate = async () => {
    try {
      const res = await adoptionAPI.getCertificate(app._id || id)
      const url = res?.data?.data?.agreementFile || res?.data?.data?.certificate?.agreementFile || res?.data?.data?.contractURL
      if (url) window.open(resolveMediaUrl(url), '_blank')
    } catch (_) {}
  }

  const docs = () => {
    const d1 = Array.isArray(app?.documents) ? app.documents : []
    const d2 = Array.isArray(app?.applicationData?.documents) ? app.applicationData.documents : []
    return [...d1, ...d2]
  }

  // Get current step in the adoption process
  const getCurrentStep = () => {
    if (app?.status === 'pending') return 1
    if (app?.status === 'approved' && app?.paymentStatus !== 'completed') return 2
    if (app?.status === 'approved' && app?.paymentStatus === 'completed' && (!app?.handover || app?.handover?.status === 'none')) return 3
    if (app?.handover?.status === 'scheduled') return 4
    if (app?.handover?.status === 'completed') return 5
    return 1
  }

  // Get step status for progress indicator
  const getStepStatus = (step) => {
    const current = getCurrentStep()
    if (step < current) return 'completed'
    if (step === current) return 'current'
    return 'pending'
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!app) return <div>Not found</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Adoption Application</h2>
        <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700" onClick={()=>navigate(-1)}>Back</button>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Adoption Process Status</h3>
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 z-0"></div>
          <div 
            className="absolute top-4 left-0 h-1 bg-green-500 z-10 transition-all duration-500" 
            style={{ width: `${Math.max(0, (getCurrentStep() - 1) * 25)}%` }}
          ></div>
          
          {/* Steps */}
          {[
            { num: 1, label: 'Application Submitted', desc: 'Waiting for review' },
            { num: 2, label: 'Payment', desc: 'Complete adoption fee' },
            { num: 3, label: 'Certificate', desc: 'Awaiting generation' },
            { num: 4, label: 'Handover Scheduled', desc: 'Visit adoption center' },
            { num: 5, label: 'Completed', desc: 'Pet ownership transferred' }
          ].map((step, index) => {
            const status = getStepStatus(step.num)
            return (
              <div key={step.num} className="flex flex-col items-center z-20 relative">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2
                  ${status === 'completed' ? 'bg-green-500 text-white' : ''}
                  ${status === 'current' ? 'bg-blue-500 text-white' : ''}
                  ${status === 'pending' ? 'bg-gray-300 text-gray-600' : ''}
                `}>
                  {status === 'completed' ? '✓' : step.num}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium ${status === 'current' ? 'text-blue-600' : 'text-gray-600'}`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{step.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Status */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-lg">Application Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                app.status === 'approved' ? 'text-green-600' : 
                app.status === 'rejected' ? 'text-red-600' : 
                app.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Payment:</span>
              <span className={`font-medium ${
                app.paymentStatus === 'completed' ? 'text-green-600' : 
                app.paymentStatus === 'failed' ? 'text-red-600' : 
                app.paymentStatus === 'processing' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {app.paymentStatus ? app.paymentStatus.charAt(0).toUpperCase() + app.paymentStatus.slice(1) : 'Not started'}
              </span>
            </div>
            
            {app.status === 'rejected' && (
              <div className="pt-2">
                <div className="text-sm text-red-600 font-medium">Rejection Reason:</div>
                <div className="text-sm text-gray-700 mt-1">{app.rejectionReason || 'Not provided'}</div>
              </div>
            )}
            
            {app.status === 'approved' && app.paymentStatus !== 'completed' && (
              <div className="pt-3">
                <button 
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  onClick={payNow}
                >
                  Pay Adoption Fee (₹{app.petId?.adoptionFee || 0})
                </button>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  After payment, the adoption manager will generate your certificate
                </div>
              </div>
            )}
            
            {app.paymentStatus === 'completed' && (
              <div className="pt-3">
                <button 
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  onClick={downloadCertificate}
                >
                  Download Certificate
                </button>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Your certificate is ready for the handover process
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Pet Information */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-lg">Pet Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{app.petId?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Breed:</span>
              <span className="font-medium">{app.petId?.breed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Species:</span>
              <span className="font-medium">{app.petId?.species}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Adoption Fee:</span>
              <span className="font-medium">₹{app.petId?.adoptionFee || 0}</span>
            </div>
            {app.paymentStatus === 'completed' && app.handover?.status === 'scheduled' && (
              <div className="pt-3 border-t border-gray-200 mt-3">
                <div className="text-sm font-medium text-blue-600">Handover Scheduled</div>
                <div className="text-sm mt-1">
                  Date: {app.handover.scheduledAt ? new Date(app.handover.scheduledAt).toLocaleString() : 'Not set'}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Please bring the OTP sent to your email to the adoption center
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Applicant Information */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-lg">Your Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{app.userId?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{app.userId?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{app.applicationData?.phone || app.userId?.phone}</span>
            </div>
          </div>
        </div>
        
        {/* Documents */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-lg">Documents</h3>
          {docs().length === 0 ? (
            <div className="text-sm text-gray-500">No documents uploaded.</div>
          ) : (
            <ul className="space-y-2">
              {docs().map((d, i) => {
                const url = typeof d === 'string' ? d : (d && d.url ? d.url : '')
                if (!url) return null
                const name = (typeof d === 'object' && d.name) ? d.name : url.split('/').pop()
                return (
                  <li key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate flex-1 mr-2">{name}</span>
                    <a 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium" 
                      href={resolveMediaUrl(url)} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Handover Information */}
      {app.handover?.status === 'scheduled' && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-lg">Handover Appointment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Date & Time</div>
              <div className="font-medium">{app.handover.scheduledAt ? new Date(app.handover.scheduledAt).toLocaleString() : 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Location</div>
              <div className="font-medium">{app.handover.location?.address || 'Adoption Center - Main Branch, 123 Pet Welfare Road, Animal City'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Contact</div>
              <div className="font-medium">{app.handover.location?.phone || '+91-9876543210'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Special Notes</div>
              <div className="font-medium">{app.handover.notes || 'None'}</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <div className="font-medium text-amber-800">Important Information</div>
            <div className="text-sm text-amber-700 mt-1">
              Please bring the OTP sent to your email to the adoption center. 
              Arrive 15 minutes before your scheduled time. 
              No pets will be released without the correct OTP.
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {app.handover?.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg text-green-800">Adoption Completed!</h3>
          <div className="text-green-700 mt-2">
            Congratulations! Your adoption is now complete. The pet is officially yours and will appear in your dashboard under "My Pets".
          </div>
          <div className="text-sm text-green-600 mt-3">
            Handover completed on {app.handoverCompletedAt ? new Date(app.handoverCompletedAt).toLocaleString() : 'recently'}
          </div>
        </div>
      )}
    </div>
  )
}