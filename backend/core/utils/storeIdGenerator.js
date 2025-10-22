const crypto = require('crypto')

// Prefix map per module
const MODULE_PREFIX = {
  adoption: 'ADP',
  petshop: 'PSP',
  ecommerce: 'ECM',
  veterinary: 'VET',
  pharmacy: 'PHM',
  rescue: 'RSC',
  'temporary-care': 'TPC'
}

// Generate an ID like: PREFIX + '1' + 5 random digits (e.g., PSP146285)
function generateCandidate(prefix) {
  const rnd = Math.floor(10000 + Math.random() * 90000) // 5 digits
  return `${prefix}1${rnd}`
}

async function isUnique(candidate, models) {
  for (const { model, field } of models) {
    const exists = await model.findOne({ [field]: candidate }).lean().exec()
    if (exists) return false
  }
  return true
}

/**
 * Generate a unique storeId for a module.
 * Ensures uniqueness across provided models/fields.
 * @param {('adoption'|'petshop'|'ecommerce'|'veterinary'|'pharmacy'|'rescue'|'temporary-care')} moduleKey
 * @param {Array<{model: mongoose.Model, field: string}>} uniquenessScopes
 */
async function generateStoreId(moduleKey, uniquenessScopes = []) {
  const prefix = MODULE_PREFIX[moduleKey]
  if (!prefix) throw new Error(`Unknown module key: ${moduleKey}`)

  for (let i = 0; i < 50; i++) {
    const candidate = generateCandidate(prefix)
    if (await isUnique(candidate, uniquenessScopes)) return candidate
  }
  throw new Error('Failed to generate unique storeId after multiple attempts')
}

module.exports = { generateStoreId, MODULE_PREFIX }

// ---- Optional: Centralized cross-module convenience ----
// Attempts to load known models across modules and checks both `storeId` and `storeCode` fields.
// Use this if you want project-wide uniqueness without manually passing scopes.

function safeRequire(path) {
  try { return require(path) } catch (_) { return null }
}

function buildDefaultScopes() {
  const scopes = []
  const candidates = [
    // Core/Shared store models (if any)
    { model: safeRequire('../core/models/Store'), fields: ['storeId', 'storeCode'] },
    // Module stores (adjust names to your actual models)
    { model: safeRequire('../../modules/petshop/manager/models/PetShop'), fields: ['storeId', 'storeCode'] },
    { model: safeRequire('../../modules/adoption/manager/models/AdoptionPet'), fields: ['storeId', 'storeCode'] },
    { model: safeRequire('../../modules/veterinary/manager/models/VeterinaryClinic'), fields: ['storeId', 'storeCode'] },
    { model: safeRequire('../../modules/ecommerce/models/EcommerceStore'), fields: ['storeId', 'storeCode'] },
    { model: safeRequire('../../modules/pharmacy/models/PharmacyStore'), fields: ['storeId', 'storeCode'] },
    { model: safeRequire('../../modules/rescue/models/RescueCenter'), fields: ['storeId', 'storeCode'] },
    { model: safeRequire('../../modules/temporary-care/manager/models/TemporaryCareCenter'), fields: ['storeId', 'storeCode'] },
  ]
  for (const entry of candidates) {
    if (!entry.model) continue
    for (const field of entry.fields) scopes.push({ model: entry.model, field })
  }
  return scopes
}

async function generateGlobalStoreId(moduleKey) {
  return generateStoreId(moduleKey, buildDefaultScopes())
}

module.exports.generateGlobalStoreId = generateGlobalStoreId