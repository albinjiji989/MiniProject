const mongoose = require('mongoose');

/**
 * MLTrainingData Model
 * Stores real adoption outcome data for incremental ML model training.
 * 
 * When an adoption is completed (handover), a snapshot of the user profile
 * and pet profile is saved here. As real data accumulates, it gradually
 * replaces the synthetic bootstrap data (FIFO replacement).
 * 
 * Used by: SVD, XGBoost, K-Means training pipelines
 */
const mlTrainingDataSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionPet',
    required: true,
    index: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionRequest',
    default: null
  },

  // Snapshot of user's adoption profile at time of adoption
  userProfileSnapshot: {
    homeType: String,
    homeSize: Number,
    hasYard: Boolean,
    yardSize: String,
    activityLevel: Number,
    workSchedule: String,
    hoursAlonePerDay: Number,
    experienceLevel: String,
    previousPets: [String],
    hasChildren: Boolean,
    childrenAges: [Number],
    hasOtherPets: Boolean,
    otherPetDetails: [mongoose.Schema.Types.Mixed],
    monthlyBudget: Number,
    maxAdoptionFee: Number,
    preferredSize: [String],
    preferredSpecies: String,
    preferredBreed: String,
    preferredAge: String,
    lifestyleNotes: String
  },

  // Snapshot of pet's compatibility profile at time of adoption
  petProfileSnapshot: {
    species: String,
    breed: String,
    name: String,
    energyLevel: Number,
    size: String,
    trainedLevel: String,
    childFriendlyScore: Number,
    petFriendlyScore: Number,
    noiseLevel: String,
    exerciseNeeds: String,
    groomingNeeds: String,
    canLiveInApartment: Boolean,
    needsYard: Boolean,
    canBeLeftAlone: Boolean,
    maxHoursAlone: Number,
    estimatedMonthlyCost: Number,
    strangerFriendlyScore: Number,
    temperamentTags: [String]
  },

  // ML match score at time of adoption
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },

  // Which algorithm produced the recommendation
  algorithmUsed: {
    type: String,
    enum: ['content', 'svd', 'xgboost', 'kmeans', 'hybrid', 'none'],
    default: 'none'
  },

  // Adoption outcome
  outcome: {
    type: String,
    enum: ['adopted', 'returned', 'pending'],
    default: 'adopted',
    index: true
  },

  // Whether adoption was successful (not returned within 30 days)
  successfulAdoption: {
    type: Boolean,
    default: true
  },

  // Data source tracking
  dataType: {
    type: String,
    enum: ['real', 'synthetic'],
    default: 'real',
    index: true
  },

  // Dates
  adoptionDate: {
    type: Date,
    default: Date.now
  },
  returnDate: {
    type: Date,
    default: null
  },

  // For SVD training: implicit rating derived from outcome
  implicitRating: {
    type: Number,
    min: 0,
    max: 5,
    default: function () {
      if (this.outcome === 'adopted') return 5;
      if (this.outcome === 'returned') return 0;
      return 3; // pending
    }
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
mlTrainingDataSchema.index({ dataType: 1, createdAt: 1 });
mlTrainingDataSchema.index({ outcome: 1, dataType: 1 });
mlTrainingDataSchema.index({ userId: 1, petId: 1 }, { unique: true });

/**
 * Get all real adoption data for training
 */
mlTrainingDataSchema.statics.getRealTrainingData = async function () {
  return this.find({ dataType: 'real' })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get count of real vs synthetic data
 */
mlTrainingDataSchema.statics.getDataCounts = async function () {
  const counts = await this.aggregate([
    {
      $group: {
        _id: '$dataType',
        count: { $sum: 1 }
      }
    }
  ]);
  return counts.reduce((acc, c) => {
    acc[c._id] = c.count;
    return acc;
  }, { real: 0, synthetic: 0 });
};

/**
 * Get training data formatted for each ML algorithm
 */
mlTrainingDataSchema.statics.getFormattedTrainingData = async function () {
  const allData = await this.find({})
    .sort({ dataType: -1, createdAt: -1 }) // real data first
    .lean();

  // Format for SVD (interactions)
  const svdInteractions = allData.map(d => ({
    userId: d.userId.toString(),
    petId: d.petId.toString(),
    interactionType: d.outcome === 'adopted' ? 'adopted' : d.outcome === 'returned' ? 'returned' : 'applied',
    implicitRating: d.implicitRating,
    timestamp: d.adoptionDate ? d.adoptionDate.toISOString() : new Date().toISOString(),
    dataType: d.dataType
  }));

  // Format for XGBoost (adoption outcomes)
  const xgboostRecords = allData.map(d => ({
    userProfile: d.userProfileSnapshot || {},
    petProfile: d.petProfileSnapshot || {},
    matchScore: d.matchScore || 50,
    successfulAdoption: d.successfulAdoption,
    dataType: d.dataType
  }));

  // Format for K-Means (pet profiles)
  const kmeansProfiles = allData.map(d => ({
    _id: d.petId.toString(),
    name: d.petProfileSnapshot?.name || 'Unknown',
    species: d.petProfileSnapshot?.species || 'Dog',
    breed: d.petProfileSnapshot?.breed || 'Mixed',
    compatibilityProfile: d.petProfileSnapshot || {},
    dataType: d.dataType
  }));

  const counts = await this.getDataCounts();

  return {
    svdInteractions,
    xgboostRecords,
    kmeansProfiles,
    counts,
    totalRecords: allData.length
  };
};

const MLTrainingData = mongoose.model('MLTrainingData', mlTrainingDataSchema);

module.exports = MLTrainingData;
