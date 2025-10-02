import React, { useState } from 'react'
import { apiClient } from '../../../services/api'

const ImportPets = () => {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!file) { setError('Please choose a CSV file.'); return }
    const form = new FormData()
    form.append('file', file)
    setLoading(true)
    try {
      const res = await apiClient.post('/adoption/manager/pets/import', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data || {})
    } catch (e2) {
      const errorData = e2?.response?.data
      if (errorData && errorData.data) {
        // Partial success case (status 207)
        setResult(errorData)
      } else {
        setError(errorData?.error || 'Import failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderResults = () => {
    if (!result || !result.data) return null

    const { data, message } = result
    const { totalRows, successful, failed, warnings, details, debugInfo, detectedHeaders } = data

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className={`p-4 rounded-lg border ${
          failed === 0 ? 'bg-green-50 border-green-200' : 
          successful === 0 ? 'bg-red-50 border-red-200' : 
          'bg-yellow-50 border-yellow-200'
        }`}>
          <h3 className="font-semibold text-lg mb-2">Import Summary</h3>
          <p className="text-sm mb-2">{message}</p>
          {detectedHeaders && detectedHeaders.length > 0 && (
            <div className="text-xs text-gray-600 mb-2">
              <strong>Detected headers:</strong> {detectedHeaders.join(', ')}
            </div>
          )}
          {debugInfo && (
            <div className="text-xs text-gray-500 mb-2 font-mono">
              {debugInfo}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Rows:</span>
              <div className="text-lg font-bold">{totalRows}</div>
            </div>
            <div>
              <span className="font-medium text-green-600">Successful:</span>
              <div className="text-lg font-bold text-green-600">{successful}</div>
            </div>
            <div>
              <span className="font-medium text-red-600">Failed:</span>
              <div className="text-lg font-bold text-red-600">{failed}</div>
            </div>
            <div>
              <span className="font-medium text-yellow-600">Warnings:</span>
              <div className="text-lg font-bold text-yellow-600">{warnings}</div>
            </div>
          </div>
        </div>

        {/* Successful imports */}
        {details.successfulPets && details.successfulPets.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Successfully Imported Pets ({details.successfulPets.length})</h4>
            <div className="max-h-40 overflow-y-auto">
              <div className="space-y-1">
                {details.successfulPets.map((pet, idx) => (
                  <div key={idx} className="text-sm text-green-700 flex justify-between">
                    <span>Row {pet.row}: {pet.name} ({pet.breed}, {pet.species})</span>
                    <span className="text-xs text-green-600">ID: {pet.petId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {details.warnings && details.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Warnings ({details.warnings.length})</h4>
            <div className="max-h-40 overflow-y-auto">
              <div className="space-y-1">
                {details.warnings.map((warning, idx) => (
                  <div key={idx} className="text-sm text-yellow-700">
                    <span className="font-medium">Row {warning.row}, {warning.field}:</span> {warning.message}
                    {warning.value && <span className="text-xs text-yellow-600"> (was: "{warning.value}")</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Failed imports */}
        {details.failedRows && details.failedRows.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Failed Imports ({details.failedRows.length})</h4>
            <div className="max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {details.failedRows.map((failure, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="font-medium text-red-700">Row {failure.row}:</div>
                    <div className="text-red-600 ml-2">{failure.reason}</div>
                    {failure.data && (
                      <div className="text-xs text-red-500 ml-2 mt-1">
                        Data: {JSON.stringify(failure.data).substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Import Incoming Animals (CSV)</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">CSV Format Requirements</h3>
          <p className="text-sm text-blue-700 mb-2">
            <strong>Required fields:</strong> name, breed, species (or type)
          </p>
          <p className="text-sm text-blue-700 mb-2">
            <strong>Optional fields:</strong> age, ageUnit, gender, color, weight, healthStatus, vaccinationStatus, temperament, description, adoptionFee
          </p>
          <div className="text-xs text-blue-600 mt-2">
            <p><strong>Smart handling:</strong> Missing optional fields will use sensible defaults. Invalid values will show warnings but won't prevent import.</p>
            <p><strong>Flexible headers:</strong> Supports variations like "Age Unit", "age_unit", "ageunit", etc.</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Choose CSV File</label>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e)=>setFile(e.target.files?.[0]||null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="flex gap-2">
          <button 
            type="submit"
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading || !file}
          >
            {loading ? 'Processing...' : 'Import Pets'}
          </button>
          {file && (
            <button 
              type="button"
              onClick={() => {setFile(null); setResult(null); setError('')}}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Processing CSV file...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-1">Import Error</h4>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {renderResults()}
    </div>
  )
}

export default ImportPets
