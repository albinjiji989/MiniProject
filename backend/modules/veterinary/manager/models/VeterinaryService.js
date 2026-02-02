// This file re-exports the main VeterinaryService model to avoid duplication
// All veterinary services should use the same model regardless of who creates them

const VeterinaryService = require('../../models/VeterinaryService');

module.exports = VeterinaryService;