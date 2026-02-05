const mongoose = require('mongoose');
require('../core/db');

const Product = require('../modules/ecommerce/models/Product');

async function checkProducts() {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const totalActive = await Product.countDocuments({ isActive: true });
        console.log('Total active products:', totalActive);
        
        const withStock = await Product.countDocuments({ 
            isActive: true, 
            'inventory.stock': { $gt: 0 } 
        });
        console.log('Active products with stock:', withStock);
        
        const sample = await Product.findOne({ isActive: true }).lean();
        console.log('\nSample product:');
        console.log(JSON.stringify(sample, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProducts();
