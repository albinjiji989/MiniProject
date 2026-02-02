const mongoose = require('mongoose');

const veterinaryExpenseSchema = new mongoose.Schema({
  // Expense details
  expenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    enum: ['salary', 'rent', 'utilities', 'supplies', 'equipment', 'maintenance', 'marketing', 'insurance', 'taxes', 'other'],
    required: [true, 'Category is required'],
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Amount
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },

  // Payment details
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'upi', 'cheque', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'overdue'],
    default: 'pending',
    index: true
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },

  // Vendor/Payee
  vendor: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },

  // Dates
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    index: true
  },
  dueDate: {
    type: Date
  },
  paidDate: {
    type: Date
  },

  // Attachments
  attachments: [{
    name: { type: String, trim: true },
    url: { type: String },
    type: { type: String }
  }],

  // Recurring expense
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
  },

  // Store information
  storeId: {
    type: String,
    required: [true, 'Store ID is required'],
    index: true
  },
  storeName: {
    type: String,
    trim: true
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
veterinaryExpenseSchema.index({ storeId: 1, expenseDate: -1 });
veterinaryExpenseSchema.index({ storeId: 1, category: 1, expenseDate: -1 });
veterinaryExpenseSchema.index({ paymentStatus: 1, dueDate: 1 });

// Generate expense number
veterinaryExpenseSchema.pre('save', async function(next) {
  if (!this.expenseNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.expenseNumber = `EXP-${year}${month}-${random}`;
  }
  next();
});

// Virtual for balance due
veterinaryExpenseSchema.virtual('balanceDue').get(function() {
  return Math.max(0, this.amount - (this.paidAmount || 0));
});

veterinaryExpenseSchema.set('toJSON', { virtuals: true });
veterinaryExpenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VeterinaryExpense', veterinaryExpenseSchema);
