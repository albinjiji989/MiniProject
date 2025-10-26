import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerMedicalRecordDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (id) {
      loadMedicalRecord();
    }
  }, [id]);

  const loadMedicalRecord = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetMedicalRecordById(id);
      setMedicalRecord(response.data.data.medicalRecord);
      setFormData(response.data.data.medicalRecord);
    } catch (error) {
      console.error('Failed to load medical record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      await veterinaryAPI.managerUpdateMedicalRecord(id, formData);
      setEditMode(false);
      loadMedicalRecord(); // Refresh the record
      alert('Medical record updated successfully');
    } catch (error) {
      console.error('Failed to update medical record:', error);
      alert('Failed to update medical record');
    } finally {
      setUpdating(false);
    }
  };

  const getVisitTypeLabel = (visitType) => {
    const types = {
      routine_checkup: 'Routine Checkup',
      vaccination: 'Vaccination',
      surgery: 'Surgery',
      emergency: 'Emergency',
      follow_up: 'Follow-up',
      consultation: 'Consultation',
      other: 'Other'
    };
    return types[visitType] || visitType;
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Progress</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Active</span>;
    }
  };

  if (loading) {
    return (
      <ManagerModuleLayout
        title="Medical Record Details"
        subtitle="View and manage veterinary medical record"
      >
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </ManagerModuleLayout>
    );
  }

  if (!medicalRecord) {
    return (
      <ManagerModuleLayout
        title="Medical Record Details"
        subtitle="View and manage veterinary medical record"
      >
        <div className="bg-white shadow sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">Medical record not found</p>
        </div>
      </ManagerModuleLayout>
    );
  }

  return (
    <ManagerModuleLayout
      title="Medical Record Details"
      subtitle="View and manage veterinary medical record"
      actions={[
        {
          label: 'Back to Records',
          onClick: () => navigate('/manager/veterinary/records')
        }
      ]}
    >
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {getVisitTypeLabel(medicalRecord.visitType)} Record
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Visit date: {new Date(medicalRecord.visitDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-3">
              {!editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/manager/veterinary/patients/${medicalRecord.pet._id}`)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Patient
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updating}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {editMode ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">
                      Visit Date
                    </label>
                    <input
                      type="date"
                      id="visitDate"
                      value={formData.visitDate ? new Date(formData.visitDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange(null, 'visitDate', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="visitType" className="block text-sm font-medium text-gray-700">
                      Visit Type
                    </label>
                    <select
                      id="visitType"
                      value={formData.visitType}
                      onChange={(e) => handleInputChange(null, 'visitType', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="routine_checkup">Routine Checkup</option>
                      <option value="vaccination">Vaccination</option>
                      <option value="surgery">Surgery</option>
                      <option value="emergency">Emergency</option>
                      <option value="follow_up">Follow-up</option>
                      <option value="consultation">Consultation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Clinical Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Clinical Information</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="chiefComplaint" className="block text-sm font-medium text-gray-700">
                      Chief Complaint
                    </label>
                    <textarea
                      id="chiefComplaint"
                      rows={3}
                      value={formData.chiefComplaint || ''}
                      onChange={(e) => handleInputChange(null, 'chiefComplaint', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="history" className="block text-sm font-medium text-gray-700">
                      History
                    </label>
                    <textarea
                      id="history"
                      rows={3}
                      value={formData.history || ''}
                      onChange={(e) => handleInputChange(null, 'history', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="examinationFindings" className="block text-sm font-medium text-gray-700">
                      Examination Findings
                    </label>
                    <textarea
                      id="examinationFindings"
                      rows={3}
                      value={formData.examinationFindings || ''}
                      onChange={(e) => handleInputChange(null, 'examinationFindings', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                      Diagnosis
                    </label>
                    <textarea
                      id="diagnosis"
                      rows={3}
                      value={formData.diagnosis || ''}
                      onChange={(e) => handleInputChange(null, 'diagnosis', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="treatment" className="block text-sm font-medium text-gray-700">
                      Treatment
                    </label>
                    <textarea
                      id="treatment"
                      rows={3}
                      value={formData.treatment || ''}
                      onChange={(e) => handleInputChange(null, 'treatment', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="prescription" className="block text-sm font-medium text-gray-700">
                      Prescription
                    </label>
                    <textarea
                      id="prescription"
                      rows={3}
                      value={formData.prescription || ''}
                      onChange={(e) => handleInputChange(null, 'prescription', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Cost and Status */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Cost and Status</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      id="cost"
                      min="0"
                      step="0.01"
                      value={formData.cost || ''}
                      onChange={(e) => handleInputChange(null, 'cost', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status || 'completed'}
                      onChange={(e) => handleInputChange(null, 'status', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Patient and Clinic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Patient</h4>
                  <p className="mt-1 text-sm text-gray-900">{medicalRecord.pet?.name || 'Unknown Pet'}</p>
                  <p className="text-sm text-gray-500">{medicalRecord.pet?.species || ''} - {medicalRecord.pet?.breed || ''}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Owner</h4>
                  <p className="mt-1 text-sm text-gray-900">{medicalRecord.owner?.name || 'Unknown Owner'}</p>
                  <p className="text-sm text-gray-500">{medicalRecord.owner?.email || ''}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Veterinarian</h4>
                  <p className="mt-1 text-sm text-gray-900">{medicalRecord.staff?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{medicalRecord.veterinary?.name || ''}</p>
                </div>
              </div>
              
              {/* Clinical Information */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Clinical Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Chief Complaint</h5>
                    <p className="mt-1 text-sm text-gray-900">{medicalRecord.chiefComplaint || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">History</h5>
                    <p className="mt-1 text-sm text-gray-900">{medicalRecord.history || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Examination Findings</h5>
                    <p className="mt-1 text-sm text-gray-900">{medicalRecord.examinationFindings || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Diagnosis</h5>
                    <p className="mt-1 text-sm text-gray-900">{medicalRecord.diagnosis || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Treatment</h5>
                    <p className="mt-1 text-sm text-gray-900">{medicalRecord.treatment || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Prescription</h5>
                    <p className="mt-1 text-sm text-gray-900">{medicalRecord.prescription || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              {/* Cost Information */}
              {medicalRecord.cost && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Cost Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-500">Total Cost</h5>
                      <p className="mt-1 text-lg font-medium text-gray-900">${medicalRecord.cost.toFixed(2)}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-500">Payment Status</h5>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{medicalRecord.paymentStatus || 'pending'}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-500">Status</h5>
                      <p className="mt-1 text-sm text-gray-900">{getStatusBadge(medicalRecord.status)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ManagerModuleLayout>
  );
}