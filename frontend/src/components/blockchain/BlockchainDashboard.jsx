import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import axios from 'axios';

/**
 * Blockchain Statistics Dashboard Component
 * For managers to view blockchain integrity and statistics
 */
const BlockchainDashboard = () => {
  const [stats, setStats] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/petshop/blockchain/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching blockchain stats:', err);
    }
  };

  const verifyBlockchain = async () => {
    setVerifying(true);
    try {
      const response = await axios.get('/api/petshop/blockchain/verify');
      if (response.data.success) {
        setVerification(response.data.data);
      }
    } catch (err) {
      console.error('Error verifying blockchain:', err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), verifyBlockchain()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading blockchain data...</span>
      </div>
    );
  }

  return (
    <div className="blockchain-dashboard space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8" />
          Petshop Blockchain Security
        </h2>
        <p className="mt-2 opacity-90">
          Tamper-proof ledger with SHA-256 encryption and Proof of Work
        </p>
      </div>

      {/* Verification Status */}
      {verification && (
        <div className={`p-6 rounded-lg shadow-lg border-2 ${
          verification.valid 
            ? 'bg-green-50 border-green-500' 
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {verification.valid ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {verification.message}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Total Blocks: {verification.totalBlocks}
                </p>
              </div>
            </div>
            <button
              onClick={verifyBlockchain}
              disabled={verifying}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              Re-verify
            </button>
          </div>

          {verification.errors && verification.errors.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <h4 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                Integrity Issues Detected
              </h4>
              <ul className="space-y-2">
                {verification.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600">
                    Block #{error.block}: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Blocks */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Blocks</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.totalBlocks}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          {/* Algorithm */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security</p>
                <p className="text-xl font-bold text-purple-600 mt-2">
                  {stats.algorithm}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Difficulty: {stats.difficulty}
                </p>
              </div>
              <Shield className="w-12 h-12 text-purple-400" />
            </div>
          </div>

          {/* Chain Age */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div>
              <p className="text-sm text-gray-600">First Block</p>
              <p className="text-sm font-semibold text-gray-800 mt-2">
                {stats.firstBlockDate 
                  ? new Date(stats.firstBlockDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Latest Block */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Latest Block</p>
              <p className="text-sm font-semibold text-gray-800 mt-2">
                {stats.lastBlockDate 
                  ? new Date(stats.lastBlockDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Event Types Breakdown */}
      {stats?.eventTypes && stats.eventTypes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Event Distribution
          </h3>
          <div className="space-y-3">
            {stats.eventTypes.map((event, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {event._id.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {event.count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(event.count / stats.totalBlocks) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainDashboard;
