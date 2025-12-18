import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';
import MedicalRecordAttachments from '../../../components/Veterinary/MedicalRecordAttachments';

export default function VeterinaryManagerMedicalRecordDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMedicalRecord();
  }, [id]);

  const loadMedicalRecord = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetMedicalRecordById(id);
      setMedicalRecord(response.data.data.medicalRecord);
    } catch (error) {
      console.error('Failed to load medical record:', error);
      setError('Failed to load medical record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentsChange = () => {
    // Reload the medical record when attachments are updated
    loadMedicalRecord();
  };

  if (loading) {
    return (
      <ManagerModuleLayout
        title="Medical Record Details"
        subtitle="View detailed medical record information"
      >
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </ManagerModuleLayout>
    );
  }

  if (error) {
    return (
      <ManagerModuleLayout
        title="Medical Record Details"
        subtitle="View detailed medical record information"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </ManagerModuleLayout>
    );
  }

  if (!medicalRecord) {
    return (
      <ManagerModuleLayout
        title="Medical Record Details"
        subtitle="View detailed medical record information"
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Medical Record Not Found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The requested medical record could not be found.</p>
              </div>
            </div>
          </div>
        </div>
      </ManagerModuleLayout>
    );
  }

  const getVisitTypeLabel = (visitType) => {
    const options = {
      'routine_checkup': 'Routine Checkup',
      'vaccination': 'Vaccination',
      'surgery': 'Surgery',
      'emergency': 'Emergency',
      'follow_up': 'Follow-up',
      'consultation': 'Consultation',
      'other': 'Other'
    };
    return options[visitType] || visitType;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Progress</span>;
      case 'scheduled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <ManagerModuleLayout
      title="Medical Record Details"
      subtitle="View detailed medical record information"
      actions={[
        {
          label: 'Edit Record',
          onClick: () => navigate(`/manager/veterinary/records/${id}/edit`)
        },
        {
          label: 'Back to Records',
          onClick: () => navigate('/manager/veterinary/records')
        }
      ]}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Pet Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{medicalRecord.pet?.name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Visit Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {medicalRecord.visitDate ? new Date(medicalRecord.visitDate).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Visit Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{getVisitTypeLabel(medicalRecord.visitType)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">{getStatusBadge(medicalRecord.status)}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Information</h3>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Chief Complaint</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{medicalRecord.chiefComplaint || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">History</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{medicalRecord.history || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Examination Findings</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{medicalRecord.examinationFindings || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Diagnosis</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{medicalRecord.diagnosis || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Treatment</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{medicalRecord.treatment || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Prescription</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{medicalRecord.prescription || 'N/A'}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Medications */}
        {medicalRecord.medications && medicalRecord.medications.length > 0 && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medications</h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Medication
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Dosage
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Frequency
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Duration
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {medicalRecord.medications.map((med, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {med.name || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {med.dosage || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {med.frequency || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {med.duration || 'N/A'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {med.notes || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Vaccinations */}
        {medicalRecord.vaccinations && medicalRecord.vaccinations.length > 0 && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vaccinations</h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Vaccine
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Batch Number
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date Administered
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Next Due Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {medicalRecord.vaccinations.map((vacc, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {vacc.name || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vacc.batchNumber || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vacc.date ? new Date(vacc.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {vacc.nextDueDate ? new Date(vacc.nextDueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {vacc.notes || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Laboratory Tests */}
        {medicalRecord.labTests && medicalRecord.labTests.length > 0 && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Laboratory Tests</h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Test Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Result
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {medicalRecord.labTests.map((test, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {test.testName || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {test.result || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {test.date ? new Date(test.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {test.notes || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Vital Signs */}
        {(medicalRecord.weight || medicalRecord.temperature || medicalRecord.heartRate || medicalRecord.respiratoryRate) && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vital Signs</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {medicalRecord.weight && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Weight (kg)</dt>
                    <dd className="mt-1 text-sm text-gray-900">{medicalRecord.weight}</dd>
                  </div>
                )}
                {medicalRecord.temperature && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Temperature (°C)</dt>
                    <dd className="mt-1 text-sm text-gray-900">{medicalRecord.temperature}</dd>
                  </div>
                )}
                {medicalRecord.heartRate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Heart Rate (bpm)</dt>
                    <dd className="mt-1 text-sm text-gray-900">{medicalRecord.heartRate}</dd>
                  </div>
                )}
                {medicalRecord.respiratoryRate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Respiratory Rate (rpm)</dt>
                    <dd className="mt-1 text-sm text-gray-900">{medicalRecord.respiratoryRate}</dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Follow-up */}
        {medicalRecord.followUpRequired && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Follow-up</h3>
              <div className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Required</dt>
                  <dd className="mt-1 text-sm text-gray-900">Yes</dd>
                </div>
                {medicalRecord.followUpDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Follow-up Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(medicalRecord.followUpDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {medicalRecord.followUpNotes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{medicalRecord.followUpNotes}</dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Financial Information */}
        {(medicalRecord.cost || medicalRecord.paymentStatus) && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {medicalRecord.cost && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cost ($)</dt>
                    <dd className="mt-1 text-sm text-gray-900">{medicalRecord.cost.toFixed(2)}</dd>
                  </div>
                )}
                {medicalRecord.paymentStatus && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{medicalRecord.paymentStatus}</dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {medicalRecord.notes && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{medicalRecord.notes}</div>
            </div>
          </div>
        )}

        {/* Attachments */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <MedicalRecordAttachments recordId={id} onAttachmentsChange={handleAttachmentsChange} />
          </div>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}