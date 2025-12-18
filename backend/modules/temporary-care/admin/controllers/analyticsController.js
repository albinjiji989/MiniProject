const TemporaryCare = require('../../models/TemporaryCare');
const TemporaryCareRequest = require('../../user/models/TemporaryCareRequest');
const TemporaryCarePayment = require('../../models/TemporaryCarePayment');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const Caregiver = require('../../manager/models/Caregiver');

// Get overall statistics
const getStats = async (req, res) => {
  try {
    // Total centers
    const totalCenters = await TemporaryCareCenter.countDocuments();
    const activeCenters = await TemporaryCareCenter.countDocuments({ isActive: true });
    
    // Total caregivers
    const totalCaregivers = await Caregiver.countDocuments();
    const availableCaregivers = await Caregiver.countDocuments({ status: 'available' });
    
    // Total requests
    const totalRequests = await TemporaryCareRequest.countDocuments();
    const pendingRequests = await TemporaryCareRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await TemporaryCareRequest.countDocuments({ status: 'approved' });
    const activeRequests = await TemporaryCareRequest.countDocuments({ status: 'assigned' });
    
    // Total care records
    const totalCares = await TemporaryCare.countDocuments();
    const activeCares = await TemporaryCare.countDocuments({ status: 'active' });
    const completedCares = await TemporaryCare.countDocuments({ status: 'completed' });
    
    // Payments
    const totalPayments = await TemporaryCarePayment.countDocuments();
    const completedPayments = await TemporaryCarePayment.countDocuments({ status: 'completed' });
    const totalPaymentAmount = await TemporaryCarePayment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const revenue = totalPaymentAmount.length > 0 ? totalPaymentAmount[0].total : 0;
    
    res.json({ 
      success: true, 
      data: { 
        centers: {
          total: totalCenters,
          active: activeCenters
        },
        caregivers: {
          total: totalCaregivers,
          available: availableCaregivers
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          active: activeRequests
        },
        cares: {
          total: totalCares,
          active: activeCares,
          completed: completedCares
        },
        payments: {
          total: totalPayments,
          completed: completedPayments,
          revenue: revenue
        }
      } 
    });
  } catch (e) {
    console.error('Admin get stats error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get revenue reports
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = { status: 'completed' };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    const payments = await TemporaryCarePayment.find(matchQuery)
      .populate('temporaryCareId', 'storeId storeName')
      .sort({ createdAt: -1 });
    
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Group by store
    const revenueByStore = {};
    payments.forEach(payment => {
      const storeId = payment.temporaryCareId?.storeId || 'unknown';
      const storeName = payment.temporaryCareId?.storeName || 'Unknown Store';
      
      if (!revenueByStore[storeId]) {
        revenueByStore[storeId] = {
          storeName,
          amount: 0,
          count: 0
        };
      }
      
      revenueByStore[storeId].amount += payment.amount || 0;
      revenueByStore[storeId].count += 1;
    });
    
    res.json({ 
      success: true, 
      data: { 
        payments,
        totalRevenue,
        revenueByStore
      } 
    });
  } catch (e) {
    console.error('Admin get revenue report error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get care type distribution
const getCareTypeDistribution = async (req, res) => {
  try {
    const distribution = await TemporaryCare.aggregate([
      { $group: { _id: '$careType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ 
      success: true, 
      data: { distribution } 
    });
  } catch (e) {
    console.error('Admin get care type distribution error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getStats,
  getRevenueReport,
  getCareTypeDistribution
};