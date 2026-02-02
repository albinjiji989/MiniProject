// This file re-exports the main VeterinaryStaff model to avoid duplication
// All veterinary staff should use the same model regardless of who creates them

const VeterinaryStaff = require('../../models/VeterinaryStaff');

module.exports = VeterinaryStaff;