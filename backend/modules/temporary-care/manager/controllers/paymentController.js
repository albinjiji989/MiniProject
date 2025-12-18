const TemporaryCarePayment = require('../../models/TemporaryCarePayment');
const TemporaryCare = require('../../models/TemporaryCare');

// List payments for the manager's store
const listPayments = async (req, res) => {
  try {
    const { status, paymentType, page = 1, limit = 10 } = req.query;
    
    if (!req.user.storeId) {
      return res.status(400).json({ success: false, message: 'Manager has no storeId' });
    }
    
    // First get all temporary care IDs for this store
    const cares = await TemporaryCare.find({ storeId: req.user.storeId }, '_id');
    const careIds = cares.map(care => care._id);
    
    const filter = { temporaryCareId: { $in: careIds } };
    
    if (status) {
      filter.status = status;
    }
    
    if (paymentType) {
      filter.paymentType = paymentType;
    }
    
    const items = await TemporaryCarePayment.find(filter)
      .populate('userId', 'name email')
      .populate('temporaryCareId', 'pet startDate endDate')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10), 50))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10));
      
    const total = await TemporaryCarePayment.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: { 
        payments: items, 
        pagination: { 
          current: parseInt(page, 10), 
          pages: Math.ceil(total / parseInt(limit, 10) || 1), 
          total 
        } 
      } 
    });
  } catch (e) {
    console.error('List payments error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get payment details
const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await TemporaryCarePayment.findById(id)
      .populate('userId', 'name email')
      .populate('temporaryCareId', 'pet startDate endDate storeId');
      
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Verify this payment belongs to manager's store
    if (payment.temporaryCareId.storeId !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Not your store payment' });
    }
    
    res.json({ success: true, data: { payment } });
  } catch (e) {
    console.error('Get payment error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Process a refund
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, refundReason } = req.body;
    
    const payment = await TemporaryCarePayment.findById(id)
      .populate('temporaryCareId', 'storeId');
      
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Verify this payment belongs to manager's store
    if (payment.temporaryCareId.storeId !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Not your store payment' });
    }
    
    // Check if payment is completed
    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });
    }
    
    // Check if already refunded
    if (payment.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'Payment already refunded' });
    }
    
    // In a real implementation, you would integrate with Razorpay to process the actual refund
    // For now, we'll just update the record
    
    payment.status = 'refunded';
    payment.refund = {
      refundAmount: refundAmount || payment.amount,
      refundReason: refundReason || 'Manager initiated refund',
      refundedAt: new Date()
    };
    
    await payment.save();
    
    res.json({ 
      success: true, 
      message: 'Refund processed successfully',
      data: { payment } 
    });
  } catch (e) {
    console.error('Process refund error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listPayments,
  getPayment,
  processRefund
};