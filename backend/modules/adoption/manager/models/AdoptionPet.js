const mongoose = require('mongoose');

const adoptionPetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  breed: {
    type: String,
    required: true,
    trim: true,
  },
  species: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  ageUnit: {
    type: String,
    enum: ['years', 'months', 'weeks', 'days'],
    default: 'months',
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: false,
    default: 'male'
  },
  color: {
    type: String,
    required: false,
    default: 'unknown'
  },
  weight: {
    type: Number,
    required: false,
    default: 0,
  },
  healthStatus: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'needs_attention'],
    default: 'good',
  },
  vaccinationStatus: {
    type: String,
    enum: ['up_to_date', 'partial', 'not_vaccinated'],
    default: 'not_vaccinated',
  },
  // Optional: array form to align with spec; keep string for back-compat
  vaccinationStatusList: [{ type: String }],
  temperament: {
    type: String,
    enum: ['calm', 'energetic', 'playful', 'shy', 'aggressive', 'friendly'],
    default: 'friendly',
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  // Spec alias field (keep alongside description)
  healthHistory: { type: String },
  // References to separate Image and Document collections
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  status: {
    type: String,
    enum: ['available', 'reserved', 'adopted'],
    default: 'available',
  },
  adoptionFee: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  // Unique adoption pet code: 3 letters (A-Z) + 5 digits
  petCode: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]{3}\d{5}$/.test(v)
      },
      message: 'petCode must be 3 uppercase letters followed by 5 digits'
    }
  },
  adopterUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  adoptionDate: {
    type: Date,
    default: null,
  },
  specialNeeds: [{
    type: String,
  }],
  medicalHistory: [{
    date: Date,
    description: String,
    veterinarian: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Include virtuals in JSON/Object outputs
adoptionPetSchema.set('toJSON', { virtuals: true })
adoptionPetSchema.set('toObject', { virtuals: true })

// Virtuals for populating images and documents
adoptionPetSchema.virtual('images', {
  ref: 'Image',
  localField: 'imageIds',
  foreignField: '_id',
  justOne: false
});

adoptionPetSchema.virtual('documents', {
  ref: 'Document',
  localField: 'documentIds',
  foreignField: '_id',
  justOne: false
});

// Indexes for better query performance
adoptionPetSchema.index({ status: 1 });
adoptionPetSchema.index({ breed: 1 });
adoptionPetSchema.index({ species: 1 });
adoptionPetSchema.index({ adopterUserId: 1 });
adoptionPetSchema.index({ createdBy: 1 });
adoptionPetSchema.index({ petCode: 1 }, { unique: true, sparse: true });

// Virtual for age display
adoptionPetSchema.virtual('ageDisplay').get(function() {
  const n = this.age || 0
  switch (this.ageUnit) {
    case 'years':
      return `${n} year${n !== 1 ? 's' : ''}`
    case 'months': {
      // Support mixed years+months if months >= 12
      const years = Math.floor(n / 12)
      const months = n % 12
      if (years > 0 && months > 0) {
        return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
      }
      if (years > 0) return `${years} year${years !== 1 ? 's' : ''}`
      return `${months} month${months !== 1 ? 's' : ''}`
    }
    case 'weeks':
      return `${n} week${n !== 1 ? 's' : ''}`
    case 'days':
      return `${n} day${n !== 1 ? 's' : ''}`
    default:
      return `${n}`
  }
});

// Spec-friendly virtuals
adoptionPetSchema.virtual('photos').get(function() {
  // This will work with populated images
  if (this.images && this.images.length > 0) {
    return this.images.map(img => ({ url: img.url, caption: img.caption }));
  }
  return [];
})

adoptionPetSchema.virtual('availabilityStatus').get(function() {
  return this.status
})

adoptionPetSchema.virtual('documentsUrls').get(function() {
  // This will work with populated documents
  if (this.documents && this.documents.length > 0) {
    return this.documents.map(d => d.url).filter(Boolean);
  }
  return [];
})

// Method to check if pet is available for adoption
adoptionPetSchema.methods.isAvailable = function() {
  return this.status === 'available' && this.isActive;
};

// Method to reserve pet
adoptionPetSchema.methods.reserve = function(userId) {
  if (this.status === 'available') {
    this.status = 'reserved';
    this.adopterUserId = userId;
    return true;
  }
  return false;
};

// Method to complete adoption
adoptionPetSchema.methods.completeAdoption = function() {
  if (this.status === 'reserved') {
    this.status = 'adopted';
    this.adoptionDate = new Date();
    return true;
  }
  return false;
};

// Static: generate unique pet code using centralized generator
adoptionPetSchema.statics.generatePetCode = async function() {
  const PetCodeGenerator = require('../../../../core/utils/petCodeGenerator')
  return await PetCodeGenerator.generateUniquePetCode()
}

// Pre-save: assign petCode if missing
adoptionPetSchema.pre('save', async function(next) {
  try {
    if (!this.petCode) {
      const Model = this.constructor
      this.petCode = await Model.generatePetCode()
    }
    next()
  } catch (err) {
    next(err)
  }
})

// Pre-insertMany: assign codes for bulk inserts (e.g., CSV import)
adoptionPetSchema.pre('insertMany', async function(docs) {
  const Model = this.model ? this.model : this.constructor
  for (const doc of docs) {
    if (!doc.petCode) {
      // eslint-disable-next-line no-await-in-loop
      doc.petCode = await Model.generatePetCode()
    }
  }
})

module.exports = mongoose.model('AdoptionPet', adoptionPetSchema);
