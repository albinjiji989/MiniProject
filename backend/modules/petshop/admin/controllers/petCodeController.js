const PetCodeGenerator = require('../../../core/utils/petCodeGenerator');

// ===== CENTRALIZED PET CODE MANAGEMENT =====

// Get pet code usage statistics
const getPetCodeStats = async (req, res) => {
  try {
    const stats = await PetCodeGenerator.getUsageStats();
    
    res.json({ 
      success: true, 
      data: { stats } 
    });
  } catch (err) {
    console.error('Get pet code stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Generate bulk pet codes for testing/import
const generateBulkPetCodes = async (req, res) => {
  try {
    const { count = 10 } = req.body;
    
    if (count > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot generate more than 100 codes at once' 
      });
    }
    
    const codes = await PetCodeGenerator.generateBulkPetCodes(count);
    
    res.json({ 
      success: true, 
      data: { codes, count: codes.length } 
    });
  } catch (err) {
    console.error('Generate bulk pet codes error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error' 
    });
  }
};

// Validate pet code format
const validatePetCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet code is required' 
      });
    }
    
    const isValid = PetCodeGenerator.validatePetCodeFormat(code);
    const exists = await PetCodeGenerator.checkCodeExists(code);
    
    res.json({ 
      success: true, 
      data: { 
        code,
        isValidFormat: isValid,
        exists,
        available: isValid && !exists
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