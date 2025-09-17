const { validationResult } = require('express-validator');
const Shelter = require('../models/Shelter');
const Pet = require('../../../core/models/Pet');
const { getStoreFilter } = require('../../../utils/storeFilter');

const listShelters = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user) };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const shelters = await Shelter.find(filter)
      .populate('createdBy', 'name email')
      .populate('staff.user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Shelter.countDocuments(filter);

    res.json({ success: true, data: { shelters, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (error) {
    console.error('Get shelters error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getShelterById = async (req, res) => {
  try {
    const shelter = await Shelter.findOne({ _id: req.params.id, ...getStoreFilter(req.user) })
      .populate('createdBy', 'name email')
      .populate('staff.user', 'name email role')
      .populate('pets', 'name species breed age gender images');
    if (!shelter) return res.status(404).json({ success: false, message: 'Shelter not found' });
    res.json({ success: true, data: { shelter } });
  } catch (error) {
    console.error('Get shelter error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createShelter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const shelterData = {
      ...req.body,
      createdBy: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      capacity: { ...req.body.capacity, current: 0, available: req.body.capacity.total }
    };
    const shelter = new Shelter(shelterData);
    await shelter.save();
    await shelter.populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Shelter created successfully', data: { shelter } });
  } catch (error) {
    console.error('Create shelter error:', error);
    res.status(500).json({ success: false, message: 'Server error during shelter creation' });
  }
};

const updateShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!shelter) return res.status(404).json({ success: false, message: 'Shelter not found' });

    const updatedShelter = await Shelter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email');
    res.json({ success: true, message: 'Shelter updated successfully', data: { shelter: updatedShelter } });
  } catch (error) {
    console.error('Update shelter error:', error);
    res.status(500).json({ success: false, message: 'Server error during shelter update' });
  }
};

const addPetToShelter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const { petId } = req.body;
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) return res.status(404).json({ success: false, message: 'Shelter not found' });

    if (shelter.capacity.current >= shelter.capacity.total) {
      return res.status(400).json({ success: false, message: 'Shelter is at full capacity' });
    }

    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    shelter.pets.push(petId);
    shelter.capacity.current += 1;
    shelter.capacity.available = shelter.capacity.total - shelter.capacity.current;
    await shelter.save();

    pet.currentStatus = 'in_shelter';
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    res.json({ success: true, message: 'Pet added to shelter successfully', data: { shelter } });
  } catch (error) {
    console.error('Add pet to shelter error:', error);
    res.status(500).json({ success: false, message: 'Server error during pet addition' });
  }
};

const getShelterStats = async (req, res) => {
  try {
    const storeFilter = getStoreFilter(req.user);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAnimals, availableForAdoption, staffMembers, monthlyExpenses] = await Promise.all([
      Pet.countDocuments({ ...storeFilter, currentStatus: 'in_shelter' }),
      Pet.countDocuments({ ...storeFilter, currentStatus: 'available_for_adoption' }),
      Shelter.aggregate([
        { $match: storeFilter },
        { $unwind: '$staff' },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0),
      Shelter.aggregate([
        { $match: { ...storeFilter, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$monthlyExpenses' } } }
      ]).then(r => r[0]?.total || 0)
    ]);

    res.json({ success: true, data: { totalAnimals, availableForAdoption, staffMembers, monthlyExpenses } });
  } catch (e) {
    console.error('Shelter stats error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listAnimals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const storeFilter = getStoreFilter(req.user);
    const animals = await Pet.find({ ...storeFilter, currentStatus: { $in: ['in_shelter', 'available_for_adoption'] } })
      .populate('currentOwner', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Pet.countDocuments({ ...storeFilter, currentStatus: { $in: ['in_shelter', 'available_for_adoption'] } });
    res.json({ success: true, data: { animals, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (e) {
    console.error('List animals error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { listShelters, getShelterById, createShelter, updateShelter, addPetToShelter, getShelterStats, listAnimals };


