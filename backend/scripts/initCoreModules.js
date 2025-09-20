const mongoose = require('mongoose')
const Module = require('../core/models/Module')
require('dotenv').config()

const coreModules = [
  {
    key: 'adoption',
    name: 'Adoption',
    description: 'Pet adoption management system',
    icon: 'Pets',
    color: '#4CAF50',
    status: 'active',
    hasManagerDashboard: true,
    isCoreModule: true,
    displayOrder: 1
  },
  {
    key: 'veterinary',
    name: 'Veterinary',
    description: 'Veterinary clinic management',
    icon: 'LocalHospital',
    color: '#2196F3',
    status: 'active',
    hasManagerDashboard: true,
    isCoreModule: true,
    displayOrder: 2
  },
  {
    key: 'rescue',
    name: 'Rescue',
    description: 'Animal rescue operations',
    icon: 'Build',
    color: '#FF9800',
    status: 'active',
    hasManagerDashboard: true,
    isCoreModule: true,
    displayOrder: 3
  },
  {
    key: 'shelter',
    name: 'Shelter',
    description: 'Animal shelter management',
    icon: 'Home',
    color: '#9C27B0',
    status: 'active',
    hasManagerDashboard: true,
    isCoreModule: true,
    displayOrder: 4
  },
  {
    key: 'pharmacy',
    name: 'Pharmacy',
    description: 'Pet pharmacy and medication management',
    icon: 'LocalPharmacy',
    color: '#F44336',
    status: 'active',
    hasManagerDashboard: true,
    isCoreModule: true,
    displayOrder: 5
  },
  {
    key: 'ecommerce',
    name: 'E-commerce',
    description: 'Pet supplies and products store',
    icon: 'ShoppingCart',
    color: '#607D8B',
    status: 'active',
    hasManagerDashboard: true,
    isCoreModule: true,
    displayOrder: 6
  },
  {
    key: 'temporary-care',
    name: 'Temporary Care',
    description: 'Temporary pet care services',
    icon: 'Settings',
    color: '#795548',
    status: 'active',
    hasManagerDashboard: true,
    isCoreModule: true,
    displayOrder: 7
  }
]

async function initCoreModules() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petcare')
    console.log('Connected to MongoDB')

    for (const moduleData of coreModules) {
      const existingModule = await Module.findOne({ key: moduleData.key })
      if (!existingModule) {
        const module = new Module(moduleData)
        await module.save()
        console.log(`Created core module: ${moduleData.name}`)
      } else {
        console.log(`Core module already exists: ${moduleData.name}`)
      }
    }

    console.log('Core modules initialization completed')
    process.exit(0)
  } catch (error) {
    console.error('Error initializing core modules:', error)
    process.exit(1)
  }
}

initCoreModules()
