const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetCategory', required: true },
  speciesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Species', required: true },
  breedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Breed', required: true },
  age: { type: Number, min: 0, default: 0 },
  ageUnit: { type: String, enum: ['weeks', 'months', 'years'], default: 'months' },
  gender: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true },
  receivedCount: { type: Number, default: 0 },
}, { _id: false })

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  storeId: { type: String, index: true },
  storeName: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'submitted', 'received', 'cancelled'], default: 'draft' },
  items: [purchaseOrderItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  notes: { type: String, trim: true },
}, { timestamps: true })

purchaseOrderSchema.statics.generateOrderNumber = async function () {
  const prefix = 'PO'
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  let seq = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${y}${m}${d}-${seq}`
}

module.exports = mongoose.model('PetShopPurchaseOrder', purchaseOrderSchema)
