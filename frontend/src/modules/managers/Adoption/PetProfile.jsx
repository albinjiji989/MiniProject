import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../../services/api'

const PetProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    age: 0,
    ageUnit: 'months',
    gender: 'male',
    color: '',
    weight: 0,
    healthStatus: 'good',
    vaccinationStatus: 'not_vaccinated',
    temperament: 'friendly',
    description: '',
    adoptionFee: 0,
    name: '',
    petCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get(`/adoption/manager/pets/${id}`)
        const p = res.data?.data || {}
        setForm(f => ({
          ...f,
          name: p.name || '',
          petCode: p.petCode || '',
          age: p.age ?? 0,
          ageUnit: p.ageUnit || 'months',
          gender: p.gender || 'male',
          color: p.color || '',
          weight: p.weight ?? 0,
          healthStatus: p.healthStatus || 'good',
          vaccinationStatus: p.vaccinationStatus || 'not_vaccinated',
          temperament: p.temperament || 'friendly',
          description: p.description || '',
          adoptionFee: p.adoptionFee ?? 0,
        }))
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load pet profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'age' || name === 'weight' || name === 'adoptionFee' ? Number(value) : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        age: Number(form.age) || 0,
        ageUnit: form.ageUnit,
        gender: form.gender || 'male',
        color: form.color || 'unknown',
        weight: Number(form.weight) || 0,
        healthStatus: form.healthStatus || 'good',
        vaccinationStatus: form.vaccinationStatus || 'not_vaccinated',
        temperament: form.temperament || 'friendly',
        description: form.description || 'N/A',
        adoptionFee: Number(form.adoptionFee) || 0,
      }
      await apiClient.put(`/adoption/manager/pets/${id}`, payload)
      navigate(`/manager/adoption/pets/${id}`)
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-1">Complete Pet Profile</h2>
      <p className="text-sm text-gray-600 mb-4">Fill additional details for {form.name}{form.petCode ? ` (Code: ${form.petCode})` : ''}.</p>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Age</label>
          <div className="flex gap-2">
            <input name="age" type="number" min="0" className="px-3 py-2 border rounded w-full" value={form.age} onChange={onChange} />
            <select name="ageUnit" className="px-3 py-2 border rounded" value={form.ageUnit} onChange={onChange}>
              <option value="months">months</option>
              <option value="years">years</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select name="gender" className="px-3 py-2 border rounded w-full" value={form.gender} onChange={onChange}>
            <option value="male">male</option>
            <option value="female">female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input name="color" className="px-3 py-2 border rounded w-full" value={form.color} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input name="weight" type="number" className="px-3 py-2 border rounded w-full" value={form.weight} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
          <select name="healthStatus" className="px-3 py-2 border rounded w-full" value={form.healthStatus} onChange={onChange}>
            <option value="excellent">excellent</option>
            <option value="good">good</option>
            <option value="fair">fair</option>
            <option value="needs_attention">needs_attention</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vaccination Status</label>
          <select name="vaccinationStatus" className="px-3 py-2 border rounded w-full" value={form.vaccinationStatus} onChange={onChange}>
            <option value="up_to_date">up_to_date</option>
            <option value="partial">partial</option>
            <option value="not_vaccinated">not_vaccinated</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperament</label>
          <select name="temperament" className="px-3 py-2 border rounded w-full" value={form.temperament} onChange={onChange}>
            <option value="calm">calm</option>
            <option value="energetic">energetic</option>
            <option value="playful">playful</option>
            <option value="shy">shy</option>
            <option value="aggressive">aggressive</option>
            <option value="friendly">friendly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adoption Fee (₹)</label>
          <input name="adoptionFee" type="number" className="px-3 py-2 border rounded w-full" value={form.adoptionFee} onChange={onChange} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" className="px-3 py-2 border rounded w-full" rows={4} value={form.description} onChange={onChange} />
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>Save</button>
          <button type="button" className="px-4 py-2 bg-gray-600 text-white rounded" onClick={()=>navigate(-1)} disabled={loading}>Back</button>
        </div>
      </form>
    </div>
  )
}

export default PetProfile
