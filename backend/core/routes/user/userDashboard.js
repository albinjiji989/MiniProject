const express = require('express')
const router = express.Router()
const { auth } = require('../../../core/middleware/auth')
const User = require('../../../core/models/User')
// Module models for real user data aggregation
const PetShopWishlist = require('../../../modules/petshop/user/models/Wishlist')
const PetReservation = require('../../../modules/petshop/user/models/PetReservation')
const PetShopOrder = require('../../../modules/petshop/user/models/ShopOrder')
const AdoptionRequest = require('../../../modules/adoption/manager/models/AdoptionRequest')
const AdoptionPet = require('../../../modules/adoption/manager/models/AdoptionPet')

// @route   GET /api/user-dashboard/stats
// @desc    Get user dashboard statistics
// @access  Private (All authenticated users)
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Parallel aggregation for performance
    const [
      adoptedPetsCount,
      adoptionCompletedCount,
      wishlistCount,
      reservationsCount,
      paidOrdersAgg
    ] = await Promise.all([
      // Pets adopted by this user (from AdoptionPet)
      AdoptionPet.countDocuments({ adopterUserId: userId, status: 'adopted', isActive: true }).catch(() => 0),
      // Completed adoption requests (fallback/secondary)
      AdoptionRequest.countDocuments({ userId, status: 'completed', isActive: true }).catch(() => 0),
      // Wishlist items (pet shop)
      PetShopWishlist.countDocuments({ userId }).catch(() => 0),
      // Reservations created by user
      PetReservation.countDocuments({ userId }).catch(() => 0),
      // Total spent from paid shop orders
      PetShopOrder.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId(userId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]).catch(() => [])
    ])

    const ordersPaid = Array.isArray(paidOrdersAgg) && paidOrdersAgg.length > 0 ? paidOrdersAgg[0].count : 0
    const totalSpentPaise = Array.isArray(paidOrdersAgg) && paidOrdersAgg.length > 0 ? paidOrdersAgg[0].total : 0
    const totalSpent = (totalSpentPaise || 0) / 100 // convert paise -> INR

    const stats = {
      adoptedPets: adoptedPetsCount || adoptionCompletedCount || 0,
      wishlist: wishlistCount || 0,
      reservations: reservationsCount || 0,
      orders: ordersPaid || 0,
      totalSpent: Number(totalSpent.toFixed(2)),
      memberSince: req.user.createdAt
    }

    res.json({ success: true, data: { stats } })
  } catch (error) {
    console.error('Get user dashboard stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   GET /api/user-dashboard/activities
// @desc    Get user recent activities
// @access  Private (All authenticated users)
router.get('/activities', auth, async (req, res) => {
  try {
    const userId = req.user.id

    // Fetch recent items from multiple modules in parallel
    const [
      recentReservations,
      recentWishlist,
      recentApplications,
      recentOrders
    ] = await Promise.all([
      PetReservation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('itemId', 'name price images')
        .lean()
        .catch(() => []),
      PetShopWishlist.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('itemId', 'name price images')
        .lean()
        .catch(() => []),
      AdoptionRequest.find({ userId, isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('petId', 'name breed images')
        .lean()
        .catch(() => []),
      PetShopOrder.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .catch(() => [])
    ])

    // Normalize to a unified activity feed
    const activities = [
      ...recentReservations.map(r => ({
        type: 'reservation',
        title: `Reserved: ${r.itemId?.name || 'Pet'}`,
        time: r.createdAt,
        status: r.status,
        meta: { reservationCode: r.reservationCode, amount: r.paymentInfo?.amount }
      })),
      ...recentWishlist.map(w => ({
        type: 'wishlist',
        title: `Wishlisted: ${w.itemId?.name || 'Pet'}`,
        time: w.createdAt,
        status: 'saved',
        meta: { price: w.itemId?.price }
      })),
      ...recentApplications.map(a => ({
        type: 'adoption_application',
        title: `Adoption application for ${a.petId?.name || 'Pet'}`,
        time: a.createdAt,
        status: a.status,
        meta: { applicationId: a._id }
      })),
      ...recentOrders.map(o => ({
        type: 'order',
        title: `Order ${o._id} - ${o.status}`,
        time: o.createdAt,
        status: o.status,
        meta: { amount: o.amount }
      }))
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10)

    res.json({ success: true, data: { activities } })
  } catch (error) {
    console.error('Get user activities error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   GET /api/user-dashboard/notifications
// @desc    Get user notifications
// @access  Private (All authenticated users)
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Placeholder for real notifications source; returning empty for now to avoid dummy content
    const notifications = []
    
    // Real notification data will be fetched from:
    // - System notifications
    // - Module-specific notifications
    // - Updates and alerts

    res.json({
      success: true,
      data: {
        notifications
      }
    })
  } catch (error) {
    console.error('Get user notifications error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

// @route   GET /api/user-dashboard/module-stats
// @desc    Get module-specific statistics for user
// @access  Private (All authenticated users)
router.get('/module-stats', auth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Provide minimal real module stats where available to avoid dummy data
    const [applicationsCount, wishlistCount, reservationsCount, ordersAgg] = await Promise.all([
      AdoptionRequest.countDocuments({ userId, isActive: true }).catch(() => 0),
      PetShopWishlist.countDocuments({ userId }).catch(() => 0),
      PetReservation.countDocuments({ userId }).catch(() => 0),
      PetShopOrder.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId(userId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]).catch(() => [])
    ])

    const moduleStats = {
      adoption: {
        applications: applicationsCount || 0
      },
      ecommerce: {
        orders: (ordersAgg[0]?.count) || 0,
        totalSpent: (((ordersAgg[0]?.total) || 0) / 100)
      },
      petshop: {
        wishlist: wishlistCount || 0,
        reservations: reservationsCount || 0
      }
    }

    res.json({
      success: true,
      data: {
        moduleStats
      }
    })
  } catch (error) {
    console.error('Get module stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

module.exports = router
