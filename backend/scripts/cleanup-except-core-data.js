/**
 * Database Cleanup Script
 * 
 * KEEPS:
 * - All users (admin, managers, public users)
 * - UserDetails
 * - Modules
 * - Species
 * - Breeds
 * - Pet Categories
 * 
 * DELETES:
 * - All pets (PetNew, Pet, AdoptionPet, PetInventoryItem)
 * - All pet-related data (images, documents, medical records, ownership history)
 * - All reservations, bookings, orders
 * - All transactions and payments
 * - All reviews, wishlists, carts
 * - All temporary care, veterinary, pharmacy data
 * - All activities and logs
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Core models to KEEP
const User = require('../core/models/User');
const UserDetails = require('../core/models/UserDetails');
const Module = require('../core/models/Module');
const Species = require('../core/models/Species');
const Breed = require('../core/models/Breed');

// Pet models to DELETE
const Pet = require('../core/models/Pet');
const PetNew = require('../core/models/PetNew');
const PetRegistry = require('../core/models/PetRegistry');
const PetChangeLog = require('../core/models/PetChangeLog');
const Image = require('../core/models/Image');
const Document = require('../core/models/Document');

// Adoption models to DELETE
const AdoptionPet = require('../modules/adoption/manager/models/AdoptionPet');
const AdoptionRequest = require('../modules/adoption/manager/models/AdoptionRequest');
const AdoptionCertificate = require('../modules/adoption/manager/models/AdoptionCertificate');
const AdoptionInterview = require('../modules/adoption/manager/models/AdoptionInterview');

// PetShop models to DELETE
const PetInventoryItem = require('../modules/petshop/manager/models/PetInventoryItem');
const PetReservation = require('../modules/petshop/user/models/PetReservation');
const PetShop = require('../modules/petshop/manager/models/PetShop');
const Wishlist = require('../modules/petshop/user/models/Wishlist');
const Review = require('../modules/petshop/user/models/Review');
const Reservation = require('../modules/petshop/user/models/Reservation');
const ShopOrder = require('../modules/petshop/user/models/ShopOrder');
const InventoryItem = require('../modules/petshop/manager/models/InventoryItem');
const PetPricing = require('../modules/petshop/manager/models/PetPricing');
const Promotion = require('../modules/petshop/manager/models/Promotion');
const PurchaseOrder = require('../modules/petshop/manager/models/PurchaseOrder');
const PetShopService = require('../modules/petshop/manager/models/Service');

// Store name change requests (admin)
let StoreNameChangeRequest;
try {
  StoreNameChangeRequest = require('../modules/petshop/admin/models/StoreNameChangeRequest');
} catch (e) {
  console.log('   ⚠️  StoreNameChangeRequest model not found, skipping...');
}

// Temporary Care models to DELETE
const Caregiver = require('../modules/temporary-care/models/Caregiver');
const TemporaryCare = require('../modules/temporary-care/models/TemporaryCare');

// Veterinary, Pharmacy, E-commerce models to DELETE (if they exist)
let VeterinaryAppointment, VeterinaryClinic, VeterinaryService, MedicalRecord, Prescription, Vaccination;
let PharmacyProduct, PharmacyOrder;
let Product, Order, Cart;

try {
  VeterinaryAppointment = require('../modules/veterinary/models/VeterinaryAppointment');
} catch (e) { console.log('   ⚠️  VeterinaryAppointment model not found'); }

try {
  VeterinaryClinic = require('../modules/veterinary/models/VeterinaryClinic');
} catch (e) { console.log('   ⚠️  VeterinaryClinic model not found'); }

try {
  VeterinaryService = require('../modules/veterinary/models/VeterinaryService');
} catch (e) { console.log('   ⚠️  VeterinaryService model not found'); }

try {
  MedicalRecord = require('../modules/veterinary/models/MedicalRecord');
} catch (e) { console.log('   ⚠️  MedicalRecord model not found'); }

try {
  Prescription = require('../modules/veterinary/models/Prescription');
} catch (e) { console.log('   ⚠️  Prescription model not found'); }

try {
  Vaccination = require('../modules/veterinary/models/Vaccination');
} catch (e) { console.log('   ⚠️  Vaccination model not found'); }

try {
  PharmacyProduct = require('../modules/pharmacy/models/PharmacyProduct');
} catch (e) { console.log('   ⚠️  PharmacyProduct model not found'); }

try {
  PharmacyOrder = require('../modules/pharmacy/models/PharmacyOrder');
} catch (e) { console.log('   ⚠️  PharmacyOrder model not found'); }

try {
  Product = require('../modules/ecommerce/models/Product');
} catch (e) { console.log('   ⚠️  Product model not found'); }

try {
  Order = require('../modules/ecommerce/models/Order');
} catch (e) { console.log('   ⚠️  Order model not found'); }

try {
  Cart = require('../modules/ecommerce/models/Cart');
} catch (e) { console.log('   ⚠️  Cart model not found'); }

// Activity/Logs to DELETE
const Activity = require('../core/models/Activity');

const cleanupDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Starting database cleanup...\n');
    console.log('=' .repeat(60));
    console.log('KEEPING: Users, UserDetails, Modules, Species, Breeds');
    console.log('DELETING: All pets, reservations, bookings, orders, reviews, etc.');
    console.log('=' .repeat(60) + '\n');

    // Count what we're keeping
    const userCount = await User.countDocuments();
    const userDetailsCount = await UserDetails.countDocuments();
    const moduleCount = await Module.countDocuments();
    const speciesCount = await Species.countDocuments();
    const breedCount = await Breed.countDocuments();

    console.log('📊 DATA TO KEEP:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - UserDetails: ${userDetailsCount}`);
    console.log(`   - Modules: ${moduleCount}`);
    console.log(`   - Species: ${speciesCount}`);
    console.log(`   - Breeds: ${breedCount}\n`);

    // Delete pets and related data
    console.log('🐾 Deleting pet data...');
    const petNewResult = await PetNew.deleteMany({});
    console.log(`   ✓ Deleted ${petNewResult.deletedCount} user-added pets (PetNew)`);

    const petResult = await Pet.deleteMany({});
    console.log(`   ✓ Deleted ${petResult.deletedCount} legacy pets (Pet)`);

    const adoptionPetResult = await AdoptionPet.deleteMany({});
    console.log(`   ✓ Deleted ${adoptionPetResult.deletedCount} adoption pets`);

    const petInventoryResult = await PetInventoryItem.deleteMany({});
    console.log(`   ✓ Deleted ${petInventoryResult.deletedCount} pet shop inventory items`);

    const petRegistryResult = await PetRegistry.deleteMany({});
    console.log(`   ✓ Deleted ${petRegistryResult.deletedCount} pet registry entries`);

    const petChangeLogResult = await PetChangeLog.deleteMany({});
    console.log(`   ✓ Deleted ${petChangeLogResult.deletedCount} pet change logs`);

    // Delete images and documents
    console.log('\n📸 Deleting images and documents...');
    const imageResult = await Image.deleteMany({});
    console.log(`   ✓ Deleted ${imageResult.deletedCount} images`);

    const documentResult = await Document.deleteMany({});
    console.log(`   ✓ Deleted ${documentResult.deletedCount} documents`);

    // Delete adoption data
    console.log('\n🏠 Deleting adoption data...');
    const adoptionPetDeleteResult = await AdoptionPet.deleteMany({});
    console.log(`   ✓ Deleted ${adoptionPetDeleteResult.deletedCount} adoption pets`);

    const adoptionRequestResult = await AdoptionRequest.deleteMany({});
    console.log(`   ✓ Deleted ${adoptionRequestResult.deletedCount} adoption requests`);

    const adoptionCertResult = await AdoptionCertificate.deleteMany({});
    console.log(`   ✓ Deleted ${adoptionCertResult.deletedCount} adoption certificates`);

    const adoptionInterviewResult = await AdoptionInterview.deleteMany({});
    console.log(`   ✓ Deleted ${adoptionInterviewResult.deletedCount} adoption interviews`);

    // Delete petshop data
    console.log('\n🏪 Deleting pet shop data...');
    const reservationResult = await PetReservation.deleteMany({});
    console.log(`   ✓ Deleted ${reservationResult.deletedCount} pet reservations`);

    const generalReservationResult = await Reservation.deleteMany({});
    console.log(`   ✓ Deleted ${generalReservationResult.deletedCount} general reservations`);

    const petShopResult = await PetShop.deleteMany({});
    console.log(`   ✓ Deleted ${petShopResult.deletedCount} pet shops`);

    const wishlistResult = await Wishlist.deleteMany({});
    console.log(`   ✓ Deleted ${wishlistResult.deletedCount} wishlist items`);

    const reviewResult = await Review.deleteMany({});
    console.log(`   ✓ Deleted ${reviewResult.deletedCount} reviews`);

    const shopOrderResult = await ShopOrder.deleteMany({});
    console.log(`   ✓ Deleted ${shopOrderResult.deletedCount} shop orders`);

    const inventoryItemResult = await InventoryItem.deleteMany({});
    console.log(`   ✓ Deleted ${inventoryItemResult.deletedCount} inventory items`);

    const pricingResult = await PetPricing.deleteMany({});
    console.log(`   ✓ Deleted ${pricingResult.deletedCount} pet pricing records`);

    const promotionResult = await Promotion.deleteMany({});
    console.log(`   ✓ Deleted ${promotionResult.deletedCount} promotions`);

    const purchaseOrderResult = await PurchaseOrder.deleteMany({});
    console.log(`   ✓ Deleted ${purchaseOrderResult.deletedCount} purchase orders`);

    const petShopServiceResult = await PetShopService.deleteMany({});
    console.log(`   ✓ Deleted ${petShopServiceResult.deletedCount} pet shop services`);

    if (StoreNameChangeRequest) {
      const storeNameChangeResult = await StoreNameChangeRequest.deleteMany({});
      console.log(`   ✓ Deleted ${storeNameChangeResult.deletedCount} store name change requests`);
    }

    // Delete temporary care data
    console.log('\n🏡 Deleting temporary care data...');
    const caregiverResult = await Caregiver.deleteMany({});
    console.log(`   ✓ Deleted ${caregiverResult.deletedCount} caregivers`);

    const tempCareResult = await TemporaryCare.deleteMany({});
    console.log(`   ✓ Deleted ${tempCareResult.deletedCount} temporary care records`);

    // Delete veterinary data (if models exist)
    console.log('\n🏥 Deleting veterinary data...');
    if (VeterinaryAppointment) {
      const vetAppointmentResult = await VeterinaryAppointment.deleteMany({});
      console.log(`   ✓ Deleted ${vetAppointmentResult.deletedCount} veterinary appointments`);
    }

    if (VeterinaryClinic) {
      const vetClinicResult = await VeterinaryClinic.deleteMany({});
      console.log(`   ✓ Deleted ${vetClinicResult.deletedCount} veterinary clinics`);
    }

    if (VeterinaryService) {
      const vetServiceResult = await VeterinaryService.deleteMany({});
      console.log(`   ✓ Deleted ${vetServiceResult.deletedCount} veterinary services`);
    }

    if (MedicalRecord) {
      const medicalRecordResult = await MedicalRecord.deleteMany({});
      console.log(`   ✓ Deleted ${medicalRecordResult.deletedCount} medical records`);
    }

    if (Prescription) {
      const prescriptionResult = await Prescription.deleteMany({});
      console.log(`   ✓ Deleted ${prescriptionResult.deletedCount} prescriptions`);
    }

    if (Vaccination) {
      const vaccinationResult = await Vaccination.deleteMany({});
      console.log(`   ✓ Deleted ${vaccinationResult.deletedCount} vaccinations`);
    }

    // Delete pharmacy data (if models exist)
    console.log('\n💊 Deleting pharmacy data...');
    if (PharmacyProduct) {
      const pharmacyProductResult = await PharmacyProduct.deleteMany({});
      console.log(`   ✓ Deleted ${pharmacyProductResult.deletedCount} pharmacy products`);
    }

    if (PharmacyOrder) {
      const pharmacyOrderResult = await PharmacyOrder.deleteMany({});
      console.log(`   ✓ Deleted ${pharmacyOrderResult.deletedCount} pharmacy orders`);
    }

    // Delete e-commerce data (if models exist)
    console.log('\n🛒 Deleting e-commerce data...');
    if (Product) {
      const productResult = await Product.deleteMany({});
      console.log(`   ✓ Deleted ${productResult.deletedCount} products`);
    }

    if (Order) {
      const orderResult = await Order.deleteMany({});
      console.log(`   ✓ Deleted ${orderResult.deletedCount} orders`);
    }

    if (Cart) {
      const cartResult = await Cart.deleteMany({});
      console.log(`   ✓ Deleted ${cartResult.deletedCount} cart items`);
    }

    // Delete activity logs
    console.log('\n📝 Deleting activity logs...');
    const activityResult = await Activity.deleteMany({});
    console.log(`   ✓ Deleted ${activityResult.deletedCount} activity logs`);

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Database cleanup completed successfully!');
    console.log('=' .repeat(60));
    console.log('\n📊 FINAL STATUS:');
    console.log(`   - Users preserved: ${userCount}`);
    console.log(`   - UserDetails preserved: ${userDetailsCount}`);
    console.log(`   - Modules preserved: ${moduleCount}`);
    console.log(`   - Species preserved: ${speciesCount}`);
    console.log(`   - Breeds preserved: ${breedCount}`);
    console.log('\n   All other data has been deleted.\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Execute cleanup
cleanupDatabase();