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
    method: 'pickup',
    scheduledAt: '',
    location: {
      addressLine: '',
      meetupName: '',
      meetupPhone: ''
    },
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

  const scheduleHandover = async () => {
    if (!handover.scheduledAt || !handover.location?.addressLine) {
      return alert('Please provide date/time and location address')
    }
    setSaving(true)
    try {
      await apiClient.post(`/adoption/manager/applications/${id}/handover/schedule`, {
        method: handover.method || 'pickup',
        scheduledAt: handover.scheduledAt,
        location: {
          addressLine: handover.location?.addressLine || '',
          meetupName: handover.location?.meetupName || '',
          meetupPhone: handover.location?.meetupPhone || ''
        },
        notes: handover.notes || ''
      })
      await load()
      alert('Handover scheduled')
      // backend handles notifying the user about the scheduled handover
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
        method: handover.method,
        scheduledAt: handover.scheduledAt,
        location: {
          addressLine: handover.location?.addressLine || '',
          meetupName: handover.location?.meetupName || '',
          meetupPhone: handover.location?.meetupPhone || ''
        },
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

  const startHandover = async () => {
    setSaving(true)
    try {
      await apiClient.post(`/adoption/manager/applications/${id}/handover/start`)
      await load()
      alert('Handover marked as in progress')
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to start handover')
    } finally {
      setSaving(false)
    }
  }

  const completeHandover = async () => {
    setSaving(true)
    try {
      await apiClient.post(`/adoption/manager/applications/${id}/handover/complete`)
      await load()
      alert('Handover completed and ownership transferred')
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to complete handover')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => { load() }, [id])

  const approve = async () => {
    try {
      await adoptionAPI.managerPatchRequest(id, { status: 'approved', notes: 'Approved by manager' })
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Approve failed')
    }
  }

  const reject = async () => {
    const reason = prompt('Reason for rejection?')
    if (!reason) return
    try {
      await adoptionAPI.managerPatchRequest(id, { status: 'rejected', reason, notes: 'Rejected by manager' })
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Reject failed')
    }
  }

  const createOrder = async () => {
    if (!app?.petId?.adoptionFee) return alert('Adoption fee missing')
    try {
      const res = await apiClient.post('/adoption/manager/payments/create-order', { applicationId: id, amount: app.petId.adoptionFee })
      alert('Order created. Share orderId with user for payment: ' + res.data?.data?.orderId)
    } catch (e) {
      alert(e?.response?.data?.error || 'Order creation failed')
    }
  }

  const generateContract = async () => {
    try {
      // Ensure we have a contract URL
      let url = ''
      try {
        const resGet = await apiClient.get(`/adoption/manager/contracts/${id}`)
        url = resGet?.data?.data?.contractURL || ''
      } catch (e) {
        if (e?.response?.status === 404) {
          const resGen = await apiClient.post(`/adoption/manager/contracts/generate/${id}`)
          url = resGen?.data?.data?.contractURL || ''
        } else {
          throw e
        }
      }

      if (!url) throw new Error('Contract URL not available')

      // Generate certificate with contract URL as agreementFile
      const res = await adoptionAPI.generateCertificate(id, url)
      const certUrl = res?.data?.data?.agreementFile || res?.data?.data?.contractURL || url
      if (certUrl) {
        setContractUrl(certUrl)
        alert('Certificate generated')
      }
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Failed to generate certificate/contract')
    }
  }

  const viewContract = async () => {
    try {
      // Stream via backend to avoid CORS
      const resp = await apiClient.get(`/adoption/certificates/${id}/file`, { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dispo = resp.headers['content-disposition'] || ''
      const match = dispo.match(/filename="?([^";]+)"?/i)
      const fname = (match && match[1]) ? match[1] : `certificate_${id}.pdf`
      a.href = blobUrl
      a.download = fname
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.open(blobUrl, '_blank')
    } catch (e) {
      // Fallback: try direct URL if we have it
      const url = contractUrl
      if (url) window.open(resolveMediaUrl(url), '_blank'); else alert(e?.response?.data?.error || e?.message || 'Failed to fetch contract')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!app) return <div>Not found</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Application Details</h2>
        <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>navigate(-1)}>Back</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Applicant</h3>
          <div className="text-sm">{app.userId?.name}</div>
          <div className="text-sm text-gray-600">{app.userId?.email}</div>
          <div className="text-sm text-gray-600">{app.userId?.phone}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Pet</h3>
          <div className="text-sm">{app.petId?.name}</div>
          <div className="text-sm text-gray-600">{app.petId?.breed} • {app.petId?.species}</div>
          <div className="text-sm text-gray-600">Fee: ₹{app.petId?.adoptionFee || 0}</div>
        </div>
        {/* Documents list */}
        <div className="bg-white border rounded p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Applicant Documents</h3>
          {(() => {
            const docsA = Array.isArray(app.documents) ? app.documents : []
            const docsB = Array.isArray(app.applicationData?.documents) ? app.applicationData.documents : []
            const all = [...docsA, ...docsB]
            if (all.length === 0) {
              return <div className="text-sm text-gray-500">No documents uploaded.</div>
            }
            return (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {all.map((d, i) => {
                  const url = typeof d === 'string' ? d : (d && d.url ? d.url : '')
                  if (!url) return null
                  const name = (typeof d === 'object' && d.name) ? d.name : url.split('/').pop()
                  return (
                    <li key={i}>
                      <a href={resolveMediaUrl(url)} target="_blank" rel="noreferrer" className="text-blue-600 underline">{name}</a>
                    </li>
                  )
                })}
              </ul>
            )
          })()}
        </div>
        <div className="bg-white border rounded p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Status</h3>
          <div className="text-sm">{app.status}</div>
          <div className="text-sm text-gray-600 mt-2">Payment: {app.paymentStatus || 'n/a'}</div>
          {app.paymentDetails && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <div>Order: {app.paymentDetails.razorpayOrderId}</div>
              <div>Payment: {app.paymentDetails.razorpayPaymentId}</div>
              <div>Amount: ₹{app.paymentDetails.amount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Handover Panel */}
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Handover</h3>
        {(!app.handover || app.handover.status === 'none') && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Schedule handover after certificate is generated.</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Method</label>
                <select className="w-full border rounded p-2 text-sm" value={handover.method} onChange={e=>setHandover(h=>({ ...h, method: e.target.value }))}>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Date & Time</label>
                <input type="datetime-local" className="w-full border rounded p-2 text-sm" value={handover.scheduledAt} onChange={e=>setHandover(h=>({ ...h, scheduledAt: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Location Address</label>
                <input className="w-full border rounded p-2 text-sm" placeholder="Address" value={handover.location?.addressLine||''} onChange={e=>setHandover(h=>({ ...h, location: { ...(h.location||{}), addressLine: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contact Name</label>
                <input className="w-full border rounded p-2 text-sm" placeholder="Person meeting the adopter" value={handover.location?.meetupName||''} onChange={e=>setHandover(h=>({ ...h, location: { ...(h.location||{}), meetupName: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contact Phone</label>
                <input className="w-full border rounded p-2 text-sm" placeholder="Phone number" value={handover.location?.meetupPhone||''} onChange={e=>setHandover(h=>({ ...h, location: { ...(h.location||{}), meetupPhone: e.target.value } }))} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <textarea className="w-full border rounded p-2 text-sm" rows={2} value={handover.notes||''} onChange={e=>setHandover(h=>({ ...h, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className={`px-4 py-2 rounded ${saving?'bg-gray-400':'bg-blue-600 text-white'}`} disabled={saving} onClick={scheduleHandover}>Schedule Handover</button>
            </div>
          </div>
        )}
        {app.handover && app.handover.status === 'scheduled' && (
          <div className="space-y-3">
            <div className="text-sm"><span className="font-medium">Method:</span> {handover.method}</div>
            <div className="text-sm"><span className="font-medium">Scheduled:</span> {handover.scheduledAt ? new Date(handover.scheduledAt).toLocaleString() : ''}</div>
            <div className="text-sm"><span className="font-medium">Location:</span> {handover.location?.addressLine}</div>
            <div className="text-sm"><span className="font-medium">Meetup Contact:</span> {handover.location?.meetupName || '-'} {handover.location?.meetupPhone ? `(${handover.location.meetupPhone})` : ''}</div>
            <div className="text-sm"><span className="font-medium">Notes:</span> {handover.notes || '-'}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Method</label>
                <select className="w-full border rounded p-2 text-sm" value={handover.method} onChange={e=>setHandover(h=>({ ...h, method: e.target.value }))}>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Date & Time</label>
                <input type="datetime-local" className="w-full border rounded p-2 text-sm" value={handover.scheduledAt} onChange={e=>setHandover(h=>({ ...h, scheduledAt: e.target.value }))} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Location Address</label>
                <input className="w-full border rounded p-2 text-sm" value={handover.location?.addressLine||''} onChange={e=>setHandover(h=>({ ...h, location: { ...(h.location||{}), addressLine: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contact Name</label>
                <input className="w-full border rounded p-2 text-sm" value={handover.location?.meetupName||''} onChange={e=>setHandover(h=>({ ...h, location: { ...(h.location||{}), meetupName: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contact Phone</label>
                <input className="w-full border rounded p-2 text-sm" value={handover.location?.meetupPhone||''} onChange={e=>setHandover(h=>({ ...h, location: { ...(h.location||{}), meetupPhone: e.target.value } }))} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <textarea className="w-full border rounded p-2 text-sm" rows={2} value={handover.notes||''} onChange={e=>setHandover(h=>({ ...h, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className={`px-4 py-2 rounded ${saving?'bg-gray-400':'bg-blue-600 text-white'}`} disabled={saving} onClick={updateHandover}>Update Schedule</button>
              <button className={`px-4 py-2 rounded ${saving?'bg-gray-400':'bg-amber-600 text-white'}`} disabled={saving} onClick={startHandover}>Start Handover</button>
            </div>
          </div>
        )}
        {app.handover && app.handover.status === 'in_progress' && (
          <div className="space-y-3">
            <div className="text-sm"><span className="font-medium">Method:</span> {handover.method}</div>
            <div className="text-sm"><span className="font-medium">Started:</span> {app.handover?.startedAt ? new Date(app.handover.startedAt).toLocaleString() : 'Just now'}</div>
            <div className="text-sm"><span className="font-medium">Location:</span> {handover.location?.addressLine}</div>
            <div className="text-sm"><span className="font-medium">Meetup Contact:</span> {handover.location?.meetupName || '-'} {handover.location?.meetupPhone ? `(${handover.location.meetupPhone})` : ''}</div>
            <div className="text-sm"><span className="font-medium">Notes:</span> {handover.notes || '-'}</div>
            <div className="flex gap-2">
              <button className={`px-4 py-2 rounded ${saving?'bg-gray-400':'bg-emerald-600 text-white'}`} disabled={saving} onClick={completeHandover}>Mark Completed</button>
              <button className={`px-4 py-2 rounded ${saving?'bg-gray-400':'bg-blue-600 text-white'}`} disabled={saving} onClick={updateHandover}>Update Details</button>
            </div>
          </div>
        )}
        {app.handover && app.handover.status === 'completed' && (
          <div className="text-sm text-emerald-700">Handover completed on {app.handoverCompletedAt ? new Date(app.handoverCompletedAt).toLocaleString() : 'recently'}.</div>
        )}
      </div>
      {/* Documents checklist banner */}
      {(() => {
        const docs = Array.isArray(app.documents) ? app.documents : []
        const docs2 = Array.isArray(app.applicationData?.documents) ? app.applicationData.documents : []
        const missing = (docs.length + docs2.length) === 0
        if (!missing && app.status !== 'pending') return null
        return (
          <div className={`p-3 border rounded ${missing ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>
            {missing
              ? 'No applicant documents found. At least one document (ID/address proof) is required to approve the application.'
              : 'Documents present. You can proceed with approval if other checks are satisfied.'}
          </div>
        )
      })()}

      <div className="flex gap-2">
        {app.status === 'pending' && (
          <>
            {(() => {
              const docs = Array.isArray(app.documents) ? app.documents : []
              const docs2 = Array.isArray(app.applicationData?.documents) ? app.applicationData.documents : []
              const missing = (docs.length + docs2.length) === 0
              return (
                <button className={`px-4 py-2 rounded ${missing ? 'bg-green-600/50 cursor-not-allowed text-white/70' : 'bg-green-600 text-white'}`} onClick={missing ? undefined : approve} disabled={missing} title={missing ? 'Upload at least one applicant document to enable approval' : ''}>Approve</button>
              )
            })()}
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={reject}>Reject</button>
          </>
        )}
        {app.status === 'approved' && (
          <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={createOrder}>Create Payment Order</button>
        )}
        {app.paymentStatus === 'completed' && (
          <>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={generateContract}>Generate Certificate</button>
            <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={viewContract}>View Certificate</button>
          </>
        )}
      </div>
    </div>
  )
}

export default ApplicationDetails
