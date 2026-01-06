const PetStock = require('../models/PetStock');
const PetInventoryItem = require('../models/PetInventoryItem');
const PetCodeGenerator = require('../../../../core/utils/petCodeGenerator');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');

// List all pet stocks
const listStocks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      speciesId,
      breedId,
      minPrice,
      maxPrice
    } = req.query;

    const filter = { ...getStoreFilter(req.user), isActive: true };
    
    // Apply filters
    if (speciesId) filter.speciesId = speciesId;
    if (breedId) filter.breedId = breedId;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const stocks = await PetStock.find(filter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('maleImageIds')
      .populate('femaleImageIds')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetStock.countDocuments(filter);

    res.json({
      success: true,
      data: {
        stocks,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new pet stock
const createStock = async (req, res) => {
  try {
    const stockData = { 
      ...req.body, 
      ...getStoreFilter(req.user),
      createdBy: req.user.id
    };
    
    console.log('Creating stock with data:', {
      name: stockData.name,
      speciesId: stockData.speciesId,
      breedId: stockData.breedId,
      maleCount: stockData.maleCount,
      femaleCount: stockData.femaleCount,
      maleImagesCount: stockData.maleImages?.length || 0,
      femaleImagesCount: stockData.femaleImages?.length || 0
    });
    
    // Handle male images
    let maleImageIds = [];
    if (stockData.maleImages && Array.isArray(stockData.maleImages) && stockData.maleImages.length > 0) {
      try {
        const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
        
        // Convert base64 strings to image objects for processing
        const maleImageObjects = stockData.maleImages.map(url => ({ url }));
        
        console.log(`Processing ${maleImageObjects.length} male images for stock`);
        
        const savedImages = await processEntityImages(
          maleImageObjects, 
          'PetStock', 
          null,
          req.user.id, 
          'petshop/manager/stocks/male',
          'manager'
        );
        
        maleImageIds = savedImages.map(img => img._id);
        console.log(`Processed ${maleImageIds.length} male images for stock`);
      } catch (imgErr) {
        console.error('Failed to save male stock images:', imgErr);
        // Don't fail the entire operation if images fail
      }
    } else {
      console.log('No male images to process for stock');
    }
    
    // Handle female images
    let femaleImageIds = [];
    if (stockData.femaleImages && Array.isArray(stockData.femaleImages) && stockData.femaleImages.length > 0) {
      try {
        const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
        
        // Convert base64 strings to image objects for processing
        const femaleImageObjects = stockData.femaleImages.map(url => ({ url }));
        
        console.log(`Processing ${femaleImageObjects.length} female images for stock`);
        
        const savedImages = await processEntityImages(
          femaleImageObjects, 
          'PetStock', 
          null,
          req.user.id, 
          'petshop/manager/stocks/female',
          'manager'
        );
        
        femaleImageIds = savedImages.map(img => img._id);
        console.log(`Processed ${femaleImageIds.length} female images for stock`);
      } catch (imgErr) {
        console.error('Failed to save female stock images:', imgErr);
        // Don't fail the entire operation if images fail
      }
    } else {
      console.log('No female images to process for stock');
    }
    
    // Remove image arrays from stockData
    delete stockData.maleImages;
    delete stockData.femaleImages;
    
    // Create the stock (this represents ONE batch of pets)
    // Each stock entry is a batch containing:
    // - Total pets: maleCount + femaleCount
    // - Male pets count: maleCount
    // - Female pets count: femaleCount
    // - All pets in this batch share: category, species, breed, age, color, size
    const stock = new PetStock({
      ...stockData,
      maleImageIds,
      femaleImageIds
    });
    
    await stock.save();
    
    console.log(`✅ Stock batch created: ${stock.maleCount + stock.femaleCount} total pets (${stock.maleCount} male, ${stock.femaleCount} female) - Age: ${stock.age} ${stock.ageUnit}`);
    
    // Mark stock as released immediately so it appears on user dashboard
    // even if pet generation fails
    stock.isReleased = true;
    stock.releasedAt = new Date();
    await stock.save();
    
    // Automatically generate individual pets from stock
    // This creates PetInventoryItem records and registers them in PetRegistry
    let generatedPets = [];
    let generationError = null;
    
    try {
      const UnifiedPetService = require('../../../../core/services/UnifiedPetService');
      const totalToGenerate = (stock.maleCount || 0) + (stock.femaleCount || 0);
      
      if (totalToGenerate > 0) {
        console.log(`🔄 Auto-generating ${totalToGenerate} pets from stock (${stock.maleCount} male, ${stock.femaleCount} female)`);
        
        const result = await UnifiedPetService.generatePetsFromStock(
          stock._id,
          stock.maleCount || 0,
          stock.femaleCount || 0,
          req.user
        );
        
        generatedPets = result.generatedPets || [];
        
        // Reload stock to get updated state
        await stock.populate('speciesId', 'name displayName');
        await stock.populate('breedId', 'name');
        
        // Update stock with generated pets tracking
        for (const pet of generatedPets) {
          await stock.addGeneratedPet(pet._id);
        }
        
        // Stock counts remain as set by manager - they represent available inventory
        // The generated PetInventoryItems are the actual individual pets
        
        await stock.save();
        
        console.log(`✅ Successfully generated ${generatedPets.length} pets from stock`);
      } else {
        console.log('⚠️ No pets to generate (maleCount and femaleCount are both 0)');
      }
    } catch (genErr) {
      console.error('❌ Failed to auto-generate pets from stock:', genErr);
      generationError = genErr.message;
      // Don't fail the entire operation - stock was created successfully
      // Manager can manually generate pets later if needed
    }
    
    // Populate for response
    await stock.populate('speciesId', 'name displayName');
    await stock.populate('breedId', 'name');
    await stock.populate('maleImageIds');
    await stock.populate('femaleImageIds');
    
    const totalGenerated = generatedPets.length;
    const message = totalGenerated > 0 
      ? `Stock created successfully! ${totalGenerated} pets generated and registered in inventory.`
      : generationError
        ? `Stock created successfully! However, pet generation failed: ${generationError}. You can generate pets manually later.`
        : 'Stock created successfully! 0 pets generated (no pets in stock).';
    
    res.status(201).json({
      success: true,
      data: { 
        stock,
        generatedPets: generatedPets.map(p => ({
          _id: p._id,
          name: p.name,
          petCode: p.petCode,
          gender: p.gender,
          status: p.status
        })),
        generatedPetsCount: totalGenerated
      },
      message
    });
  } catch (error) {
    console.error('Create stock error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get stock by ID
const getStockById = async (req, res) => {
  try {
    const stock = await PetStock.findOne({ 
      _id: req.params.id, 
      ...getStoreFilter(req.user) 
    }).populate('maleImageIds').populate('femaleImageIds').populate('speciesId', 'name displayName').populate('breedId', 'name');
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    res.json({ success: true, data: { stock } });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update stock
const updateStock = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    const stock = await PetStock.findOneAndUpdate(
      { _id: req.params.id, ...getStoreFilter(req.user) },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    await stock.populate('speciesId', 'name displayName');
    await stock.populate('breedId', 'name');
    await stock.populate('maleImageIds');
    await stock.populate('femaleImageIds');
    
    res.json({
      success: true,
      data: { stock },
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete stock
const deleteStock = async (req, res) => {
  try {
    const stock = await PetStock.findOneAndUpdate(
      { _id: req.params.id, ...getStoreFilter(req.user) },
      { isActive: false },
      { new: true }
    );
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Stock deleted successfully'
    });
  } catch (error) {
    console.error('Delete stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Generate individual pets from stock and mark as released
const generatePetsFromStock = async (req, res) => {
  try {
    const { stockId, maleCount, femaleCount } = req.body;
    
    // Use UnifiedPetService to generate pets and register them
    const UnifiedPetService = require('../../../../core/services/UnifiedPetService');
    
    const result = await UnifiedPetService.generatePetsFromStock(
      stockId, 
      maleCount, 
      femaleCount, 
      req.user
    );
    
    // Update stock with generated pet tracking
    const stock = await PetStock.findById(stockId);
    if (stock) {
      // Add generated pets to stock tracking
      for (const pet of result.generatedPets) {
        await stock.addGeneratedPet(pet._id);
      }
      
      // Update stock counts
      stock.maleCount -= maleCount;
      stock.femaleCount -= femaleCount;
      
      // Mark stock as released if this is the first generation
      if (!stock.isReleased) {
        stock.isReleased = true;
        stock.releasedAt = new Date();
      }
      
      await stock.save();
      
      result.stock = stock;
    }
    
    res.json({
      success: true,
      data: result,
      message: `${result.generatedPets.length} pets generated successfully and stock marked as released`
    });
  } catch (error) {
    console.error('Generate pets from stock error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Upload images to stock
const uploadStockImages = async (req, res) => {
  try {
    const { gender } = req.query; // 'male' or 'female'
    const stockId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }
    
    if (!gender || (gender !== 'male' && gender !== 'female')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gender parameter is required and must be either "male" or "female"' 
      });
    }
    
    // Find the stock
    const stock = await PetStock.findOne({ 
      _id: stockId, 
      ...getStoreFilter(req.user) 
    });
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    // Process the image
    const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
    
    const savedImages = await processEntityImages(
      [{ buffer: req.file.buffer, originalname: req.file.originalname }], 
      'PetStock', 
      null,
      req.user.id, 
      `petshop/manager/stocks/${gender}`,
      'manager'
    );
    
    const imageId = savedImages[0]._id;
    
    // Update stock with new image
    if (gender === 'male') {
      stock.maleImageIds.push(imageId);
    } else {
      stock.femaleImageIds.push(imageId);
    }
    
    await stock.save();
    
    // Populate for response
    await stock.populate('maleImageIds');
    await stock.populate('femaleImageIds');
    
    res.json({
      success: true,
      data: { stock },
      message: `${gender.charAt(0).toUpperCase() + gender.slice(1)} image uploaded successfully`
    });
  } catch (error) {
    console.error('Upload stock image error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Remove image from stock
const removeStockImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const stockId = req.params.stockId;
    
    // Find the stock
    const stock = await PetStock.findOne({ 
      _id: stockId, 
      ...getStoreFilter(req.user) 
    });
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    // Remove image from both male and female image arrays
    stock.maleImageIds = stock.maleImageIds.filter(id => id.toString() !== imageId);
    stock.femaleImageIds = stock.femaleImageIds.filter(id => id.toString() !== imageId);
    
    await stock.save();
    
    // Populate for response
    await stock.populate('maleImageIds');
    await stock.populate('femaleImageIds');
    
    res.json({
      success: true,
      data: { stock },
      message: 'Image removed successfully'
    });
  } catch (error) {
    console.error('Remove stock image error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listStocks,
  createStock,
  getStockById,
  updateStock,
  deleteStock,
  generatePetsFromStock,
  uploadStockImages,
  removeStockImage
};