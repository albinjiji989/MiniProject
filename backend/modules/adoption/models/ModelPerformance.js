const mongoose = require('mongoose');

/**
 * ModelPerformance Model
 * Tracks ML model training and performance metrics over time
 * Used for research analysis and A/B testing
 */
const modelPerformanceSchema = new mongoose.Schema({
  modelType: {
    type: String,
    enum: ['content', 'svd', 'xgboost', 'kmeans', 'hybrid'],
    required: true,
    index: true
  },
  version: {
    type: String,
    required: true  // e.g., 'v1.0', 'v1.1', 'v2.0'
  },
  trainedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  trainingDataCount: {
    type: Number,
    required: true,
    default: 0  // Number of samples used for training
  },
  trainingDuration: {
    type: Number,
    default: 0  // Training time in seconds
  },
  
  // Performance Metrics
  metrics: {
    accuracy: { type: Number, min: 0, max: 100, default: 0 },
    precision: { type: Number, min: 0, max: 100, default: 0 },
    recall: { type: Number, min: 0, max: 100, default: 0 },
    f1Score: { type: Number, min: 0, max: 100, default: 0 },
    aucRoc: { type: Number, min: 0, max: 1, default: 0 },
    
    // Confusion Matrix [[TN, FP], [FN, TP]]
    confusionMatrix: {
      type: [[Number]],
      default: [[0, 0], [0, 0]]
    },
    
    // Cross-validation scores
    cvScores: {
      type: [Number],
      default: []
    },
    cvMean: { type: Number, default: 0 },
    cvStd: { type: Number, default: 0 },
    
    // Additional metrics for specific algorithms
    mae: { type: Number, default: 0 },  // Mean Absolute Error (for regression)
    rmse: { type: Number, default: 0 }, // Root Mean Squared Error
    silhouetteScore: { type: Number, default: 0 }  // For clustering (K-Means)
  },
  
  // Feature Importance (for XGBoost, Random Forest, etc.)
  featureImportance: [{
    feature: { type: String, required: true },
    importance: { type: Number, required: true },
    rank: { type: Number }
  }],
  
  // Hyperparameters used during training
  hyperparameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Model file information
  modelPath: {
    type: String,
    default: ''  // Path to saved model file
  },
  modelSize: {
    type: Number,
    default: 0  // Model file size in bytes
  },
  
  // For K-Means clustering
  clusterInfo: {
    optimalK: { type: Number },
    clusterNames: {
      type: Map,
      of: String
    },
    clusterCharacteristics: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Deployment status
  isActive: {
    type: Boolean,
    default: false  // Only one version should be active per model type
  },
  deployedDate: {
    type: Date
  },
  
  // A/B Testing data
  abTestResults: {
    controlGroupSize: { type: Number, default: 0 },
    testGroupSize: { type: Number, default: 0 },
    controlSuccessRate: { type: Number, default: 0 },
    testSuccessRate: { type: Number, default: 0 },
    pValue: { type: Number, default: 1 },  // Statistical significance
    isSignificant: { type: Boolean, default: false }  // p < 0.05
  },
  
  // Training metadata
  trainedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  trainingNotes: {
    type: String,
    default: ''
  },
  
  // Error logs (if training failed)
  trainingErrors: [{
    timestamp: Date,
    error: String,
    stackTrace: String
  }],
  
  // Production metrics (after deployment)
  productionMetrics: {
    totalPredictions: { type: Number, default: 0 },
    avgPredictionTime: { type: Number, default: 0 },  // milliseconds
    successfulAdoptions: { type: Number, default: 0 },
    failedAdoptions: { type: Number, default: 0 },
    actualAccuracy: { type: Number, default: 0 }  // Based on real outcomes
  },
  
  // Model comparison — logged after each retrain, compares new vs previous model
  modelComparison: {
    previousVersion: { type: String },
    previousTrainedDate: { type: Date },
    previousDataCount: { type: Number },
    changes: {
      type: mongoose.Schema.Types.Mixed,  // { metric: { previous, current, delta, percentChange, improved } }
      default: {}
    },
    summary: { type: String }  // e.g., "3/5 metrics improved"
  }
}, {
  timestamps: true
});

// Compound indexes
modelPerformanceSchema.index({ modelType: 1, version: 1 }, { unique: true });
modelPerformanceSchema.index({ modelType: 1, isActive: 1 });
modelPerformanceSchema.index({ trainedDate: -1 });

// Static method to get active model for a type
modelPerformanceSchema.statics.getActiveModel = async function(modelType) {
  return this.findOne({ modelType, isActive: true })
    .sort({ trainedDate: -1 })
    .lean();
};

// Static method to get latest model (active or not)
modelPerformanceSchema.statics.getLatestModel = async function(modelType) {
  return this.findOne({ modelType })
    .sort({ trainedDate: -1 })
    .lean();
};

// Static method to get model history
modelPerformanceSchema.statics.getModelHistory = async function(modelType, limit = 10) {
  return this.find({ modelType })
    .sort({ trainedDate: -1 })
    .limit(limit)
    .lean();
};

// Static method to compare all algorithms
modelPerformanceSchema.statics.compareAlgorithms = async function() {
  const modelTypes = ['content', 'svd', 'xgboost', 'hybrid'];
  const comparison = [];
  
  for (const modelType of modelTypes) {
    const latestModel = await this.getLatestModel(modelType);
    if (latestModel) {
      comparison.push({
        algorithm: modelType,
        accuracy: latestModel.metrics.accuracy,
        precision: latestModel.metrics.precision,
        recall: latestModel.metrics.recall,
        f1Score: latestModel.metrics.f1Score,
        aucRoc: latestModel.metrics.aucRoc,
        trainedDate: latestModel.trainedDate,
        trainingDataCount: latestModel.trainingDataCount,
        isActive: latestModel.isActive
      });
    }
  }
  
  return comparison.sort((a, b) => b.accuracy - a.accuracy);
};

// Instance method to activate this model (deactivate others)
modelPerformanceSchema.methods.activate = async function() {
  // Deactivate all other versions of this model type
  await this.constructor.updateMany(
    { modelType: this.modelType, _id: { $ne: this._id } },
    { isActive: false }
  );
  
  // Activate this version
  this.isActive = true;
  this.deployedDate = new Date();
  await this.save();
  
  return this;
};

// Instance method to update production metrics
modelPerformanceSchema.methods.updateProductionMetrics = async function(metrics) {
  this.productionMetrics = {
    ...this.productionMetrics,
    ...metrics
  };
  await this.save();
  return this;
};

const ModelPerformance = mongoose.model('ModelPerformance', modelPerformanceSchema);

module.exports = ModelPerformance;
