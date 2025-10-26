import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerPatientDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatient();
      loadMedicalRecords();
    }
  }, [id]);

  const loadPatient = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch actual patient data
      // For now, we'll use sample data
      const samplePatient = {
        _id: id,
        name: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
        gender: 'Male',
        weight: 32,
        color: 'Golden',
        microchip: 'MC-123456789',
        owner: {
          name: 'John Smith',
          phone: '555-0123',
          email: 'john@example.com',
          address: '123 Main St, Anytown, ST 12345'
        },
        medicalHistory: 'Allergic to penicillin',
        vaccinationStatus: 'Up to date',
        lastVisit: new Date('2023-10-15'),
        nextAppointment: new Date('2023-11-15'),
        createdAt: new Date('2022-01-15'),
        updatedAt: new Date('2023-10-15')
      };
      
      setPatient(samplePatient);
    } catch (error) {
      console.error('Failed to load patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      // In a real implementation, this would fetch actual medical records
      // For now, we'll use sample data
      const sampleRecords = [
        {
          _id: '1',
          visitDate: new Date('2023-10-15'),
          visitType: 'routine_checkup',
          chiefComplaint: 'Annual checkup',
          diagnosis: 'Healthy',
          treatment: 'Routine examination',
          veterinarian: 'Dr. Jane Doe',
          status: 'completed'
        },
        {
          _id: '2',
          visitDate: new Date('2023-07-10'),
          visitType: 'vaccination',
          chiefComplaint: 'Annual vaccinations',
          diagnosis: 'Healthy',
          treatment: 'Rabies and DHPP vaccines',
          veterinarian: 'Dr. John Smith',
          status: 'completed'
        }
      ];
      
      setMedicalRecords(sampleRecords);
    } catch (error) {
      console.error('Failed to load medical records:', error);
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
      case 'scheduled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <ManagerModuleLayout
        title="Patient Details"
        subtitle="View patient information and medical history"
      >
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </ManagerModuleLayout>
    );
  }

  if (!patient) {
    return (
      <ManagerModuleLayout
        title="Patient Details"
        subtitle="View patient information and medical history"
      >
        <div className="bg-white shadow sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">Patient not found</p>
        </div>
      </ManagerModuleLayout>
    );
  }

  return (
    <ManagerModuleLayout
      title="Patient Details"
      subtitle="View patient information and medical history"
      actions={[
        {
          label: 'Back to Patients',
          onClick: () => navigate('/manager/veterinary/patients')
        },
        {
          label: 'Edit Patient',
          onClick: () => navigate(`/manager/veterinary/patients/${id}/edit`),
          color: 'bg-indigo-600'
        },
        {
          label: 'Add Medical Record',
          onClick: () => navigate('/manager/veterinary/records/new'),
          color: 'bg-emerald-600'
        }
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Information</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Species</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.species}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Breed</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.breed}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.age} years</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.gender}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Weight</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.weight} kg</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Color</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.color}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Microchip</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.microchip}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Medical History</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.medicalHistory}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Vaccination Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {patient.vaccinationStatus}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Next Appointment</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString() : 'None scheduled'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Medical Records */}
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Medical Records</h3>
                <button
                  onClick={() => navigate('/manager/veterinary/records/new')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Add Record
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {medicalRecords.length > 0 ? (
                  medicalRecords.map((record) => (
                    <li key={record._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer" 
                        onClick={() => navigate(`/manager/veterinary/records/${record._id}`)}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          {getVisitTypeLabel(record.visitType)}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <div className="text-sm text-gray-500">
                            Vet: {record.veterinarian}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <time dateTime={record.visitDate}>
                            {new Date(record.visitDate).toLocaleDateString()}
                          </time>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {record.chiefComplaint}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 sm:px-6 text-center text-sm text-gray-500">
                    No medical records found
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div>
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Owner Information</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-800 font-medium">{patient.owner.name.charAt(0)}</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{patient.owner.name}</h4>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{patient.owner.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{patient.owner.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{patient.owner.address}</p>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => alert('Send message functionality would be implemented here')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Send Message
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => navigate('/manager/veterinary/appointments/new')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Schedule Appointment
                </button>
                <button
                  onClick={() => navigate('/manager/veterinary/records/new')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                  </svg>
                  Add Medical Record
                </button>
                <button
                  onClick={() => alert('Print medical history functionality would be implemented here')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Print Medical History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}