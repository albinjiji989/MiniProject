const PetStock = require('../../manager/models/PetStock');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetCodeGenerator = require('../../../../core/utils/petCodeGenerator');

// List all available pet stocks for users
const listPublicStocks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      speciesId,
      breedId,
      minPrice,
      maxPrice,
      gender
    } = req.query;

    const filter = { isActive: true };
    
    // Apply filters
    if (speciesId) filter.speciesId = speciesId;
    if (breedId) filter.breedId = breedId;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Get all stocks
    const stocks = await PetStock.find(filter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('maleImageIds')
      .populate('femaleImageIds')
      .sort({ createdAt: -1 });

    // Transform stocks for user display
    const transformedStocks = stocks.map(stock => {
      // Determine which image to show based on gender filter or availability
      let displayImageIds = [];
      let genderLabel = '';
      
      if (gender === 'Male' && stock.maleImageIds.length > 0) {
        displayImageIds = stock.maleImageIds;
        genderLabel = 'Male';
      } else if (gender === 'Female' && stock.femaleImageIds.length > 0) {
        displayImageIds = stock.femaleImageIds;
        genderLabel = 'Female';
      } else {
        // Show both genders if no filter or both available
        if (stock.maleImageIds.length > 0) {
          displayImageIds = [...stock.maleImageIds];
          genderLabel = stock.femaleImageIds.length > 0 ? 'Both Genders Available' : 'Male';
        } else if (stock.femaleImageIds.length > 0) {
          displayImageIds = [...stock.femaleImageIds];
          genderLabel = 'Female';
        }
      }
      
      return {
        _id: stock._id,
        name: stock.name,
        species: stock.speciesId,
        breed: stock.breedId,
        age: stock.age,
        ageUnit: stock.ageUnit,
        color: stock.color,
        size: stock.size,
        price: stock.price,
        discountPrice: stock.discountPrice,
        storeId: stock.storeId,
        storeName: stock.storeName,
        maleCount: stock.maleCount,
        femaleCount: stock.femaleCount,
        availableCount: stock.maleCount + stock.femaleCount,
        images: displayImageIds,
        gender: genderLabel,
        tags: stock.tags,
        createdAt: stock.createdAt,
        updatedAt: stock.updatedAt
      };
    }).filter(stock => stock.availableCount > 0); // Only show stocks with available pets

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStocks = transformedStocks.slice(startIndex, endIndex);
    
    const total = transformedStocks.length;

    res.json({
      success: true,
      data: {
        stocks: paginatedStocks,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get public stocks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get stock details by ID for users
const getPublicStockById = async (req, res) => {
  try {
    const stock = await PetStock.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('maleImageIds')
      .populate('femaleImageIds');
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    // Transform for user display
    const transformedStock = {
      _id: stock._id,
      name: stock.name,
      species: stock.speciesId,
      breed: stock.breedId,
      age: stock.age,
      ageUnit: stock.ageUnit,
      color: stock.color,
      size: stock.size,
      price: stock.price,
      discountPrice: stock.discountPrice,
      storeId: stock.storeId,
      storeName: stock.storeName,
      maleCount: stock.maleCount,
      femaleCount: stock.femaleCount,
      availableCount: stock.maleCount + stock.femaleCount,
      maleImages: stock.maleImageIds,
      femaleImages: stock.femaleImageIds,
      tags: stock.tags,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt
    };
    
    res.json({ success: true, data: { stock: transformedStock } });
  } catch (error) {
    console.error('Get public stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reserve pets from stock (creates individual pets when user purchases)
const reservePetsFromStock = async (req, res) => {
  try {
    const { stockId, maleCount = 0, femaleCount = 0 } = req.body;
    const userId = req.user._id;
    
    // Validate request
    if (maleCount === 0 && femaleCount === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Must reserve at least one pet' 
      });
    }
    
    // Find the stock
    const stock = await PetStock.findById(stockId);
    
    if (!stock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Stock not found' 
      });
    }
    
    // Check availability
    if (maleCount > stock.maleCount || femaleCount > stock.femaleCount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Not enough pets available in stock' 
      });
    }
    
    // Generate individual pets with unique pet codes
    const generatedPets = [];
    
    // Generate male pets
    for (let i = 0; i < maleCount; i++) {
      const petCode = await PetCodeGenerator.generateUniquePetCode();
      
      const pet = new PetInventoryItem({
        name: stock.name,
        petCode,
        speciesId: stock.speciesId,
        breedId: stock.breedId,
        gender: 'Male',
        age: stock.age,
        ageUnit: stock.ageUnit,
        color: stock.color,
        size: stock.size,
        price: stock.price,
        discountPrice: stock.discountPrice,
        storeId: stock.storeId,
        storeName: stock.storeName,
        createdBy: userId,
        imageIds: stock.maleImageIds,
        status: 'sold', // Mark as sold since user is purchasing
        ownerId: userId // Assign to user
      });
      
      await pet.save();
      generatedPets.push(pet);
    }
    
    // Generate female pets
    for (let i = 0; i < femaleCount; i++) {
      const petCode = await PetCodeGenerator.generateUniquePetCode();
      
      const pet = new PetInventoryItem({
        name: stock.name,
        petCode,
        speciesId: stock.speciesId,
        breedId: stock.breedId,
        gender: 'Female',
        age: stock.age,
        ageUnit: stock.ageUnit,
        color: stock.color,
        size: stock.size,
        price: stock.price,
        discountPrice: stock.discountPrice,
        storeId: stock.storeId,
        storeName: stock.storeName,
        createdBy: userId,
        imageIds: stock.femaleImageIds,
        status: 'sold', // Mark as sold since user is purchasing
        ownerId: userId // Assign to user
      });
      
      await pet.save();
      generatedPets.push(pet);
    }
    
    // Update stock counts
    stock.maleCount -= maleCount;
    stock.femaleCount -= femaleCount;
    await stock.save();
    
    res.json({
      success: true,
      data: {
        generatedPets,
        message: `${generatedPets.length} pets generated successfully with unique pet codes`
      }
    });
  } catch (error) {
    console.error('Reserve pets from stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listPublicStocks,
  getPublicStockById,
  reservePetsFromStock
};