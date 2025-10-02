import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../../services/api'

const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contractUrl, setContractUrl] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get(`/adoption/manager/applications/${id}`)
      const data = res.data?.data
      setApp(data)
      setContractUrl(data?.contractURL || '')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load application')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const approve = async () => {
    try {
      await apiClient.put(`/adoption/manager/applications/${id}/approve`, { notes: 'Approved by manager' })
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Approve failed')
    }
  }

  const reject = async () => {
    const reason = prompt('Reason for rejection?')
    if (!reason) return
    try {
      await apiClient.put(`/adoption/manager/applications/${id}/reject`, { reason, notes: 'Rejected by manager' })
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
      const res = await apiClient.post(`/adoption/manager/contracts/generate/${id}`)
      const url = res.data?.data?.contractURL
      if (url) {
        setContractUrl(url)
        alert('Contract generated')
      }
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to generate contract')
    }
  }

  const viewContract = async () => {
    try {
      // Try fetching latest URL; fallback to stored
      const res = await apiClient.get(`/adoption/manager/contracts/${id}`)
      const url = res.data?.data?.contractURL || contractUrl
      if (url) {
        window.open(url, '_blank')
      } else {
        alert('Contract not available')
      }
    } catch (e) {
      const url = contractUrl
      if (url) window.open(url, '_blank'); else alert(e?.response?.data?.error || 'Failed to fetch contract')
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

      <div className="flex gap-2">
        {app.status === 'pending' && (
          <>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={approve}>Approve</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={reject}>Reject</button>
          </>
        )}
        {app.status === 'approved' && (
          <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={createOrder}>Create Payment Order</button>
        )}
        {app.paymentStatus === 'completed' && (
          <>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={generateContract}>Generate Contract</button>
            <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={viewContract} disabled={!contractUrl}>View Contract</button>
          </>
        )}
      </div>
    </div>
  )
}

export default ApplicationDetails
