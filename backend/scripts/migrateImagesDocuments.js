const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Pet = require('../core/models/Pet');
const AdoptionPet = require('../modules/adoption/models/AdoptionPet');
const PetInventoryItem = require('../modules/petshop/models/PetInventoryItem');
const PetRegistry = require('../core/models/PetRegistry');
const PetNew = require('../core/models/PetNew');
const PetShop = require('../modules/petshop/models/PetShop');
const Product = require('../modules/ecommerce/models/Product');
const InventoryItem = require('../modules/petshop/models/InventoryItem');
const Image = require('../core/models/Image');
const Document = require('../core/models/Document');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/petwelfare', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Migrate Pet images and documents
    console.log('Migrating Pet images and documents...');
    const pets = await Pet.find({ 
      $or: [
        { images: { $exists: true, $ne: [] } },
        { documents: { $exists: true, $ne: [] } }
      ]
    });

    for (const pet of pets) {
      console.log(`Migrating pet: ${pet._id}`);
      
      // Migrate images
      if (pet.images && pet.images.length > 0) {
        const imageIds = [];
        for (const img of pet.images) {
          const image = new Image({
            url: img.url,
            caption: img.caption,
            isPrimary: img.isPrimary,
            entityType: 'Pet',
            entityId: pet._id,
            uploadedAt: img.uploadedAt || new Date()
          });
          await image.save();
          imageIds.push(image._id);
        }
        pet.imageIds = imageIds;
        // Remove the old images array
        pet.images = undefined;
        await pet.save();
        console.log(`  Migrated ${imageIds.length} images`);
      }

      // Migrate documents
      if (pet.documents && pet.documents.length > 0) {
        const documentIds = [];
        for (const doc of pet.documents) {
          const document = new Document({
            name: doc.name,
            type: doc.type,
            url: doc.url,
            entityType: 'Pet',
            entityId: pet._id,
            uploadedAt: doc.uploadedAt || new Date()
          });
          await document.save();
          documentIds.push(document._id);
        }
        pet.documentIds = documentIds;
        // Remove the old documents array
        pet.documents = undefined;
        await pet.save();
        console.log(`  Migrated ${documentIds.length} documents`);
      }
    }

    // Migrate AdoptionPet images and documents
    console.log('Migrating AdoptionPet images and documents...');
    const adoptionPets = await AdoptionPet.find({ 
      $or: [
        { images: { $exists: true, $ne: [] } },
        { documents: { $exists: true, $ne: [] } }
      ]
    });

    for (const pet of adoptionPets) {
      console.log(`Migrating adoption pet: ${pet._id}`);
      
      // Migrate images
      if (pet.images && pet.images.length > 0) {
        const imageIds = [];
        for (const img of pet.images) {
          const image = new Image({
            url: img.url,
            caption: img.caption,
            isPrimary: img.isPrimary,
            entityType: 'AdoptionPet',
            entityId: pet._id,
            uploadedAt: img.uploadedAt || new Date()
          });
          await image.save();
          imageIds.push(image._id);
        }
        pet.imageIds = imageIds;
        // Remove the old images array
        pet.images = undefined;
        await pet.save();
        console.log(`  Migrated ${imageIds.length} images`);
      }

      // Migrate documents
      if (pet.documents && pet.documents.length > 0) {
        const documentIds = [];
        for (const doc of pet.documents) {
          const document = new Document({
            name: doc.name,
            type: doc.type,
            url: doc.url,
            entityType: 'AdoptionPet',
            entityId: pet._id,
            uploadedAt: doc.uploadedAt || new Date()
          });
          await document.save();
          documentIds.push(document._id);
        }
        pet.documentIds = documentIds;
        // Remove the old documents array
        pet.documents = undefined;
        await pet.save();
        console.log(`  Migrated ${documentIds.length} documents`);
      }
    }

    // Migrate PetInventoryItem images
    console.log('Migrating PetInventoryItem images...');
    const inventoryItems = await PetInventoryItem.find({ 
      images: { $exists: true, $ne: [] } 
    });

    for (const item of inventoryItems) {
      console.log(`Migrating inventory item: ${item._id}`);
      
      // Migrate images
      if (item.images && item.images.length > 0) {
        const imageIds = [];
        for (const img of item.images) {
          const image = new Image({
            url: img.url,
            caption: img.caption,
            isPrimary: img.isPrimary,
            entityType: 'PetInventoryItem',
            entityId: item._id,
            uploadedAt: img.uploadedAt || new Date()
          });
          await image.save();
          imageIds.push(image._id);
        }
        item.imageIds = imageIds;
        // Remove the old images array
        item.images = undefined;
        await item.save();
        console.log(`  Migrated ${imageIds.length} images`);
      }
    }

    // Migrate PetRegistry images
    console.log('Migrating PetRegistry images...');
    const registries = await PetRegistry.find({ 
      images: { $exists: true, $ne: [] } 
    });

    for (const registry of registries) {
      console.log(`Migrating registry: ${registry._id}`);
      
      // Migrate images
      if (registry.images && registry.images.length > 0) {
        const imageIds = [];
        for (const img of registry.images) {
          const image = new Image({
            url: img.url,
            caption: img.caption,
            isPrimary: img.isPrimary,
            entityType: 'PetRegistry',
            entityId: registry._id,
            uploadedAt: new Date()
          });
          await image.save();
          imageIds.push(image._id);
        }
        registry.imageIds = imageIds;
        // Remove the old images array
        registry.images = undefined;
        await registry.save();
        console.log(`  Migrated ${imageIds.length} images`);
      }
    }

    // Migrate PetNew images and documents
    console.log('Migrating PetNew images and documents...');
    const newPets = await PetNew.find({ 
      $or: [
        { images: { $exists: true, $ne: [] } },
        { documents: { $exists: true, $ne: [] } }
      ]
    });

    for (const pet of newPets) {
      console.log(`Migrating new pet: ${pet._id}`);
      
      // Migrate images
      if (pet.images && pet.images.length > 0) {
        const imageIds = [];
        for (const img of pet.images) {
          const image = new Image({
            url: img.url,
            caption: img.alt,
            isPrimary: img.isPrimary,
            entityType: 'PetNew',
            entityId: pet._id,
            uploadedAt: img.uploadedAt || new Date()
          });
          await image.save();
          imageIds.push(image._id);
        }
        pet.imageIds = imageIds;
        // Remove the old images array
        pet.images = undefined;
        await pet.save();
        console.log(`  Migrated ${imageIds.length} images`);
      }

      // Migrate documents
      if (pet.documents && pet.documents.length > 0) {
        const documentIds = [];
        for (const doc of pet.documents) {
          const document = new Document({
            name: doc.name,
            type: doc.type,
            url: doc.url,
            entityType: 'PetNew',
            entityId: pet._id,
            uploadedAt: doc.uploadedAt || new Date()
          });
          await document.save();
          documentIds.push(document._id);
        }
        pet.documentIds = documentIds;
        // Remove the old documents array
        pet.documents = undefined;
        await pet.save();
        console.log(`  Migrated ${documentIds.length} documents`);
      }
    }

    // Migrate PetShop images
    console.log('Migrating PetShop images...');
    const petShops = await PetShop.find({ 
      images: { $exists: true, $ne: [] } 
    });

    for (const shop of petShops) {
      console.log(`Migrating pet shop: ${shop._id}`);
      
      // Migrate images
      if (shop.images && shop.images.length > 0) {
        const imageIds = [];
        for (const imageUrl of shop.images) {
          const image = new Image({
            url: imageUrl,
            entityType: 'PetShop',
            entityId: shop._id,
            uploadedAt: new Date()
          });
          await image.save();
          imageIds.push(image._id);
        }
        shop.imageIds = imageIds;
        // Remove the old images array
        shop.images = undefined;
        await shop.save();
        console.log(`  Migrated ${imageIds.length} images`);
      }
    }

    // Migrate Product images
    console.log('Migrating Product images...');
    const products = await Product.find({ 
      images: { $exists: true, $ne: [] } 
    });

    for (const product of products) {
      console.log(`Migrating product: ${product._id}`);
      
      // Migrate images
      if (product.images && product.images.length > 0) {
        const imageIds = [];
        for (const imageUrl of product.images) {
          const image = new Image({
            url: imageUrl,
            entityType: 'Product',
            entityId: product._id,
            uploadedAt: new Date()
          });
          await image.save();
          imageIds.push(image._id);
        }
        product.imageIds = imageIds;
        // Remove the old images array
        product.images = undefined;
        await product.save();
        console.log(`  Migrated ${imageIds.length} images`);
      }
    }

    // Migrate InventoryItem images
    console.log('Migrating InventoryItem images...');
    const inventoryItemsNew = await InventoryItem.find({ 
      images: { $exists: true, $ne: [] } 
    });

    for (const item of inventoryItemsNew) {
      console.log(`Migrating inventory item: ${item._id}`);
      
      // Migrate images
      if (item.images && item.images.length > 0) {
        const imageIds = [];
        for (const img of item.images) {
          const image = new Image({
            url: img.url,
            isPrimary: img.isPrimary,
            entityType: 'InventoryItem',
            entityId: item._id,
            uploadedAt: new Date()
          });
          await image.save();
          imageIds.push(image._id);
        }
        item.imageIds = imageIds;
        // Remove the old images array
        item.images = undefined;
        await item.save();
        console.log(`  Migrated ${imageIds.length} images`);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
});