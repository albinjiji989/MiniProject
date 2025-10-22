const PetShop = require('../models/PetShop');
const Pet = require('../../../core/models/Pet');
const PetInventoryItem = require('../models/PetInventoryItem');
const PetReservation = require('../../user/models/PetReservation');
const Wishlist = require('../../user/models/Wishlist');
const { getStoreFilter } = require('../../../core/utils/storeFilter');
const { validationResult } = require('express-validator');
const logger = require('winston');

// Log controller actions with user context and operation details
const logAction = (req, action, data = {}) => {
  const userInfo = req.user ? `${req.user._id} (${req.user.role})` : 'unauthenticated';
  logger.info({
    action,
    user: userInfo,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Core Pet Shop Functions
const listPetShops = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user) };

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const petShops = await PetShop.find(filter)
      .populate('createdBy', 'name email')
      .populate('staff.user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetShop.countDocuments(filter);
    res.json({ success: true, data: { petShops, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (error) {
    console.error('Get pet shops error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPetShopById = async (req, res) => {
  try {
    const petShop = await PetShop.findOne({ _id: req.params.id, ...getStoreFilter(req.user) })
      .populate('createdBy', 'name email')
      .populate('staff.user', 'name email role')
      .populate('pets', 'name species breed age gender images');
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });
    res.json({ success: true, data: { petShop } });
  } catch (error) {
    console.error('Get pet shop error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createPetShop = async (req, res) => {
  logAction(req, 'create_petshop', { 
    name: req.body.name,
    owner: req.body.ownerId 
  });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const petShopData = {
      ...req.body,
      createdBy: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      capacity: { ...req.body.capacity, current: 0, available: req.body.capacity.total }
    };
    const petShop = new PetShop(petShopData);
    await petShop.save();
    await petShop.populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Pet shop created successfully', data: { petShop } });
  } catch (error) {
    console.error('Create pet shop error:', error);
    res.status(500).json({ success: false, message: 'Server error during pet shop creation' });
  }
};

const updatePetShop = async (req, res) => {
  logAction(req, 'update_petshop', { 
    petshopId: req.params.id,
    updates: Object.keys(req.body)
  });
  try {
    const petShop = await PetShop.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });

    const updatedPetShop = await PetShop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email');
    res.json({ success: true, message: 'Pet shop updated successfully', data: { petShop: updatedPetShop } });
  } catch (error) {
    console.error('Update pet shop error:', error);
    res.status(500).json({ success: false, message: 'Server error during pet shop update' });
  }
};

const addPetToPetShop = async (req, res) => {
  logAction(req, 'add_pet_to_petshop', { 
    petshopId: req.params.id,
    petId: req.body.petId
  });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const { petId } = req.body;
    const petShop = await PetShop.findById(req.params.id);
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });

    if (petShop.capacity.current >= petShop.capacity.total) {
      return res.status(400).json({ success: false, message: 'Pet shop is at full capacity' });
    }

    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    petShop.pets.push(petId);
    petShop.capacity.current += 1;
    petShop.capacity.available = petShop.capacity.total - petShop.capacity.current;
    await petShop.save();

    pet.currentStatus = 'in_petshop';
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    res.json({ success: true, message: 'Pet added to pet shop successfully', data: { petShop } });
  } catch (error) {
    console.error('Add pet to pet shop error:', error);
    res.status(500).json({ success: false, message: 'Server error during pet addition' });
  }
};

const addProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const petShop = await PetShop.findById(req.params.id);
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });

    petShop.products.push(req.body);
    await petShop.save();

    res.json({ success: true, message: 'Product added successfully', data: { petShop } });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ success: false, message: 'Server error during product addition' });
  }
};

const addService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const petShop = await PetShop.findById(req.params.id);
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });

    petShop.services.push(req.body);
    await petShop.save();

    res.json({ success: true, message: 'Service added successfully', data: { petShop } });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ success: false, message: 'Server error during service addition' });
  }
};

const getPetShopStats = async (req, res) => {
  try {
    const storeFilter = getStoreFilter(req.user);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAnimals, availableForSale, staffMembers, totalProducts, totalServices] = await Promise.all([
      Pet.countDocuments({ ...storeFilter, currentStatus: 'in_petshop' }),
      Pet.countDocuments({ ...storeFilter, currentStatus: 'available_for_sale' }),
      PetShop.aggregate([
        { $match: storeFilter },
        { $unwind: '$staff' },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0),
      PetShop.aggregate([
        { $match: storeFilter },
        { $project: { productCount: { $size: '$products' } } },
        { $group: { _id: null, total: { $sum: '$productCount' } } }
      ]).then(r => r[0]?.total || 0),
      PetShop.aggregate([
        { $match: storeFilter },
        { $project: { serviceCount: { $size: '$services' } } },
        { $group: { _id: null, total: { $sum: '$serviceCount' } } }
      ]).then(r => r[0]?.total || 0)
    ]);

    res.json({ success: true, data: { totalAnimals, availableForSale, staffMembers, totalProducts, totalServices } });
  } catch (e) {
    console.error('Pet shop stats error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserPetShopStats = async (req, res) => {
  try {
    // Get user-focused stats that are relevant for pet shopping
    const [
      totalPetShops, 
      availableForSale, 
      myReservations,
      myWishlistItems
    ] = await Promise.all([
      PetShop.countDocuments({ isActive: true }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'available_for_sale' }),
      PetReservation.countDocuments({ userId: req.user._id }),
      Wishlist.countDocuments({ userId: req.user._id })
    ]);

    res.json({ 
      success: true, 
      data: { 
        totalPetShops, 
        availableForSale, 
        myReservations,
        myWishlistItems
      } 
    });
  } catch (e) {
    console.error('User pet shop stats error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listAnimals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const storeFilter = getStoreFilter(req.user);
    const animals = await Pet.find({ ...storeFilter, currentStatus: { $in: ['in_petshop', 'available_for_sale'] } })
      .populate('currentOwner', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Pet.countDocuments({ ...storeFilter, currentStatus: { $in: ['in_petshop', 'available_for_sale'] } });
    res.json({ success: true, data: { animals, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (e) {
    console.error('List animals error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listPetShops,
  getPetShopById,
  createPetShop,
  updatePetShop,
  addPetToPetShop,
  addProduct,
  addService,
  getPetShopStats,
  getUserPetShopStats,
  listAnimals
};