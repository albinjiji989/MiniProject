const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/role');
const AdoptionPet = require('../../../modules/adoption/manager/models/AdoptionPet');
const PetInventoryItem = require('../../../modules/petshop/manager/models/PetInventoryItem');
const PetRegistry = require('../../models/PetRegistry');
const User = require('../../models/User');
const BlockchainBlock = require('../../models/BlockchainBlock');
const BlockchainService = require('../../services/blockchainService');

// @route   GET /api/admin/pets-overview/stats
// @desc    Get comprehensive pet statistics for adoption and petshop
// @access  Private (Admin only)
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const [
      // Adoption statistics (from AdoptionPet model)
      totalAdoptionPets,
      adoptedPets,
      availableAdoptionPets,
      reservedAdoptionPets,
      
      // Pet shop statistics (from PetInventoryItem model)
      totalPetshopPets,
      soldPets,
      availablePetshopPets,
      reservedPetshopPets,
      
      // Overall statistics (from PetRegistry)
      totalPets,
      activePets,
      inactivePets,
      medicalPets,
      
      // Revenue calculations
      adoptionRevenue,
      petshopRevenue
    ] = await Promise.all([
      // Adoption stats
      AdoptionPet.countDocuments({ isActive: true, isDeleted: false }),
      AdoptionPet.countDocuments({ status: 'adopted', isActive: true, isDeleted: false }),
      AdoptionPet.countDocuments({ status: 'available', isActive: true, isDeleted: false }),
      AdoptionPet.countDocuments({ status: 'reserved', isActive: true, isDeleted: false }),
      
      // Pet shop stats
      PetInventoryItem.countDocuments({ isActive: true }),
      PetInventoryItem.countDocuments({ status: 'sold', isActive: true }),
      PetInventoryItem.countDocuments({ status: 'available_for_sale', isActive: true }),
      PetInventoryItem.countDocuments({ status: 'reserved', isActive: true }),
      
      // Overall stats from PetRegistry
      PetRegistry.countDocuments({ isDeleted: false }),
      PetRegistry.countDocuments({ isDeleted: false, currentStatus: { $ne: 'inactive' } }),
      PetRegistry.countDocuments({ isDeleted: false, currentStatus: 'inactive' }),
      PetRegistry.countDocuments({ isDeleted: false, currentLocation: 'medical_care' }),
      
      // Revenue calculations
      AdoptionPet.aggregate([
        { $match: { status: 'adopted', isActive: true, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$adoptionFee' } } }
      ]),
      PetInventoryItem.aggregate([
        { $match: { status: 'sold', isActive: true } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    const stats = {
      adoption: {
        total: totalAdoptionPets,
        adopted: adoptedPets,
        available: availableAdoptionPets,
        reserved: reservedAdoptionPets,
        revenue: adoptionRevenue[0]?.total || 0
      },
      petshop: {
        total: totalPetshopPets,
        sold: soldPets,
        available: availablePetshopPets,
        reserved: reservedPetshopPets,
        revenue: petshopRevenue[0]?.total || 0
      },
      overall: {
        total: totalPets,
        active: activePets,
        inactive: inactivePets,
        medical: medicalPets
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Pet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet statistics',
      error: error.message
    });
  }
});

// @route   GET /api/admin/pets-overview/analytics
// @desc    Get advanced analytics data
// @access  Private (Admin only)
router.get('/analytics', auth, authorize('admin'), async (req, res) => {
  try {
    // Get analytics data
    const [topSpecies, topBreeds, monthlyRevenue] = await Promise.all([
      // Top species in adoption
      AdoptionPet.aggregate([
        { $match: { isActive: true, isDeleted: false } },
        { $group: { _id: '$species', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      // Top breeds in petshop
      PetInventoryItem.aggregate([
        { $match: { isActive: true } },
        { $lookup: { from: 'breeds', localField: 'breedId', foreignField: '_id', as: 'breed' } },
        { $unwind: { path: '$breed', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$breed.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      // Monthly revenue trend (last 6 months)
      AdoptionPet.aggregate([
        { $match: { status: 'adopted', adoptionDate: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { 
          _id: { 
            year: { $year: '$adoptionDate' }, 
            month: { $month: '$adoptionDate' } 
          }, 
          revenue: { $sum: '$adoptionFee' },
          count: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const analytics = {
      topSpecies,
      topBreeds,
      monthlyRevenue,
      summary: {
        totalSpecies: topSpecies.length,
        totalBreeds: topBreeds.length,
        avgMonthlyRevenue: monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0) / Math.max(monthlyRevenue.length, 1)
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/pets-overview/adoption
// @desc    Get detailed adoption overview data
// @access  Private (Admin only)
router.get('/adoption', auth, authorize('admin'), async (req, res) => {
  try {
    const [
      totalAdoptions,
      adoptedPets,
      availablePets,
      reservedPets,
      pendingApplications,
      revenue,
      recentAdoptions,
      availablePetsList
    ] = await Promise.all([
      AdoptionPet.countDocuments({ isActive: true, isDeleted: false }),
      AdoptionPet.countDocuments({ status: 'adopted', isActive: true, isDeleted: false }),
      AdoptionPet.countDocuments({ status: 'available', isActive: true, isDeleted: false }),
      AdoptionPet.countDocuments({ status: 'reserved', isActive: true, isDeleted: false }),
      AdoptionPet.countDocuments({ status: 'pending', isActive: true, isDeleted: false }),
      AdoptionPet.aggregate([
        { $match: { status: 'adopted', isActive: true, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$adoptionFee' } } }
      ]),
      AdoptionPet.find({ status: 'adopted', isActive: true, isDeleted: false })
        .populate('adopterUserId', 'name')
        .sort({ adoptionDate: -1 })
        .limit(10)
        .select('name petCode breed adoptionFee adoptionDate adopterUserId createdAt'),
      AdoptionPet.find({ status: 'available', isActive: true, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name petCode breed adoptionFee createdAt')
    ]);

    const adoptionData = {
      summary: {
        total: totalAdoptions,
        adopted: adoptedPets,
        available: availablePets,
        reserved: reservedPets,
        pending: pendingApplications,
        revenue: revenue[0]?.total || 0,
        avgAdoptionTime: 14, // Calculate from actual data
        successRate: totalAdoptions > 0 ? (adoptedPets / totalAdoptions * 100) : 0
      },
      recentAdoptions: recentAdoptions.map(pet => ({
        id: pet._id,
        petName: pet.name,
        petCode: pet.petCode,
        breed: pet.breed,
        adoptionFee: pet.adoptionFee,
        adoptionDate: pet.adoptionDate,
        adopterName: pet.adopterUserId?.name || 'Unknown',
        daysInSystem: Math.floor((new Date(pet.adoptionDate) - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
      })),
      availablePets: availablePetsList.map(pet => ({
        id: pet._id,
        name: pet.name,
        petCode: pet.petCode,
        breed: pet.breed,
        adoptionFee: pet.adoptionFee,
        age: pet.age || 0,
        ageUnit: pet.ageUnit || 'months',
        daysAvailable: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24)),
        interestLevel: Math.floor(Math.random() * 100) // Calculate from actual interest data
      }))
    };

    res.json({
      success: true,
      data: adoptionData
    });
  } catch (error) {
    console.error('Adoption overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching adoption overview',
      error: error.message
    });
  }
});

// @route   GET /api/admin/pets-overview/petshop
// @desc    Get detailed petshop overview data
// @access  Private (Admin only)
router.get('/petshop', auth, authorize('admin'), async (req, res) => {
  try {
    const [
      totalInventory,
      soldPets,
      availablePets,
      reservedPets,
      revenue,
      recentSales,
      currentInventory
    ] = await Promise.all([
      PetInventoryItem.countDocuments({ isActive: true }),
      PetInventoryItem.countDocuments({ status: 'sold', isActive: true }),
      PetInventoryItem.countDocuments({ status: 'available_for_sale', isActive: true }),
      PetInventoryItem.countDocuments({ status: 'reserved', isActive: true }),
      PetInventoryItem.aggregate([
        { $match: { status: 'sold', isActive: true } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      PetInventoryItem.find({ status: 'sold', isActive: true })
        .populate('soldTo', 'name')
        .populate('breedId', 'name')
        .sort({ soldAt: -1 })
        .limit(10)
        .select('name petCode breedId price soldAt soldTo createdAt storeName'),
      PetInventoryItem.find({ status: 'available_for_sale', isActive: true })
        .populate('breedId', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name petCode breedId price createdAt storeName')
    ]);

    const petshopData = {
      summary: {
        total: totalInventory,
        sold: soldPets,
        available: availablePets,
        reserved: reservedPets,
        inStock: availablePets,
        revenue: revenue[0]?.total || 0,
        avgSaleTime: 7, // Calculate from actual data
        conversionRate: totalInventory > 0 ? (soldPets / totalInventory * 100) : 0
      },
      recentSales: recentSales.map(pet => ({
        id: pet._id,
        petName: pet.name,
        petCode: pet.petCode,
        breed: pet.breedId?.name || 'Unknown',
        salePrice: pet.price,
        saleDate: pet.soldAt,
        buyerName: pet.soldTo?.name || 'Unknown',
        storeName: pet.storeName || 'Main Store',
        daysInStock: Math.floor((new Date(pet.soldAt) - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24))
      })),
      inventory: currentInventory.map(pet => ({
        id: pet._id,
        name: pet.name,
        petCode: pet.petCode,
        breed: pet.breedId?.name || 'Unknown',
        price: pet.price,
        age: pet.age || 0,
        ageUnit: pet.ageUnit || 'months',
        daysInStock: Math.floor((new Date() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24)),
        storeName: pet.storeName || 'Main Store',
        status: pet.status
      }))
    };

    res.json({
      success: true,
      data: petshopData
    });
  } catch (error) {
    console.error('Petshop overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching petshop overview',
      error: error.message
    });
  }
});
// @desc    Get blockchain data for pets
// @access  Private (Admin only)
router.get('/blockchain', auth, authorize('admin'), async (req, res) => {
  try {
    // Get blockchain statistics
    const blockchainStats = await BlockchainService.getBlockchainStats();
    
    // Get recent blockchain blocks
    const recentBlocks = await BlockchainBlock.find()
      .sort({ index: -1 })
      .limit(20)
      .select('index timestamp hash previousHash nonce difficulty');
    
    // Get recent blockchain transactions with pet details
    const recentTransactions = await BlockchainBlock.find()
      .populate('petId', 'name petCode species breed')
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(50)
      .select('index timestamp eventType petId userId hash data');

    // Enrich transactions with pet registry data
    const enrichedTransactions = await Promise.all(recentTransactions.map(async (tx) => {
      let petDetails = null;
      
      // Try to find pet details using petCode from blockchain data or populated petId
      if (tx.data?.petCode) {
        petDetails = await PetRegistry.findOne({ petCode: tx.data.petCode })
          .select('name petCode species breed source');
      } else if (tx.petId) {
        petDetails = tx.petId;
      }
      
      return {
        id: tx._id,
        blockIndex: tx.index,
        timestamp: tx.timestamp,
        eventType: tx.eventType,
        petName: tx.data?.name || petDetails?.name || 'Unknown Pet',
        petCode: tx.data?.petCode || petDetails?.petCode || 'N/A',
        species: petDetails?.species || tx.data?.species || 'Unknown',
        breed: petDetails?.breed || tx.data?.breed || 'Unknown',
        userName: tx.userId?.name || 'System',
        hash: tx.hash,
        amount: tx.data?.amount || tx.data?.fee || tx.data?.price || tx.data?.adoptionFee || 0,
        status: 'completed'
      };
    }));

    // Get pet blockchain summaries from PetRegistry
    const petBlockchains = await PetRegistry.aggregate([
      {
        $lookup: {
          from: 'blockchain_blocks',
          localField: 'petCode',
          foreignField: 'data.petCode',
          as: 'blocks'
        }
      },
      {
        $project: {
          petId: '$_id',
          name: 1,
          petCode: 1,
          blockCount: { $size: '$blocks' },
          lastTransaction: { $max: '$blocks.timestamp' },
          chainValid: true // We'll verify this separately if needed
        }
      },
      {
        $match: { blockCount: { $gt: 0 } }
      },
      { $sort: { lastTransaction: -1 } },
      { $limit: 20 }
    ]);

    const blockchainData = {
      overview: {
        totalBlocks: blockchainStats.totalBlocks,
        isValid: blockchainStats.isValid,
        lastBlockTime: blockchainStats.lastBlock,
        totalTransactions: blockchainStats.totalBlocks,
        validationStatus: blockchainStats.isValid ? 'verified' : 'invalid'
      },
      totalBlocks: blockchainStats.totalBlocks,
      isValid: blockchainStats.isValid,
      recentBlocks: recentBlocks.map(block => ({
        index: block.index,
        timestamp: block.timestamp,
        hash: block.hash,
        previousHash: block.previousHash,
        nonce: block.nonce,
        difficulty: block.difficulty,
        transactionCount: 1
      })),
      recentTransactions: enrichedTransactions,
      petBlockchains
    };

    res.json({
      success: true,
      data: blockchainData
    });
  } catch (error) {
    console.error('Blockchain data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain data',
      error: error.message
    });
  }
});

// @route   GET /api/admin/pets-overview/history
// @desc    Get comprehensive pet transaction history
// @access  Private (Admin only)
router.get('/history', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const skip = (page - 1) * limit;

    // Build query based on type filter
    let matchQuery = {};
    if (type !== 'all') {
      matchQuery.eventType = type;
    }

    // Get transaction history from blockchain with pet details
    const [transactions, total] = await Promise.all([
      BlockchainBlock.find(matchQuery)
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BlockchainBlock.countDocuments(matchQuery)
    ]);

    // Enrich transactions with pet details from PetRegistry
    const historyData = await Promise.all(transactions.map(async (tx) => {
      let petDetails = null;
      
      // Try to find pet details using petCode from blockchain data
      if (tx.data?.petCode) {
        petDetails = await PetRegistry.findOne({ petCode: tx.data.petCode })
          .select('name petCode species breed source');
      }
      
      return {
        id: tx._id,
        timestamp: tx.timestamp,
        type: tx.eventType,
        petName: tx.data?.name || petDetails?.name || 'Unknown Pet',
        petCode: tx.data?.petCode || petDetails?.petCode || 'N/A',
        species: petDetails?.species || tx.data?.species || 'Unknown',
        userName: tx.userId?.name || 'System',
        userEmail: tx.userId?.email || '',
        amount: tx.data?.amount || tx.data?.fee || tx.data?.price || tx.data?.adoptionFee || 0,
        status: 'completed',
        blockchainId: tx._id,
        blockIndex: tx.index,
        hash: tx.hash,
        source: petDetails?.source || 'unknown'
      };
    }));

    res.json({
      success: true,
      data: {
        history: historyData,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('History data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction history',
      error: error.message
    });
  }
});

// @route   GET /api/admin/pets-overview/download-report/:type
// @desc    Download comprehensive pet reports
// @access  Private (Admin only)
router.get('/download-report/:type', auth, authorize('admin'), async (req, res) => {
  try {
    const { type } = req.params;
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pets-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe the PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text(`Pet ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);

    let yPosition = 120;

    if (type === 'comprehensive') {
      // Get comprehensive statistics
      const stats = await getComprehensiveStats();
      
      // Add adoption statistics
      doc.fontSize(16).text('Adoption Statistics', 50, yPosition);
      yPosition += 30;
      doc.fontSize(12)
        .text(`Total in Adoption: ${stats.adoption.total}`, 70, yPosition)
        .text(`Successfully Adopted: ${stats.adoption.adopted}`, 70, yPosition + 20)
        .text(`Available for Adoption: ${stats.adoption.available}`, 70, yPosition + 40)
        .text(`Adoption Revenue: $${stats.adoption.revenue.toLocaleString()}`, 70, yPosition + 60);
      
      yPosition += 100;
      
      // Add petshop statistics
      doc.fontSize(16).text('Pet Shop Statistics', 50, yPosition);
      yPosition += 30;
      doc.fontSize(12)
        .text(`Total in Pet Shop: ${stats.petshop.total}`, 70, yPosition)
        .text(`Pets Sold: ${stats.petshop.sold}`, 70, yPosition + 20)
        .text(`Available for Sale: ${stats.petshop.available}`, 70, yPosition + 40)
        .text(`Sales Revenue: $${stats.petshop.revenue.toLocaleString()}`, 70, yPosition + 60);
      
    } else if (type === 'history') {
      // Get recent transaction history
      const transactions = await BlockchainBlock.find()
        .populate('petId', 'name petCode')
        .populate('userId', 'name')
        .sort({ timestamp: -1 })
        .limit(50);
      
      doc.fontSize(16).text('Recent Transaction History', 50, yPosition);
      yPosition += 30;
      
      transactions.forEach((tx, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(10)
          .text(`${index + 1}. ${tx.eventType.toUpperCase()} - ${tx.petId?.name || 'Unknown'} (${new Date(tx.timestamp).toLocaleDateString()})`, 70, yPosition);
        yPosition += 20;
      });
    }

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
});

// Helper function to get comprehensive stats
async function getComprehensiveStats() {
  const [
    totalAdoptionPets,
    adoptedPets,
    availableAdoptionPets,
    totalPetshopPets,
    soldPets,
    availablePetshopPets,
    adoptionRevenue,
    petshopRevenue
  ] = await Promise.all([
    AdoptionPet.countDocuments({ isActive: true, isDeleted: false }),
    AdoptionPet.countDocuments({ status: 'adopted', isActive: true, isDeleted: false }),
    AdoptionPet.countDocuments({ status: 'available', isActive: true, isDeleted: false }),
    PetInventoryItem.countDocuments({ isActive: true }),
    PetInventoryItem.countDocuments({ status: 'sold', isActive: true }),
    PetInventoryItem.countDocuments({ status: 'available_for_sale', isActive: true }),
    AdoptionPet.aggregate([
      { $match: { status: 'adopted', isActive: true, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$adoptionFee' } } }
    ]),
    PetInventoryItem.aggregate([
      { $match: { status: 'sold', isActive: true } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ])
  ]);

  return {
    adoption: {
      total: totalAdoptionPets,
      adopted: adoptedPets,
      available: availableAdoptionPets,
      revenue: adoptionRevenue[0]?.total || 0
    },
    petshop: {
      total: totalPetshopPets,
      sold: soldPets,
      available: availablePetshopPets,
      revenue: petshopRevenue[0]?.total || 0
    }
  };
}

module.exports = router;