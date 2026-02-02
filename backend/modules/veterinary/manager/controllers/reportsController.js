const VeterinaryAppointment = require('../../models/VeterinaryAppointment');
const VeterinaryMedicalRecord = require('../../models/VeterinaryMedicalRecord');
const VeterinaryExpense = require('../../models/VeterinaryExpense');
const VeterinaryInventory = require('../../models/VeterinaryInventory');
const VeterinaryService = require('../../models/VeterinaryService');

// Get financial report
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const storeId = req.user.storeId;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    // Revenue from appointments
    const appointmentRevenue = await VeterinaryAppointment.aggregate([
      {
        $match: {
          storeId,
          appointmentDate: dateFilter,
          status: { $in: ['completed', 'confirmed'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue from medical records
    const medicalRecordRevenue = await VeterinaryMedicalRecord.aggregate([
      {
        $match: {
          storeId,
          visitDate: dateFilter,
          paymentStatus: { $in: ['paid', 'partially_paid'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Expenses
    const expenses = await VeterinaryExpense.aggregate([
      {
        $match: {
          storeId,
          expenseDate: dateFilter,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          paid: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalRevenue = (appointmentRevenue[0]?.total || 0) + (medicalRecordRevenue[0]?.total || 0);
    const netProfit = totalRevenue - totalExpenses;

    // Daily revenue trend
    const dailyRevenue = await VeterinaryAppointment.aggregate([
      {
        $match: {
          storeId,
          appointmentDate: dateFilter,
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
        },
        revenue: {
          appointments: appointmentRevenue[0]?.total || 0,
          appointmentCount: appointmentRevenue[0]?.count || 0,
          medicalRecords: medicalRecordRevenue[0]?.total || 0,
          recordCount: medicalRecordRevenue[0]?.count || 0
        },
        expenses: {
          total: totalExpenses,
          breakdown: expenses
        },
        trends: {
          daily: dailyRevenue
        }
      }
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate financial report' });
  }
};

// Get appointment analytics
exports.getAppointmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const storeId = req.user.storeId;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    const [
      statusBreakdown,
      bookingTypeBreakdown,
      serviceBreakdown,
      dailyAppointments
    ] = await Promise.all([
      VeterinaryAppointment.aggregate([
        { $match: { storeId, appointmentDate: dateFilter } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      VeterinaryAppointment.aggregate([
        { $match: { storeId, appointmentDate: dateFilter } },
        { $group: { _id: '$bookingType', count: { $sum: 1 } } }
      ]),
      VeterinaryAppointment.aggregate([
        { $match: { storeId, appointmentDate: dateFilter } },
        { $lookup: { from: 'veterinaryservices', localField: 'serviceId', foreignField: '_id', as: 'service' } },
        { $unwind: '$service' },
        { $group: { _id: '$service.name', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      VeterinaryAppointment.aggregate([
        { $match: { storeId, appointmentDate: dateFilter } },
        { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalAppointments = statusBreakdown.reduce((sum, item) => sum + item.count, 0);

    res.json({
      success: true,
      data: {
        totalAppointments,
        statusBreakdown,
        bookingTypeBreakdown,
        topServices: serviceBreakdown,
        dailyTrend: dailyAppointments
      }
    });
  } catch (error) {
    console.error('Get appointment analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate appointment analytics' });
  }
};

// Get patient analytics
exports.getPatientAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const storeId = req.user.storeId;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    // Get unique patients (pets) who had appointments
    const uniquePatients = await VeterinaryAppointment.aggregate([
      { $match: { storeId, appointmentDate: dateFilter } },
      { $group: { _id: '$petId' } },
      { $count: 'total' }
    ]);

    // New patients (first visit)
    const newPatients = await VeterinaryMedicalRecord.aggregate([
      { $match: { storeId, visitDate: dateFilter } },
      { $group: { _id: '$pet', firstVisit: { $min: '$visitDate' } } },
      { $match: { firstVisit: dateFilter } },
      { $count: 'total' }
    ]);

    // Most common diagnoses
    const commonDiagnoses = await VeterinaryMedicalRecord.aggregate([
      { $match: { storeId, visitDate: dateFilter } },
      { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Patient retention (returning patients)
    const returningPatients = await VeterinaryAppointment.aggregate([
      { $match: { storeId, appointmentDate: dateFilter } },
      { $group: { _id: '$petId', visits: { $sum: 1 } } },
      { $match: { visits: { $gt: 1 } } },
      { $count: 'total' }
    ]);

    res.json({
      success: true,
      data: {
        totalPatients: uniquePatients[0]?.total || 0,
        newPatients: newPatients[0]?.total || 0,
        returningPatients: returningPatients[0]?.total || 0,
        retentionRate: uniquePatients[0]?.total > 0 
          ? ((returningPatients[0]?.total || 0) / uniquePatients[0].total * 100).toFixed(2)
          : 0,
        commonDiagnoses
      }
    });
  } catch (error) {
    console.error('Get patient analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate patient analytics' });
  }
};

// Get inventory report
exports.getInventoryReport = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    const [
      totalValue,
      categoryBreakdown,
      lowStockItems,
      expiringItems,
      topValueItems
    ] = await Promise.all([
      VeterinaryInventory.aggregate([
        { $match: { storeId, isActive: true } },
        { $group: { _id: null, total: { $sum: '$totalValue' } } }
      ]),
      VeterinaryInventory.aggregate([
        { $match: { storeId, isActive: true } },
        { $group: { 
          _id: '$category',
          totalValue: { $sum: '$totalValue' },
          itemCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }}
      ]),
      VeterinaryInventory.find({ 
        storeId, 
        isActive: true, 
        lowStockAlert: true 
      }).select('itemName quantity minStockLevel category').limit(20),
      VeterinaryInventory.find({ 
        storeId, 
        isActive: true, 
        expiryAlert: true 
      }).select('itemName expiryDate quantity category').sort({ expiryDate: 1 }).limit(20),
      VeterinaryInventory.find({ 
        storeId, 
        isActive: true 
      }).select('itemName totalValue quantity category').sort({ totalValue: -1 }).limit(10)
    ]);

    res.json({
      success: true,
      data: {
        totalValue: totalValue[0]?.total || 0,
        categoryBreakdown,
        alerts: {
          lowStock: lowStockItems,
          expiringSoon: expiringItems
        },
        topValueItems
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate inventory report' });
  }
};

// Get staff performance report
exports.getStaffPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const storeId = req.user.storeId;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    // Consultations by staff
    const staffConsultations = await VeterinaryMedicalRecord.aggregate([
      { $match: { storeId, visitDate: dateFilter } },
      { $lookup: { from: 'users', localField: 'staff', foreignField: '_id', as: 'staffInfo' } },
      { $unwind: { path: '$staffInfo', preserveNullAndEmptyArrays: true } },
      { $group: { 
        _id: '$staff',
        staffName: { $first: '$staffInfo.name' },
        consultations: { $sum: 1 },
        totalRevenue: { $sum: '$amountPaid' }
      }},
      { $sort: { consultations: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        staffPerformance: staffConsultations
      }
    });
  } catch (error) {
    console.error('Get staff performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate staff performance report' });
  }
};

// Get comprehensive dashboard report
exports.getDashboardReport = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      todayAppointments,
      monthAppointments,
      monthRevenue,
      monthExpenses,
      lowStockCount,
      expiringCount,
      pendingAppointments
    ] = await Promise.all([
      VeterinaryAppointment.countDocuments({ 
        storeId, 
        appointmentDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      }),
      VeterinaryAppointment.countDocuments({ 
        storeId, 
        appointmentDate: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      VeterinaryAppointment.aggregate([
        { 
          $match: { 
            storeId, 
            appointmentDate: { $gte: startOfMonth, $lte: endOfMonth },
            paymentStatus: 'paid'
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      VeterinaryExpense.aggregate([
        { 
          $match: { 
            storeId, 
            expenseDate: { $gte: startOfMonth, $lte: endOfMonth },
            isActive: true
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      VeterinaryInventory.countDocuments({ storeId, isActive: true, lowStockAlert: true }),
      VeterinaryInventory.countDocuments({ storeId, isActive: true, expiryAlert: true }),
      VeterinaryAppointment.countDocuments({ 
        storeId, 
        status: { $in: ['pending_approval', 'scheduled'] }
      })
    ]);

    const revenue = monthRevenue[0]?.total || 0;
    const expenses = monthExpenses[0]?.total || 0;
    const profit = revenue - expenses;

    res.json({
      success: true,
      data: {
        today: {
          appointments: todayAppointments
        },
        thisMonth: {
          appointments: monthAppointments,
          revenue,
          expenses,
          profit,
          profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0
        },
        alerts: {
          lowStock: lowStockCount,
          expiringSoon: expiringCount,
          pendingAppointments
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate dashboard report' });
  }
};
