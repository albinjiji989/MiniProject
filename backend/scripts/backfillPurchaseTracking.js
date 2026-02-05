/**
 * Backfill purchase tracking data from existing orders
 * This adds ML tracking for all past orders
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../modules/ecommerce/models/Order');
const Product = require('../modules/ecommerce/models/Product');
const UserProductInteraction = require('../modules/ecommerce/user/models/UserProductInteraction');

async function backfillPurchaseTracking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all completed orders
    const orders = await Order.find({
      status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
    }).populate('items.product');

    console.log(`📦 Found ${orders.length} orders to backfill`);

    let trackCount = 0;

    for (const order of orders) {
      for (const item of order.items) {
        if (item.product && item.product._id) {
          await UserProductInteraction.findOneAndUpdate(
            { 
              userId: order.customer, 
              productId: item.product._id 
            },
            {
              $inc: { purchased: item.quantity },
              $set: { 
                lastPurchased: order.createdAt || new Date(),
                lastPrice: item.price
              }
            },
            { upsert: true, new: true }
          );
          
          trackCount++;
          console.log(`✅ Tracked: ${item.product.name} x${item.quantity} for order ${order.orderNumber}`);
        }
      }
    }

    console.log(`\n🎉 Backfill complete! Tracked ${trackCount} purchases from ${orders.length} orders`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Backfill error:', error);
    process.exit(1);
  }
}

backfillPurchaseTracking();
