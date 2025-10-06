const mongoose = require('mongoose');

const adoptionCertificateSchema = new mongoose.Schema({
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionPet', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionRequest', required: true, unique: true },
  adoptionDate: { type: Date, default: Date.now },
  agreementFile: { type: String, required: true },
  signedByManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  signedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificateCode: { type: String, index: true },
}, { timestamps: true });

adoptionCertificateSchema.index({ certificateCode: 1 }, { unique: true, sparse: true });

// Generate a simple human-readable code if not present
adoptionCertificateSchema.pre('save', function(next) {
  if (!this.certificateCode) {
    const ts = Date.now().toString(36).toUpperCase();
    this.certificateCode = `AC-${ts.slice(-8)}`;
  }
  next();
});

module.exports = mongoose.model('AdoptionCertificate', adoptionCertificateSchema);
