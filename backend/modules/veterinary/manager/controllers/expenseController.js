const VeterinaryExpense = require('../../models/VeterinaryExpense');

// Get all expenses
exports.getExpenses = async (req, res) => {
  try {
    const { category, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const storeId = req.user.storeId;

    const filter = { storeId, isActive: true };
    
    if (category) filter.category = category;
    if (status) filter.paymentStatus = status;
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      VeterinaryExpense.find(filter)
        .sort({ expenseDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name')
        .populate('approvedBy', 'name'),
      VeterinaryExpense.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

// Get single expense
exports.getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const expense = await VeterinaryExpense.findOne({ _id: id, storeId })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expense' });
  }
};

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const storeName = req.user.storeName;

    const expense = new VeterinaryExpense({
      ...req.body,
      storeId,
      storeName,
      createdBy: req.user.id
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create expense' });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const expense = await VeterinaryExpense.findOne({ _id: id, storeId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    Object.assign(expense, req.body);
    expense.updatedBy = req.user.id;
    await expense.save();

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const expense = await VeterinaryExpense.findOne({ _id: id, storeId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    expense.isActive = false;
    expense.updatedBy = req.user.id;
    await expense.save();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
};

// Mark expense as paid
exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentMethod, paidDate } = req.body;
    const storeId = req.user.storeId;

    const expense = await VeterinaryExpense.findOne({ _id: id, storeId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    expense.paidAmount = paidAmount || expense.amount;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.paidDate = paidDate || new Date();
    expense.paymentStatus = expense.paidAmount >= expense.amount ? 'paid' : 'partially_paid';
    expense.updatedBy = req.user.id;
    
    await expense.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: expense
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
};

// Get expense statistics
exports.getExpenseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const storeId = req.user.storeId;

    const dateFilter = { storeId, isActive: true };
    if (startDate || endDate) {
      dateFilter.expenseDate = {};
      if (startDate) dateFilter.expenseDate.$gte = new Date(startDate);
      if (endDate) dateFilter.expenseDate.$lte = new Date(endDate);
    }

    const [
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      categoryBreakdown
    ] = await Promise.all([
      VeterinaryExpense.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      VeterinaryExpense.aggregate([
        { $match: { ...dateFilter, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),
      VeterinaryExpense.aggregate([
        { $match: { ...dateFilter, paymentStatus: { $in: ['pending', 'partially_paid'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
      ]),
      VeterinaryExpense.aggregate([
        { $match: dateFilter },
        { $group: { 
          _id: '$category', 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }},
        { $sort: { total: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalExpenses: totalExpenses[0]?.total || 0,
        paidExpenses: paidExpenses[0]?.total || 0,
        pendingExpenses: pendingExpenses[0]?.total || 0,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
