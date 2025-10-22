const PetPricing = require('../models/PetPricing');
const PetInventoryItem = require('../models/PetInventoryItem');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');

// Pricing Management Functions
const createPricingRule = async (req, res) => {
  try {
    const pricingData = { ...req.body, ...getStoreFilter(req.user) };
    const pricingRule = new PetPricing(pricingData);
    await pricingRule.save();
    
    res.status(201).json({
      success: true,
      data: { pricingRule },
      message: 'Pricing rule created successfully'
    });
  } catch (error) {
    console.error('Create pricing rule error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const listPricingRules = async (req, res) => {
  try {
    const { active, page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user) };
    
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const pricingRules = await PetPricing.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetPricing.countDocuments(filter);

    res.json({
      success: true,
      data: {
        pricingRules,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('List pricing rules error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePricingRule = async (req, res) => {
  try {
    const pricingRule = await PetPricing.findOneAndUpdate(
      { _id: req.params.id, ...getStoreFilter(req.user) },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!pricingRule) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pricing rule not found' 
      });
    }
    
    res.json({
      success: true,
      data: { pricingRule },
      message: 'Pricing rule updated successfully'
    });
  } catch (error) {
    console.error('Update pricing rule error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const calculatePetPrice = async (req, res) => {
  try {
    const { petAttributes } = req.body;
    
    // Find applicable pricing rule for the store
    const pricingRule = await PetPricing.findOne({
      ...getStoreFilter(req.user),
      isActive: true,
      categoryId: petAttributes.categoryId,
      speciesId: petAttributes.speciesId,
      breedId: petAttributes.breedId
    });

    let finalPrice = Number(petAttributes.basePrice) || 0;
    
    // Apply pricing rule if found
    if (pricingRule) {
      finalPrice = pricingRule.calculatePrice(petAttributes);
    }
    
    res.json({
      success: true,
      data: { 
        basePrice: Number(petAttributes.basePrice),
        calculatedPrice: Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
        pricingRule: pricingRule ? pricingRule._id : null
      }
    });
  } catch (error) {
    console.error('Calculate pet price error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createPricingRule,
  listPricingRules,
  updatePricingRule,
  calculatePetPrice
};