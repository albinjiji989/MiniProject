const { Medicine, Prescription, PharmacyOrder } = require('../../models/Pharmacy');
const UserDetails = require('../../../core/models/UserDetails');

// Get all medicines (manager view)
const getMedicines = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { category, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    
    const medicines = await Medicine.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Medicine.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        medicines,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ success: false, message: 'Error fetching medicines' });
  }
};

// Create/update medicine
const createOrUpdateMedicine = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { medicineId, name, description, category, price, costPrice, dosage, manufacturer, expiryDate, batchNumber, requiresPrescription, usedFor, sideEffects, contraindications, storageInstructions, petTypes, stock } = req.body;
    
    let medicine;
    if (medicineId) {
      medicine = await Medicine.findByIdAndUpdate(
        medicineId,
        {
          name, description, category, price, costPrice, dosage, manufacturer, 
          expiryDate, batchNumber, requiresPrescription, usedFor, sideEffects, 
          contraindications, storageInstructions, petTypes,
          'stock.current': stock?.current,
          'stock.reorderLevel': stock?.reorderLevel
        },
        { new: true }
      );
    } else {
      medicine = new Medicine({
        name, description, category, price, costPrice, dosage, manufacturer, 
        expiryDate, batchNumber, requiresPrescription, usedFor, sideEffects, 
        contraindications, storageInstructions, petTypes,
        stock: stock || { current: 0, reorderLevel: 5 }
      });
      await medicine.save();
    }
    
    res.json({ success: true, message: 'Medicine saved', data: { medicine } });
  } catch (error) {
    console.error('Error saving medicine:', error);
    res.status(500).json({ success: false, message: 'Error saving medicine' });
  }
};

// Delete medicine
const deleteMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    
    await Medicine.findByIdAndUpdate(medicineId, { isActive: false });
    
    res.json({ success: true, message: 'Medicine deleted' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ success: false, message: 'Error deleting medicine' });
  }
};

// Get pending prescriptions
const getPendingPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const prescriptions = await Prescription.find({ status: 'pending' })
      .populate('userId', 'name email phone')
      .populate('medicineId', 'name dosage')
      .populate('petId', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Prescription.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ success: false, message: 'Error fetching prescriptions' });
  }
};

// Approve prescription
const approvePrescription = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { prescriptionId } = req.params;
    const { notes } = req.body;
    
    const prescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        status: 'approved',
        approvedBy: managerId,
        approvalDate: new Date(),
        notes
      },
      { new: true }
    ).populate('userId', 'name email').populate('medicineId', 'name dosage');
    
    res.json({ success: true, message: 'Prescription approved', data: { prescription } });
  } catch (error) {
    console.error('Error approving prescription:', error);
    res.status(500).json({ success: false, message: 'Error approving prescription' });
  }
};

// Reject prescription
const rejectPrescription = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { prescriptionId } = req.params;
    const { rejectionReason } = req.body;
    
    const prescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        status: 'rejected',
        approvedBy: managerId,
        approvalDate: new Date(),
        rejectionReason
      },
      { new: true }
    ).populate('userId', 'name email').populate('medicineId', 'name dosage');
    
    res.json({ success: true, message: 'Prescription rejected', data: { prescription } });
  } catch (error) {
    console.error('Error rejecting prescription:', error);
    res.status(500).json({ success: false, message: 'Error rejecting prescription' });
  }
};

// Get all orders (manager view)
const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) query.shippingStatus = status;
    
    const orders = await PharmacyOrder.find(query)
      .populate('userId', 'name email phone')
      .populate('items.medicineId', 'name dosage')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await PharmacyOrder.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { shippingStatus, notes } = req.body;
    
    const order = await PharmacyOrder.findByIdAndUpdate(
      orderId,
      {
        shippingStatus,
        $push: {
          timeline: {
            status: shippingStatus,
            timestamp: new Date(),
            notes
          }
        }
      },
      { new: true }
    ).populate('items.medicineId');
    
    res.json({ success: true, message: 'Order updated', data: { order } });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Error updating order' });
  }
};

// Get pharmacy reports
const getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const totalOrders = await PharmacyOrder.countDocuments(query);
    const totalRevenue = await PharmacyOrder.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const ordersByStatus = await PharmacyOrder.aggregate([
      { $match: query },
      { $group: { _id: '$shippingStatus', count: { $sum: 1 } } }
    ]);
    
    const topMedicines = await PharmacyOrder.aggregate([
      { $match: query },
      { $unwind: '$items' },
      { $group: { _id: '$items.medicineId', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.totalPrice' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'medicines', localField: '_id', foreignField: '_id', as: 'medicine' } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByStatus,
        topMedicines
      }
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ success: false, message: 'Error generating reports' });
  }
};

module.exports = {
  getMedicines,
  createOrUpdateMedicine,
  deleteMedicine,
  getPendingPrescriptions,
  approvePrescription,
  rejectPrescription,
  getOrders,
  updateOrderStatus,
  getReports
};
