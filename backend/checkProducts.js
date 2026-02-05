const Product = require('./modules/ecommerce/models/Product');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const sellerId = '69607fa8f40cca3e87444c3e';
  
  const products = await Product.find({ 
    seller: sellerId, 
    status: { $in: ['active', 'out_of_stock'] } 
  }).select('name inventory.stock seller');
  
  console.log(`\nProducts for seller ${sellerId}:`);
  products.forEach(p => {
    console.log(`  - ${p.name}: stock=${p.inventory.stock}, id=${p._id}`);
  });
  
  console.log(`\nTotal: ${products.length} products`);
  
  // Check for Pedigree Dog Food specifically
  const pedigree = await Product.findById('698311c0117226c040ed46fb');
  if (pedigree) {
    console.log(`\n📦 Pedigree Dog Food:`);
    console.log(`   Seller: ${pedigree.seller}`);
    console.log(`   Status: ${pedigree.status}`);
    console.log(`   Stock: ${pedigree.inventory.stock}`);
    console.log(`   Match seller? ${pedigree.seller.toString() === sellerId}`);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
