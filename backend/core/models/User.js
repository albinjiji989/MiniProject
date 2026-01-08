const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: null },
  phone: { type: String, default: '' },
  // Preferred auth provider tracking
  provider: { type: String, enum: ['google', 'email', 'both'], default: 'email' },
  // Backwards compatibility with existing code using authProvider
  authProvider: { type: String, enum: ['google', 'local', 'both'], default: 'local' },
  firebaseUid: { type: String, default: null },
  profileImage: { type: String, default: null },
  // Backwards compatibility with existing code using profilePicture
  profilePicture: { type: String, default: null },
  // Google profile picture (stored separately, never overwritten)
  googleProfilePicture: { type: String, default: null },
  // Array of uploaded profile pictures
  uploadedProfilePictures: { type: [String], default: [] },
  // Flag to use custom picture instead of Google
  useCustomProfilePicture: { type: Boolean, default: false },
  role: { type: String, default: 'public_user' },
  
  // Module assignments for managers (array of Module references)
  assignedModules: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Module' 
  }],
  
  // Store information for managers
  storeInfo: {
    storeId: { type: String, unique: true, sparse: true },
    storeName: { type: String, default: '' },
    storeAddress: { type: String, default: '' },
    storeCity: { type: String, default: '' },
    storeState: { type: String, default: '' },
    storePincode: { type: String, default: '' },
    storePhone: { type: String, default: '' },
    storeDescription: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  
  // Backwards compatibility
  assignedModule: { type: String, default: null },
  storeId: { type: String, index: true, sparse: true },
  storeName: { type: String, default: '' },
  
  isActive: { type: Boolean, default: true },
  isTemporaryPassword: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
}, { timestamps: true });

// Hash password if modified
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    // If already a bcrypt hash (starts with $2), do not re-hash
    const looksHashed = typeof this.password === 'string' && this.password.startsWith('$2');
    if (!looksHashed) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);