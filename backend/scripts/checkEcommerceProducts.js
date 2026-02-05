const mongoose = require('mongoose');
require('../core/db');

const Product = require('../modules/ecommerce/models/Product');

async function checkProducts() {
    try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('=== ECOMMERCE PRODUCTS CHECK ===\n');
        
        const total = await Product.countDocuments({});
        console.log('Total products:', total);
        
        const active = await Product.countDocuments({ isActive: true });
        console.log('Active products (isActive: true):', active);
        
        const withStock = await Product.countDocuments({ 
            isActive: true, 
            'inventory.stock': { $gt: 0 } 
        });
        console.log('Active products with stock > 0:', withStock);
        
        const withoutInventory = await Product.countDocuments({
            isActive: true,
            inventory: { $exists: false }
        });
        console.log('Active products WITHOUT inventory field:', withoutInventory);
        
        const withInventoryButNoStock = await Product.countDocuments({
            isActive: true,
            inventory: { $exists: true },
            'inventory.stock': { $lte: 0 }
        });
        console.log('Active products with inventory.stock <= 0:', withInventoryButNoStock);
        
        console.log('\n=== SAMPLE PRODUCTS ===\n');
        
        const samples = await Product.find({ isActive: true }).limit(3).lean();
        samples.forEach((product, idx) => {
            console.log(`Product ${idx + 1}:`);
            console.log('  ID:', product._id);
            console.log('  Name:', product.name);
            console.log('  isActive:', product.isActive);
            console.log('  inventory:', JSON.stringify(product.inventory));
            console.log('  pricing:', JSON.stringify(product.pricing));
            console.log('');
        });
        
        if (samples.length === 0) {
            console.log('No active products found!\n');
            const anySample = await Product.findOne({}).lean();
            if (anySample) {
                console.log('Sample of ANY product (may be inactive):');
                console.log('  ID:', anySample._id);
                console.log('  Name:', anySample.name);
                console.log('  isActive:', anySample.isActive);
                console.log('  inventory:', JSON.stringify(anySample.inventory));
            } else {
                console.log('DATABASE IS COMPLETELY EMPTY - NO PRODUCTS AT ALL!');
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProducts();
