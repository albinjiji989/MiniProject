import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TestPetSpecificFlow() {
  const navigate = useNavigate();

  const testFlow = () => {
    // Test the complete flow from dashboard to pet selection to booking
    console.log('Testing pet-specific veterinary flow...');
    
    // Navigate to veterinary dashboard
    navigate('/user/veterinary');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Test Pet-Specific Veterinary Flow</h2>
        <p className="text-gray-600 mb-6">
          Click the button below to test the complete flow from the veterinary dashboard 
          to pet selection to booking an appointment for a specific pet.
        </p>
        <button
          onClick={testFlow}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Test Flow
        </button>
      </div>
    </div>
  );
}