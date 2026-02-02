import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Clock, Lock } from 'lucide-react';
import axios from 'axios';

/**
 * Blockchain Verification Badge Component
 * Displays blockchain verification status for petshop pets
 * Shows authenticity, ownership history, and tamper-proof records
 */
const BlockchainVerificationBadge = ({ petCode, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [blockchainData, setBlockchainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBlockchainHistory = async () => {
    if (blockchainData) {
      setIsExpanded(!isExpanded);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/petshop/blockchain/pet/${petCode}`);
      if (response.data.success) {
        setBlockchainData(response.data.data);
        setIsExpanded(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch blockchain data');
      console.error('Blockchain fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'pet_created':
      case 'PET_CREATED':
        return '🏷️';
      case 'batch_created':
      case 'BATCH_CREATED':
        return '📦';
      case 'pet_reserved':
      case 'PET_RESERVED':
        return '🔒';
      case 'pet_sold':
      case 'PET_SOLD':
        return '💰';
      case 'ownership_transferred':
      case 'OWNERSHIP_TRANSFERRED':
        return '🔑';
      default:
        return '📝';
    }
  };

  const getEventLabel = (eventType) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`blockchain-verification ${className}`}>
      {/* Verification Badge */}
      <button
        onClick={fetchBlockchainHistory}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
      >
        <Shield className="w-5 h-5" />
        <span className="font-medium">
          {loading ? 'Verifying...' : 'Blockchain Verified'}
        </span>
        <CheckCircle className="w-4 h-4" />
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Blockchain History Panel */}
      {isExpanded && blockchainData && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Blockchain Certificate of Authenticity
            </h3>
            <p className="text-sm opacity-90 mt-1">
              Tamper-proof records secured with SHA-256 encryption
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {blockchainData.totalEvents}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                <CheckCircle className="w-6 h-6 inline" />
              </div>
              <div className="text-xs text-gray-600 mt-1">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {blockchainData.history?.[0]?.nonce || '00'}
              </div>
              <div className="text-xs text-gray-600 mt-1">Proof of Work</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-4 max-h-96 overflow-y-auto">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Complete History
            </h4>
            
            <div className="space-y-3">
              {blockchainData.history?.map((event, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {getEventIcon(event.eventType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-semibold text-gray-800 text-sm">
                        {getEventLabel(event.eventType)}
                      </h5>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        Block #{event.blockNumber}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>

                    {/* Hash (truncated) */}
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono text-gray-700 truncate">
                        {event.hash?.substring(0, 16)}...{event.hash?.substring(event.hash.length - 8)}
                      </code>
                      {event.verified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>

                    {/* Event details */}
                    {event.eventData && (
                      <div className="mt-2 text-xs text-gray-600">
                        {event.eventData.price && (
                          <span className="inline-block mr-3">
                            💵 ₹{event.eventData.price}
                          </span>
                        )}
                        {event.eventData.newStatus && (
                          <span className="inline-block">
                            Status: {event.eventData.newStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              🔐 Secured with SHA-256 cryptographic hashing | 
              Immutable blockchain ledger | 
              Verified authenticity
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainVerificationBadge;
