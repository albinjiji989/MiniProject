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

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!app) return <div>Not found</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Adoption Application</h2>
        <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>navigate(-1)}>Back</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Status</h3>
          <div className="text-sm">{app.status}</div>
          <div className="text-sm text-gray-600">Payment: {app.paymentStatus || 'n/a'}</div>
          {app.status === 'rejected' && (
            <div className="text-sm text-red-600 mt-2">Reason: {app.rejectionReason || 'Not provided'}</div>
          )}
          {app.status === 'approved' && (
            <button className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded" onClick={payNow}>Pay Now</button>
          )}
          {app.paymentStatus === 'completed' && (
            <button className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded" onClick={downloadCertificate}>Download Certificate</button>
          )}
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Pet</h3>
          <div className="text-sm">{app.petId?.name}</div>
          <div className="text-sm text-gray-600">{app.petId?.breed} • {app.petId?.species}</div>
          <div className="text-sm text-gray-600">Fee: ₹{app.petId?.adoptionFee || 0}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Applicant</h3>
          <div className="text-sm">{app.userId?.name}</div>
          <div className="text-sm text-gray-600">{app.userId?.email}</div>
          <div className="text-sm text-gray-600">{app.userId?.phone}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Documents</h3>
          {docs().length === 0 ? (
            <div className="text-sm text-gray-500">No documents uploaded.</div>
          ) : (
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {docs().map((d, i) => {
                const url = typeof d === 'string' ? d : (d && d.url ? d.url : '')
                if (!url) return null
                const name = (typeof d === 'object' && d.name) ? d.name : url.split('/').pop()
                return <li key={i}><a className="text-blue-600 underline" href={resolveMediaUrl(url)} target="_blank" rel="noreferrer">{name}</a></li>
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
