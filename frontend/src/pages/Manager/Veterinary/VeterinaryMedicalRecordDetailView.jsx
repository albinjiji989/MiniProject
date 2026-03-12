import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';
import ManagerLayout from '../../../components/Layout/ManagerLayout';

export default function VeterinaryMedicalRecordDetailView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetMedicalRecordById(id);
      setRecord(response.data.data.medicalRecord);
    } catch (error) {
      console.error('Failed to load medical record:', error);
      alert('Failed to load medical record');
      navigate('/manager/veterinary/medical-records');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Export functionality - can be enhanced
    const data = JSON.stringify(record, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${record.pet?.name}-${new Date(record.visitDate).toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <ManagerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ManagerLayout>
    );
  }

  if (!record) {
    return (
      <ManagerLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Record not found</p>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/manager/veterinary/medical-records')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Medical Records
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
              <button
                onClick={() => navigate(`/manager/veterinary/medical-records/${id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Record
              </button>
            </div>
          </div>

          {/* Patient and Owner Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {record.pet?.name || 'Unknown Pet'}
              </h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Species:</span> {record.pet?.species || 'Unknown'}</p>
                <p><span className="font-medium">Breed:</span> {record.pet?.breed || 'Unknown'}</p>
                <p><span className="font-medium">Age:</span> {record.pet?.age || 'Unknown'}</p>
                <p><span className="font-medium">Sex:</span> {record.pet?.sex || 'Unknown'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Owner Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {record.owner?.name || 'Unknown'}</p>
                <p><span className="font-medium">Email:</span> {record.owner?.email || 'Unknown'}</p>
                <p><span className="font-medium">Phone:</span> {record.owner?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Visit Date</p>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(record.visitDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Veterinarian</p>
              <p className="mt-1 text-sm text-gray-900">{record.staff?.name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Cost</p>
              <p className="mt-1 text-sm text-gray-900">${record.totalCost || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Payment Status</p>
              <p className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  record.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  record.paymentStatus === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {record.paymentStatus}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {['overview', 'medications', 'procedures', 'vaccinations', 'tests', 'attachments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-md p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Vital Signs */}
              {record.vitalSigns && Object.keys(record.vitalSigns).some(key => record.vitalSigns[key]) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Vital Signs</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {record.vitalSigns.temperature && (
                        <div>
                          <p className="text-sm text-gray-600">Temperature</p>
                          <p className="text-lg font-semibold text-gray-900">{record.vitalSigns.temperature}°F</p>
                        </div>
                      )}
                      {record.vitalSigns.weight && (
                        <div>
                          <p className="text-sm text-gray-600">Weight</p>
                          <p className="text-lg font-semibold text-gray-900">{record.vitalSigns.weight} kg</p>
                        </div>
                      )}
                      {record.vitalSigns.heartRate && (
                        <div>
                          <p className="text-sm text-gray-600">Heart Rate</p>
                          <p className="text-lg font-semibold text-gray-900">{record.vitalSigns.heartRate} bpm</p>
                        </div>
                      )}
                      {record.vitalSigns.respiratoryRate && (
                        <div>
                          <p className="text-sm text-gray-600">Respiratory Rate</p>
                          <p className="text-lg font-semibold text-gray-900">{record.vitalSigns.respiratoryRate} /min</p>
                        </div>
                      )}
                      {record.vitalSigns.bloodPressure && (
                        <div>
                          <p className="text-sm text-gray-600">Blood Pressure</p>
                          <p className="text-lg font-semibold text-gray-900">{record.vitalSigns.bloodPressure}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chief Complaint */}
              {record.chiefComplaint && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chief Complaint</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{record.chiefComplaint}</p>
                  </div>
                </div>
              )}

              {/* Symptoms */}
              {record.symptoms && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Symptoms</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{record.symptoms}</p>
                  </div>
                </div>
              )}

              {/* Physical Examination */}
              {record.physicalExamination && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Physical Examination</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{record.physicalExamination}</p>
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagnosis</h3>
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-gray-700 font-medium">{record.diagnosis || 'Not specified'}</p>
                </div>
              </div>

              {/* Treatment */}
              {record.treatment && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Treatment Plan</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{record.treatment}</p>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {record.recommendations && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h3>
                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-700">{record.recommendations}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {record.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{record.notes}</p>
                  </div>
                </div>
              )}

              {/* Follow-up */}
              {record.followUpRequired && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Follow-up Required</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Date: {record.followUpDate ? new Date(record.followUpDate).toLocaleDateString() : 'TBD'}</p>
                        {record.followUpNotes && <p className="mt-1">Notes: {record.followUpNotes}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medications Tab */}
          {activeTab === 'medications' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescribed Medications</h3>
              {record.medications && record.medications.length > 0 ? (
                <div className="space-y-4">
                  {record.medications.map((med, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{med.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Dosage</p>
                          <p className="text-gray-900 font-medium">{med.dosage}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Frequency</p>
                          <p className="text-gray-900 font-medium">{med.frequency}</p>
                        </div>
                        {med.duration && (
                          <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="text-gray-900 font-medium">{med.duration}</p>
                          </div>
                        )}
                      </div>
                      {med.notes && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">{med.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No medications prescribed</p>
              )}
            </div>
          )}

          {/* Procedures Tab */}
          {activeTab === 'procedures' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Procedures Performed</h3>
              {record.procedures && record.procedures.length > 0 ? (
                <div className="space-y-4">
                  {record.procedures.map((proc, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{proc.name}</h4>
                        <span className="text-sm font-semibold text-gray-900">${proc.cost || 0}</span>
                      </div>
                      {proc.description && (
                        <p className="text-sm text-gray-700 mb-2">{proc.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Performed: {new Date(proc.performedAt || record.visitDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No procedures performed</p>
              )}
            </div>
          )}

          {/* Vaccinations Tab */}
          {activeTab === 'vaccinations' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaccinations Administered</h3>
              {record.vaccinations && record.vaccinations.length > 0 ? (
                <div className="space-y-4">
                  {record.vaccinations.map((vac, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{vac.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {vac.batchNumber && (
                          <div>
                            <p className="text-gray-500">Batch Number</p>
                            <p className="text-gray-900 font-medium">{vac.batchNumber}</p>
                          </div>
                        )}
                        {vac.expiryDate && (
                          <div>
                            <p className="text-gray-500">Expiry Date</p>
                            <p className="text-gray-900 font-medium">
                              {new Date(vac.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {vac.nextDueDate && (
                          <div>
                            <p className="text-gray-500">Next Due</p>
                            <p className="text-gray-900 font-medium">
                              {new Date(vac.nextDueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {vac.administeredBy && (
                          <div>
                            <p className="text-gray-500">Administered By</p>
                            <p className="text-gray-900 font-medium">{vac.administeredBy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No vaccinations administered</p>
              )}
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === 'tests' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tests Conducted</h3>
              {record.tests && record.tests.length > 0 ? (
                <div className="space-y-4">
                  {record.tests.map((test, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{test.testName}</h4>
                      {test.result && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500">Result</p>
                          <p className="text-sm text-gray-900 font-medium">{test.result}</p>
                        </div>
                      )}
                      {test.notes && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500">Notes</p>
                          <p className="text-sm text-gray-700">{test.notes}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Performed: {new Date(test.performedAt || record.visitDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tests conducted</p>
              )}
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
              {record.attachments && record.attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {record.attachments.map((att, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{att.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(att.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No attachments</p>
              )}
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}
