const PetCodeGenerator = require('../../../core/utils/petCodeGenerator');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');

// Centralized Pet Code Management Functions
const getPetCodeStats = async (req, res) => {
  try {
    // Since we're using a centralized generator, we'll return general stats
    const stats = await PetCodeGenerator.getUsageStats();
    
    res.json({
      success: true,
      data: { 
        stats
      }
    });
  } catch (err) {
    console.error('Get pet code stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generateBulkPetCodes = async (req, res) => {
  try {
    const { count = 10 } = req.body;
    
    if (count > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate more than 1000 codes at once'
      });
    }
    
    // Generate codes using the centralized generator
    const codes = await PetCodeGenerator.generateBulkPetCodes(count);
    
    res.status(201).json({
      success: true,
      message: `Successfully generated ${codes.length} pet codes`,
      data: { codes }
    });
  } catch (err) {
    console.error('Generate bulk pet codes error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const validatePetCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Pet code is required'
      });
    }
    
    // Validate format
    const isValidFormat = PetCodeGenerator.validatePetCodeFormat(code);
    
    if (!isValidFormat) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pet code format'
      });
    }
    
    // Check if code exists in any system
    const exists = await PetCodeGenerator.checkCodeExists(code);
    
    res.json({
      success: true,
      message: exists ? 'Pet code exists' : 'Pet code is available',
      data: { 
        code,
        exists,
        isValidFormat: true
      }
    });
  } catch (err) {
    console.error('Validate pet code error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPetCodeStats,
  generateBulkPetCodes,
  validatePetCode
};