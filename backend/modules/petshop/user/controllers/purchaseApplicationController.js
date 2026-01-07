const PetshopPurchaseApplication = require('../../manager/models/PetshopPurchaseApplication');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const Image = require('../../../../core/models/Image');
const Document = require('../../../../core/models/Document');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Submit new purchase application
const submitPurchaseApplication = async (req, res) => {
  try {
    const {
      petInventoryItemId,
      stockId,
      batchId,
      selectedGender,
      personalDetails,
      purpose
    } = req.body;

    console.log('Purchase application request:', { petInventoryItemId, stockId, batchId, selectedGender });

    // Find pet - either by petInventoryItemId or by stockId + selectedGender
    let petItem;
    if (petInventoryItemId) {
      petItem = await PetInventoryItem.findById(petInventoryItemId);
      console.log('Found by petInventoryItemId:', petItem?._id);
    } else if (stockId && selectedGender) {
      // Find available pet from stock by gender (case-insensitive)
      const genderCapitalized = selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1);
      petItem = await PetInventoryItem.findOne({
        stockId: stockId,
        gender: genderCapitalized,
        status: { $in: ['available', 'available_for_sale'] }
      });
      console.log('Searching with stockId:', stockId, 'gender:', genderCapitalized);
      console.log('Found petItem:', petItem?._id);
      
      // If not found by stockId, try finding by matching the stock's petCode or other fields
      if (!petItem) {
        // Check if there are ANY PetInventoryItems with this stockId
        const anyItems = await PetInventoryItem.find({ stockId: stockId }).limit(5);
        console.log('Any items with stockId:', anyItems.length);
        if (anyItems.length > 0) {
          console.log('First item details:', {
            id: anyItems[0]._id,
            gender: anyItems[0].gender,
            status: anyItems[0].status,
            stockId: anyItems[0].stockId
          });
        }
        
        // Also try to find the stock itself to verify it exists
        const PetStock = require('../../manager/models/PetStock');
        const stock = await PetStock.findById(stockId);
        console.log('Stock found:', stock?._id, 'name:', stock?.name);
        
        if (stock) {
          // Try to find inventory by stock name or create one
          console.log('Stock exists but no inventory items found. Gender counts - Male:', stock.maleCount, 'Female:', stock.femaleCount);
        }
      }
    }

    if (!petItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'No available pet found for this stock and gender. The stock may not have inventory items created yet.' 
      });
    }

    if (petItem.status !== 'available' && petItem.status !== 'available_for_sale') {
      return res.status(400).json({ success: false, message: 'Pet is not available for purchase' });
    }

    // Check if user already has pending application for this pet
    const existingApplication = await PetshopPurchaseApplication.findOne({
      userId: req.user._id,
      petInventoryItemId: petItem._id,
      status: { $in: ['pending', 'under_review', 'approved', 'payment_pending', 'paid', 'scheduled'] }
    });

    if (existingApplication) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active application for this pet' 
      });
    }

    // Handle user photo upload - Direct to Cloudinary from memory buffer
    let userPhotoId = null;
    if (req.files && req.files.userPhoto) {
      const photoFile = req.files.userPhoto[0];
      
      // Upload from buffer directly to Cloudinary (no local file storage)
      const uploadStream = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'petshop/applications/photos',
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(photoFile.buffer);
        });
      };
      
      const photoResult = await uploadStream();
      
      const userPhoto = await Image.create({
        url: photoResult.secure_url,
        publicId: photoResult.public_id,
        caption: 'User Photo',
        entityType: 'purchase_application',
        uploadedBy: req.user._id
      });
      
      userPhotoId = userPhoto._id;
    }

    // Handle document uploads - Direct to Cloudinary from memory buffer
    const documentIds = [];
    if (req.files && req.files.documents) {
      for (const docFile of req.files.documents) {
        // Upload from buffer directly to Cloudinary (no local file storage)
        const uploadStream = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'petshop/applications/documents',
                resource_type: 'auto'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(docFile.buffer);
          });
        };
        
        const docResult = await uploadStream();
        
        const document = await Document.create({
          name: docFile.originalname,
          type: docFile.mimetype,
          url: docResult.secure_url,
          publicId: docResult.public_id,
          entityType: 'purchase_application',
          uploadedBy: req.user._id
        });
        
        documentIds.push(document._id);
      }
    }

    // Create application
    const application = await PetshopPurchaseApplication.create({
      userId: req.user._id,
      petInventoryItemId: petItem._id,
      batchId: petItem.batchId || batchId,
      selectedGender: petItem.gender || selectedGender,
      personalDetails: JSON.parse(personalDetails),
      purpose,
      userPhoto: userPhotoId,
      documents: documentIds,
      paymentAmount: petItem.price,
      storeId: null, // PetInventoryItem.storeId is a string code, not ObjectId reference
      status: 'pending'
    });

    application.addStatusHistory('pending', req.user._id, 'Application submitted');
    await application.save();

    // Mark pet as reserved and update stock count
    petItem.status = 'reserved';
    petItem.reservedBy = req.user._id;
    petItem.reservedDate = new Date();
    await petItem.save();

    // Update stock available count
    const PetStock = require('../../manager/models/PetStock');
    if (petItem.stockId) {
      await PetStock.findByIdAndUpdate(petItem.stockId, {
        $inc: { availableCount: -1 }
      });
    }

    // TODO: Send email notification to user and manager

    res.status(201).json({
      success: true,
      message: 'Purchase application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Submit purchase application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's purchase applications
const getMyApplications = async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log('Getting applications for user:', req.user._id, 'status filter:', status);
    
    const query = {
      userId: req.user._id
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const applications = await PetshopPurchaseApplication.find(query)
      .populate({
        path: 'petInventoryItemId',
        populate: [
          { path: 'speciesId', select: 'name displayName' },
          { path: 'breedId', select: 'name' },
          { path: 'images' }
        ]
      })
      .populate('userPhoto')
      .populate('documents')
      .sort({ createdAt: -1 });

    console.log('Found applications:', applications.length);

    res.json({ success: true, data: { applications } });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single application details
const getApplicationDetails = async (req, res) => {
  try {
    const application = await PetshopPurchaseApplication.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate({
        path: 'petInventoryItemId',
        populate: [
          { path: 'speciesId', select: 'name displayName' },
          { path: 'breedId', select: 'name' },
          { path: 'images' }
        ]
      })
      .populate('userPhoto')
      .populate('documents')
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel application (only if pending/under_review)
const cancelApplication = async (req, res) => {
  try {
    const application = await PetshopPurchaseApplication.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!['pending', 'under_review'].includes(application.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Application cannot be cancelled at this stage' 
      });
    }

    application.status = 'cancelled';
    application.addStatusHistory('cancelled', req.user._id, 'Cancelled by user');
    await application.save();

    res.json({ success: true, message: 'Application cancelled successfully' });
  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitPurchaseApplication,
  getMyApplications,
  getApplicationDetails,
  cancelApplication
};
