const mongoose = require('mongoose');
const geocoder = require('../../utils/geocoder');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  pincode: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  }
});

const operatingHoursSchema = new mongoose.Schema({
  monday: { open: String, close: String },
  tuesday: { open: String, close: String },
  wednesday: { open: String, close: String },
  thursday: { open: String, close: String },
  friday: { open: String, close: String },
  saturday: { open: String, close: String },
  sunday: { open: String, close: String }
});

const petShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be longer than 20 characters']
  },
  address: {
    type: addressSchema,
    required: [true, 'Please add an address']
  },
  website: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  logo: String,
  coverImage: String,
  images: [String],
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  operatingHours: {
    type: operatingHoursSchema,
    required: true
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staff: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['manager', 'staff', 'groomer', 'trainer', 'vet'],
      required: true
    },
    permissions: [String],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    youtube: String
  },
  amenities: [{
    type: String,
    enum: ['parking', 'wifi', 'air_conditioning', 'pet_grooming', 'pet_boarding', 'pet_training', 'veterinary', 'pet_sitting', 'pet_daycare', 'pet_supplies', 'pet_adoption']
  }],
  paymentMethods: [{
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']
  }],
  policies: {
    cancellation: String,
    refund: String,
    privacy: String,
    terms: String
  },
  taxInfo: {
    gstNumber: String,
    panNumber: String,
    fssaiLicense: String
  },
  settings: {
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    distanceUnit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h'
    },
    notifications: {
      email: {
        new_booking: { type: Boolean, default: true },
        booking_confirmation: { type: Boolean, default: true },
        booking_reminder: { type: Boolean, default: true },
        payment_received: { type: Boolean, default: true },
        review_request: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: true }
      },
      sms: {
        new_booking: { type: Boolean, default: true },
        booking_confirmation: { type: Boolean, default: true },
        booking_reminder: { type: Boolean, default: true },
        payment_received: { type: Boolean, default: true }
      },
      push: {
        new_booking: { type: Boolean, default: true },
        booking_confirmation: { type: Boolean, default: true },
        booking_reminder: { type: Boolean, default: true },
        payment_received: { type: Boolean, default: true },
        review_request: { type: Boolean, default: true }
      }
    }
  },
  statistics: {
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalServices: { type: Number, default: 0 },
    totalPets: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'inactive'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    },
    paymentMethod: String,
    lastBillingDate: Date,
    nextBillingDate: Date,
    transactionId: String,
    features: [String]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    canonicalUrl: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    twitterCard: String,
    twitterTitle: String,
    twitterDescription: String,
    twitterImage: String
  },
  customFields: mongoose.Schema.Types.Mixed,
  tags: [String],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Geocode & create location field
petShopSchema.pre('save', async function(next) {
  if (this.isModified('address')) {
    const loc = await geocoder.geocode(this.address);
    this.location = {
      type: 'Point',
      coordinates: [loc[0].longitude, loc[0].latitude],
      formattedAddress: loc[0].formattedAddress,
      street: loc[0].streetName,
      city: loc[0].city,
      state: loc[0].state,
      zipcode: loc[0].zipcode,
      country: loc[0].countryCode
    };
    
    // Do not save address in DB
    this.address = undefined;
  }
  next();
});

// Cascade delete services when a pet shop is deleted
petShopSchema.pre('remove', async function(next) {
  await this.model('Service').deleteMany({ shop: this._id });
  next();
});

// Reverse populate with virtuals
petShopSchema.virtual('servicesList', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'shop',
  justOne: false
});

petShopSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'shop',
  justOne: false
});

// Static method to get average rating
petShopSchema.statics.getAverageRating = async function(shopId) {
  const obj = await this.aggregate([
    {
      $match: { _id: shopId }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'shop',
        as: 'reviews'
      }
    },
    {
      $addFields: {
        averageRating: { $avg: '$reviews.rating' },
        numReviews: { $size: '$reviews' }
      }
    },
    {
      $project: {
        averageRating: 1,
        numReviews: 1
      }
    }
  ]);

  try {
    await this.model('PetShop').findByIdAndUpdate(shopId, {
      rating: obj[0]?.averageRating || 0,
      numReviews: obj[0]?.numReviews || 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save or delete of a review
petShopSchema.post('save', function() {
  this.constructor.getAverageRating(this._id);
});

// Create text index for search
petShopSchema.index({ 
  name: 'text', 
  description: 'text',
  'address.street': 'text',
  'address.city': 'text',
  'address.state': 'text',
  tags: 'text'
});

// Create geospatial index
petShopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PetShop', petShopSchema);
