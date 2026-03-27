const Pet = require('../../../core/models/Pet');
const User = require('../../../core/models/User');
const Product = require('../../ecommerce/models/Product');
const Order = require('../../ecommerce/models/Order');
const ProductCategory = require('../../ecommerce/models/ProductCategory');

const reportsController = {
  // Generate adoption module report data - Focus on adopted pets and revenue
  async getAdoptionReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.updatedAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get adopted pets statistics
      const adoptedPets = await Pet.find({
        ...dateFilter,
        isActive: true,
        currentStatus: 'Adopted'
      })
      .select('petCode name customBreedInfo.species customBreedInfo.breed adoptionFee updatedAt createdAt ownerId')
      .populate('speciesId', 'name')
      .populate('breedId', 'name')
      .populate('ownerId', 'name email')
      .sort({ updatedAt: -1 });

      // Calculate total adoption revenue
      const totalRevenue = adoptedPets.reduce((sum, pet) => sum + (pet.adoptionFee || 0), 0);

      // Get adoption statistics by species
      const speciesStats = await Pet.aggregate([
        {
          $match: {
            ...dateFilter,
            isActive: true,
            currentStatus: 'Adopted'
          }
        },
        {
          $lookup: {
            from: 'species',
            localField: 'speciesId',
            foreignField: '_id',
            as: 'speciesInfo'
          }
        },
        {
          $group: {
            _id: {
              $ifNull: [
                { $arrayElemAt: ['$speciesInfo.name', 0] },
                '$customBreedInfo.species'
              ]
            },
            count: { $sum: 1 },
            totalRevenue: { $sum: '$adoptionFee' },
            avgFee: { $avg: '$adoptionFee' }
          }
        },
        {
          $sort: { totalRevenue: -1 }
        }
      ]);

      // Get adoption statistics by breed
      const breedStats = await Pet.aggregate([
        {
          $match: {
            ...dateFilter,
            isActive: true,
            currentStatus: 'Adopted'
          }
        },
        {
          $lookup: {
            from: 'breeds',
            localField: 'breedId',
            foreignField: '_id',
            as: 'breedInfo'
          }
        },
        {
          $group: {
            _id: {
              $ifNull: [
                { $arrayElemAt: ['$breedInfo.name', 0] },
                '$customBreedInfo.breed'
              ]
            },
            count: { $sum: 1 },
            totalRevenue: { $sum: '$adoptionFee' },
            avgFee: { $avg: '$adoptionFee' }
          }
        },
        {
          $sort: { totalRevenue: -1 }
        }
      ]);

      // Monthly adoption trends
      const monthlyStats = await Pet.aggregate([
        {
          $match: {
            ...dateFilter,
            isActive: true,
            currentStatus: 'Adopted'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$updatedAt' },
              month: { $month: '$updatedAt' }
            },
            adoptions: { $sum: 1 },
            revenue: { $sum: '$adoptionFee' }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 }
        }
      ]);

      const reportData = {
        module: 'Adoption',
        summary: {
          totalAdoptions: adoptedPets.length,
          totalRevenue: totalRevenue,
          avgAdoptionFee: adoptedPets.length > 0 ? (totalRevenue / adoptedPets.length).toFixed(2) : 0,
          dateRange: {
            from: startDate ? new Date(startDate).toLocaleDateString() : 'All time',
            to: endDate ? new Date(endDate).toLocaleDateString() : 'Present'
          }
        },
        adoptedPets: adoptedPets.map(pet => ({
          petCode: pet.petCode || pet._id,
          name: pet.name,
          species: pet.speciesId?.name || pet.customBreedInfo?.species || 'Unknown',
          breed: pet.breedId?.name || pet.customBreedInfo?.breed || 'Mixed',
          adoptionFee: pet.adoptionFee || 0,
          adoptedDate: pet.updatedAt,
          adopter: pet.ownerId?.name || 'Unknown',
          adopterEmail: pet.ownerId?.email || 'N/A'
        })),
        speciesBreakdown: speciesStats.map(species => ({
          species: species._id || 'Unknown',
          adoptions: species.count,
          totalRevenue: species.totalRevenue || 0,
          avgFee: species.avgFee ? species.avgFee.toFixed(2) : 0
        })),
        breedBreakdown: breedStats.map(breed => ({
          breed: breed._id || 'Unknown',
          adoptions: breed.count,
          totalRevenue: breed.totalRevenue || 0,
          avgFee: breed.avgFee ? breed.avgFee.toFixed(2) : 0
        })),
        monthlyTrends: monthlyStats.map(stat => ({
          month: new Date(stat._id.year, stat._id.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
          adoptions: stat.adoptions,
          revenue: stat.revenue || 0
        }))
      };

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      console.error('Adoption report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate adoption report',
        error: error.message
      });
    }
  },

  // Generate petshop module report data - Focus on pets purchased by breed and revenue
  async getPetshopReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get completed orders with pet-related products
      const completedOrders = await Order.find({
        ...dateFilter,
        status: { $in: ['delivered', 'completed'] },
        'payment.status': 'completed'
      })
      .populate({
        path: 'items.product',
        select: 'name pricing category petType species breeds',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'species', select: 'name' },
          { path: 'breeds', select: 'name' }
        ]
      })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

      // Calculate total revenue from pet shop orders
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
      const totalOrders = completedOrders.length;

      // Analyze products by pet breeds they're designed for
      let breedAnalysis = {};
      let productSales = {};
      let totalItemsSold = 0;

      completedOrders.forEach(order => {
        order.items.forEach(item => {
          const product = item.product;
          if (product) {
            // Track product sales
            if (!productSales[product._id]) {
              productSales[product._id] = {
                name: product.name,
                category: product.category?.name || 'Uncategorized',
                quantitySold: 0,
                totalRevenue: 0,
                unitPrice: item.price
              };
            }
            productSales[product._id].quantitySold += item.quantity;
            productSales[product._id].totalRevenue += item.total;
            totalItemsSold += item.quantity;

            // Track by breeds if product has breed specifications
            if (product.breeds && product.breeds.length > 0) {
              product.breeds.forEach(breed => {
                const breedName = breed.name || 'Unknown Breed';
                if (!breedAnalysis[breedName]) {
                  breedAnalysis[breedName] = {
                    breed: breedName,
                    productsPurchased: 0,
                    totalRevenue: 0,
                    products: {}
                  };
                }
                breedAnalysis[breedName].productsPurchased += item.quantity;
                breedAnalysis[breedName].totalRevenue += item.total;
                
                if (!breedAnalysis[breedName].products[product.name]) {
                  breedAnalysis[breedName].products[product.name] = 0;
                }
                breedAnalysis[breedName].products[product.name] += item.quantity;
              });
            } else {
              // For products without specific breed, categorize as "All Breeds"
              const breedName = 'All Breeds';
              if (!breedAnalysis[breedName]) {
                breedAnalysis[breedName] = {
                  breed: breedName,
                  productsPurchased: 0,
                  totalRevenue: 0,
                  products: {}
                };
              }
              breedAnalysis[breedName].productsPurchased += item.quantity;
              breedAnalysis[breedName].totalRevenue += item.total;
              
              if (!breedAnalysis[breedName].products[product.name]) {
                breedAnalysis[breedName].products[product.name] = 0;
              }
              breedAnalysis[breedName].products[product.name] += item.quantity;
            }
          }
        });
      });

      // Convert to arrays and sort
      const breedBreakdown = Object.values(breedAnalysis).sort((a, b) => b.totalRevenue - a.totalRevenue);
      const productBreakdown = Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Category analysis
      const categoryStats = await Order.aggregate([
        {
          $match: {
            ...dateFilter,
            status: { $in: ['delivered', 'completed'] },
            'payment.status': 'completed'
          }
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $lookup: {
            from: 'productcategories',
            localField: 'productInfo.category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $group: {
            _id: {
              $ifNull: [
                { $arrayElemAt: ['$categoryInfo.name', 0] },
                'Uncategorized'
              ]
            },
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.total' },
            orderCount: { $addToSet: '$_id' }
          }
        },
        {
          $project: {
            category: '$_id',
            totalQuantity: 1,
            totalRevenue: 1,
            orderCount: { $size: '$orderCount' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      const reportData = {
        module: 'Pet Shop',
        summary: {
          totalOrders: totalOrders,
          totalRevenue: Math.round(totalRevenue),
          totalItemsSold: totalItemsSold,
          avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
          dateRange: {
            from: startDate ? new Date(startDate).toLocaleDateString() : 'All time',
            to: endDate ? new Date(endDate).toLocaleDateString() : 'Present'
          }
        },
        breedAnalysis: breedBreakdown.map(breed => ({
          breed: breed.breed,
          itemsPurchased: breed.productsPurchased,
          totalRevenue: Math.round(breed.totalRevenue),
          topProducts: Object.entries(breed.products)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, qty]) => ({ name, quantity: qty }))
        })),
        productSales: productBreakdown.slice(0, 20).map(product => ({
          name: product.name,
          category: product.category,
          quantitySold: product.quantitySold,
          unitPrice: product.unitPrice,
          totalRevenue: Math.round(product.totalRevenue)
        })),
        categoryBreakdown: categoryStats.map(cat => ({
          category: cat.category,
          itemsSold: cat.totalQuantity,
          revenue: Math.round(cat.totalRevenue),
          orders: cat.orderCount
        })),
        recentOrders: completedOrders.slice(0, 10).map(order => ({
          orderNumber: order.orderNumber,
          customer: order.customer?.name || 'Unknown',
          items: order.items.length,
          total: Math.round(order.pricing?.total || 0),
          date: order.createdAt
        }))
      };

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      console.error('Petshop report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate petshop report',
        error: error.message
      });
    }
  },

  // Generate ecommerce module report data - Complete product sales like a real bill
  async getEcommerceReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get all completed orders with detailed product information
      const completedOrders = await Order.find({
        ...dateFilter,
        status: { $in: ['delivered', 'completed'] },
        'payment.status': 'completed'
      })
      .populate({
        path: 'items.product',
        select: 'name pricing category',
        populate: {
          path: 'category',
          select: 'name'
        }
      })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

      // Calculate comprehensive statistics
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
      const totalOrders = completedOrders.length;
      
      // Get unique customers
      const uniqueCustomers = new Set(completedOrders.map(order => order.customer?._id?.toString()).filter(Boolean));
      const totalCustomers = uniqueCustomers.size;

      // Detailed product analysis - like a real bill
      let productSales = {};
      let totalItemsSold = 0;
      let orderDetails = [];

      completedOrders.forEach(order => {
        let orderItems = [];
        let orderTotal = 0;

        order.items.forEach(item => {
          const product = item.product;
          if (product) {
            // Track individual product sales
            const productKey = product._id.toString();
            if (!productSales[productKey]) {
              productSales[productKey] = {
                name: product.name,
                category: product.category?.name || 'Uncategorized',
                unitPrice: item.price,
                quantitySold: 0,
                totalRevenue: 0,
                orders: new Set()
              };
            }
            
            productSales[productKey].quantitySold += item.quantity;
            productSales[productKey].totalRevenue += item.total;
            productSales[productKey].orders.add(order._id.toString());
            totalItemsSold += item.quantity;

            // Order item details
            orderItems.push({
              productName: product.name,
              category: product.category?.name || 'Uncategorized',
              quantity: item.quantity,
              unitPrice: item.price,
              total: item.total
            });
            orderTotal += item.total;
          }
        });

        // Complete order details
        orderDetails.push({
          orderNumber: order.orderNumber,
          customer: order.customer?.name || 'Unknown Customer',
          customerEmail: order.customer?.email || 'N/A',
          orderDate: order.createdAt,
          items: orderItems,
          itemCount: orderItems.length,
          totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: order.pricing?.subtotal || orderTotal,
          tax: order.pricing?.tax || 0,
          shipping: order.pricing?.shipping || 0,
          discount: order.pricing?.discount || 0,
          total: order.pricing?.total || orderTotal,
          status: order.status
        });
      });

      // Convert product sales to array and add order count
      const productBreakdown = Object.values(productSales).map(product => ({
        ...product,
        orderCount: product.orders.size,
        orders: undefined // Remove the Set object
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Category analysis
      const categoryStats = {};
      Object.values(productSales).forEach(product => {
        const category = product.category;
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category: category,
            products: 0,
            quantitySold: 0,
            totalRevenue: 0,
            orderCount: 0
          };
        }
        categoryStats[category].products += 1;
        categoryStats[category].quantitySold += product.quantitySold;
        categoryStats[category].totalRevenue += product.totalRevenue;
        categoryStats[category].orderCount += product.orderCount;
      });

      const categoryBreakdown = Object.values(categoryStats).sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Monthly sales analysis
      const monthlySales = await Order.aggregate([
        {
          $match: {
            ...dateFilter,
            status: { $in: ['delivered', 'completed'] },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$pricing.total' },
            customers: { $addToSet: '$customer' }
          }
        },
        {
          $project: {
            month: {
              $dateToString: {
                format: '%B %Y',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month'
                  }
                }
              }
            },
            orders: 1,
            revenue: 1,
            customers: { $size: '$customers' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      ]);

      const reportData = {
        module: 'Ecommerce',
        summary: {
          totalOrders: totalOrders,
          totalRevenue: Math.round(totalRevenue),
          totalProducts: Object.keys(productSales).length,
          totalItemsSold: totalItemsSold,
          totalCustomers: totalCustomers,
          avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
          avgItemsPerOrder: totalOrders > 0 ? (totalItemsSold / totalOrders).toFixed(1) : 0,
          dateRange: {
            from: startDate ? new Date(startDate).toLocaleDateString() : 'All time',
            to: endDate ? new Date(endDate).toLocaleDateString() : 'Present'
          }
        },
        productSales: productBreakdown.map(product => ({
          name: product.name,
          category: product.category,
          quantitySold: product.quantitySold,
          unitPrice: product.unitPrice,
          totalRevenue: Math.round(product.totalRevenue),
          orderCount: product.orderCount
        })),
        orderDetails: orderDetails.slice(0, 50), // Limit to 50 most recent orders
        categoryBreakdown: categoryBreakdown.map(cat => ({
          category: cat.category,
          products: cat.products,
          quantitySold: cat.quantitySold,
          totalRevenue: Math.round(cat.totalRevenue),
          orderCount: cat.orderCount
        })),
        monthlySales: monthlySales.map(month => ({
          month: month.month,
          orders: month.orders,
          revenue: Math.round(month.revenue),
          customers: month.customers
        })),
        topCustomers: orderDetails
          .reduce((acc, order) => {
            const existing = acc.find(c => c.email === order.customerEmail);
            if (existing) {
              existing.orders += 1;
              existing.totalSpent += order.total;
            } else {
              acc.push({
                name: order.customer,
                email: order.customerEmail,
                orders: 1,
                totalSpent: order.total
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10)
      };

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      console.error('Ecommerce report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate ecommerce report',
        error: error.message
      });
    }
  }
};

module.exports = reportsController;