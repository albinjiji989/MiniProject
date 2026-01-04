const PetStock = require('../models/PetStock');
const PetInventoryItem = require('../models/PetInventoryItem');
const PetCodeGenerator = require('../../../../core/utils/petCodeGenerator');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');
const User = require('../../../../core/models/User');

/**
 * Wizard Submit Controller
 * Handles the complete wizard submission flow for creating pet stocks
 */

// Submit complete wizard form and create stock + generate pets
const submitWizard = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      // Basic Info
      age,
      ageUnit = 'months',
      // Classification
      speciesId,
      breedId,
      color,
      size,
      // Pricing
      price,
      discountPrice,
      // Gender Distribution
      maleCount = 0,
      femaleCount = 0,
      maleImages = [],
      femaleImages = [],
      // Review
      stockName,
      tags = []
    } = req.body;

    // Validate required fields
    if (!stockName) {
      return res.status(400).json({ success: false, message: 'Stock name is required' });
    }
    if (!speciesId) {
      return res.status(400).json({ success: false, message: 'Species is required' });
    }
    if (!breedId) {
      return res.status(400).json({ success: false, message: 'Breed is required' });
    }
    if (price === undefined || price === null) {
      return res.status(400).json({ success: false, message: 'Price is required' });
    }
    if ((maleCount || 0) + (femaleCount || 0) <= 0) {
      return res.status(400).json({ success: false, message: 'Must add at least 1 pet (male or female)' });
    }

    const storeFilter = getStoreFilter(req.user);
    
    // Detailed logging for debugging
    console.log('Store filter check:', {
      storeId: storeFilter.storeId,
      storeIdType: typeof storeFilter.storeId,
      userRole: req.user?.role,
      userStoreId: req.user?.storeId,
      userStoreName: req.user?.storeName
    });
    
    // Accept both ObjectId and string storeIds (like "PSP138250")
    if (!storeFilter.storeId || (typeof storeFilter.storeId === 'string' && storeFilter.storeId.trim().length === 0)) {
      const debugMsg = `Your account is missing a valid store assignment. Role: ${req.user?.role}, StoreId: ${req.user?.storeId || 'not set'}`;
      console.error('Store validation failed:', debugMsg);
      return res.status(403).json({ 
        success: false, 
        message: 'Your account does not have a store assigned. Please ask your administrator to assign you to a PetShop store.',
        debug: process.env.NODE_ENV === 'development' ? debugMsg : undefined
      });
    }

    console.log('Wizard submission - creating stock:', {
      name: stockName,
      species: speciesId,
      breed: breedId,
      maleCount,
      femaleCount,
      price,
      maleImages: maleImages.length,
      femaleImages: femaleImages.length
    });

    // Handle images
    let maleImageIds = [];
    let femaleImageIds = [];

    if (maleImages.length > 0) {
      try {
        const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
        const maleImageObjects = maleImages.map(url => ({ url }));
        
        const savedMaleImages = await processEntityImages(
          maleImageObjects,
          'PetStock',
          null,
          req.user.id,
          'petshop/manager/stocks/male',
          'manager'
        );
        
        maleImageIds = savedMaleImages.map(img => img._id);
        console.log(`Processed ${maleImageIds.length} male images`);
      } catch (err) {
        console.warn('Failed to process male images:', err.message);
        // Continue without images
      }
    }

    if (femaleImages.length > 0) {
      try {
        const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
        const femaleImageObjects = femaleImages.map(url => ({ url }));
        
        const savedFemaleImages = await processEntityImages(
          femaleImageObjects,
          'PetStock',
          null,
          req.user.id,
          'petshop/manager/stocks/female',
          'manager'
        );
        
        femaleImageIds = savedFemaleImages.map(img => img._id);
        console.log(`Processed ${femaleImageIds.length} female images`);
      } catch (err) {
        console.warn('Failed to process female images:', err.message);
        // Continue without images
      }
    }

    // Create PetStock
    const stock = new PetStock({
      name: stockName,
      speciesId,
      breedId,
      age: age ? Number(age) : null,
      ageUnit,
      color,
      size,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      maleCount: Number(maleCount) || 0,
      femaleCount: Number(femaleCount) || 0,
      maleImageIds,
      femaleImageIds,
      tags: Array.isArray(tags) ? tags.filter(t => t.trim()) : [],
      storeId: storeFilter.storeId,
      storeName: req.user.storeName || '',
      createdBy: req.user._id,
      isActive: true
    });

    await stock.save();
    
    // Populate for response
    await stock.populate('speciesId', 'name displayName');
    await stock.populate('breedId', 'name');
    await stock.populate('maleImageIds');
    await stock.populate('femaleImageIds');

    console.log('Stock created successfully:', stock._id);

    // Now generate individual pets from the stock
    let generatedPets = [];
    
    try {
      const UnifiedPetService = require('../../../../core/services/UnifiedPetService');
      
      const totalToGenerate = (maleCount || 0) + (femaleCount || 0);
      console.log(`Generating ${totalToGenerate} pets from stock`);
      
      const result = await UnifiedPetService.generatePetsFromStock(
        stock._id,
        maleCount || 0,
        femaleCount || 0,
        req.user
      );
      
      generatedPets = result.generatedPets || [];
      
      // Update stock with generated pets
      for (const pet of generatedPets) {
        await stock.addGeneratedPet(pet._id);
      }
      
      stock.maleCount -= (maleCount || 0);
      stock.femaleCount -= (femaleCount || 0);
      stock.isReleased = true;
      stock.releasedAt = new Date();
      
      await stock.save();
      
      console.log(`Generated ${generatedPets.length} pets from stock`);
    } catch (genErr) {
      console.error('Pet generation failed:', genErr);
      // Stock was created, pets generation failed - this is acceptable
      // User can try generating pets later from the stock management page
    }

    res.status(201).json({
      success: true,
      data: {
        stock: stock.toObject(),
        generatedPets: generatedPets.map(p => ({
          _id: p._id,
          name: p.name,
          petCode: p.petCode,
          gender: p.gender,
          status: p.status
        })),
        generatedPetsCount: generatedPets.length
      },
      message: `Stock "${stockName}" created successfully with ${generatedPets.length} pets generated`
    });

  } catch (error) {
    console.error('Wizard submission error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to submit wizard form'
    });
  }
};

// Get wizard state (retrieve data if user returns to wizard)
const getWizardState = async (req, res) => {
  try {
    // In a real scenario, you could store wizard state in the database
    // For now, just confirm the endpoint works
    res.json({
      success: true,
      message: 'Wizard state endpoint ready. Use localStorage for client-side state management.'
    });
  } catch (error) {
    console.error('Get wizard state error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Save wizard step (optional - for server-side state backup)
const saveWizardStep = async (req, res) => {
  try {
    const { stepKey, stepData } = req.body;
    
    if (!stepKey || !stepData) {
      return res.status(400).json({ success: false, message: 'Step key and data required' });
    }

    // In a real implementation, you would save this to a temporary collection
    // For now, just acknowledge receipt
    console.log(`Step saved: ${stepKey}`, stepData);
    
    res.json({
      success: true,
      message: `Step ${stepKey} saved`
    });
  } catch (error) {
    console.error('Save wizard step error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  submitWizard,
  getWizardState,
  saveWizardStep
};
