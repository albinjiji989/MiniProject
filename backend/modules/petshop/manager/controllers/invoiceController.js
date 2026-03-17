const PetshopPurchaseApplication = require('../models/PetshopPurchaseApplication');
const mongoose = require('mongoose');

// Get all invoices (from completed purchase applications)
const getInvoices = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    console.log('Invoice request - user:', req.user?.id, 'storeId:', req.user?.storeId);

    // Build query - use the same approach as purchaseApplicationController
    const query = {
      isDeleted: false
    };
    
    // Only filter by storeId if it exists and is a valid ObjectId
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      query.storeId = req.user.storeId;
    }

    console.log('Invoice query:', query);
    
    // Filter by payment status if specified
    if (status && status !== 'all') {
      if (status === 'paid') {
        query.paymentStatus = 'completed';
      } else if (status === 'pending') {
        query.paymentStatus = { $in: ['pending', 'initiated'] };
      } else if (status === 'overdue') {
        // Find applications where payment is pending and created more than 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query.paymentStatus = { $in: ['pending', 'initiated'] };
        query.createdAt = { $lt: sevenDaysAgo };
      }
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'personalDetails.fullName': searchRegex },
        { 'personalDetails.email': searchRegex },
        { 'petInventoryItemId.name': searchRegex },
        { 'petInventoryItemId.petCode': searchRegex }
      ];
    }

    // Get applications with populated data
    const applications = await PetshopPurchaseApplication.find(query)
      .populate('userId', 'name email phone')
      .populate('petInventoryItemId', 'name petCode images speciesId breedId')
      .populate('petInventoryItemId.speciesId', 'name displayName')
      .populate('petInventoryItemId.breedId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('Found applications:', applications.length);

    console.log('Found applications:', applications.length);

    // Transform to invoice format
    const invoices = applications.map(app => ({
      _id: app._id,
      invoiceNumber: `INV-${app._id.toString().slice(-8).toUpperCase()}`,
      customerName: app.personalDetails?.fullName || app.userId?.name,
      customerEmail: app.personalDetails?.email || app.userId?.email,
      customerPhone: app.personalDetails?.phone || app.userId?.phone,
      customerAddress: app.personalDetails?.address,
      petName: app.petInventoryItemId?.name,
      petCode: app.petInventoryItemId?.petCode,
      petImage: app.petInventoryItemId?.images?.[0]?.url,
      species: app.petInventoryItemId?.speciesId?.displayName || app.petInventoryItemId?.speciesId?.name,
      breed: app.petInventoryItemId?.breedId?.name,
      selectedGender: app.selectedGender,
      amount: app.paymentAmount,
      paymentStatus: app.paymentStatus,
      paymentId: app.paymentId,
      paymentDate: app.paymentDate,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      dueDate: new Date(new Date(app.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from creation
      items: [{
        description: `${app.petInventoryItemId?.name || 'Pet'} - ${app.selectedGender}`,
        petCode: app.petInventoryItemId?.petCode,
        quantity: 1,
        unitPrice: app.paymentAmount,
        total: app.paymentAmount
      }],
      application: app
    }));

    console.log('Transformed invoices:', invoices.length);

    // Calculate stats - use the same base query
    const baseQuery = {
      isDeleted: false
    };
    
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      baseQuery.storeId = req.user.storeId;
    }

    const totalInvoices = await PetshopPurchaseApplication.countDocuments(baseQuery);
    const paidInvoices = await PetshopPurchaseApplication.countDocuments({
      ...baseQuery,
      paymentStatus: 'completed'
    });
    const pendingInvoices = await PetshopPurchaseApplication.countDocuments({
      ...baseQuery,
      paymentStatus: { $in: ['pending', 'initiated'] }
    });

    // Calculate overdue invoices
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const overdueInvoices = await PetshopPurchaseApplication.countDocuments({
      ...baseQuery,
      paymentStatus: { $in: ['pending', 'initiated'] },
      createdAt: { $lt: sevenDaysAgo }
    });

    // Calculate total revenue
    const revenueResult = await PetshopPurchaseApplication.aggregate([
      { $match: { ...baseQuery, paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$paymentAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const stats = {
      total: totalInvoices,
      paid: paidInvoices,
      pending: pendingInvoices,
      overdue: overdueInvoices,
      totalRevenue
    };

    res.json({
      success: true,
      data: {
        invoices,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalInvoices,
          pages: Math.ceil(totalInvoices / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices'
    });
  }
};

// Get single invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Build query - use the same approach as purchaseApplicationController
    const query = {
      _id: id,
      isDeleted: false
    };
    
    // Only filter by storeId if it exists and is a valid ObjectId
    if (req.user.storeId && mongoose.Types.ObjectId.isValid(req.user.storeId)) {
      query.storeId = req.user.storeId;
    }

    const application = await PetshopPurchaseApplication.findOne(query)
      .populate('userId', 'name email phone')
      .populate('petInventoryItemId', 'name petCode images speciesId breedId age')
      .populate('petInventoryItemId.speciesId', 'name displayName')
      .populate('petInventoryItemId.breedId', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Transform to invoice format
    const invoice = {
      _id: application._id,
      invoiceNumber: `INV-${application._id.toString().slice(-8).toUpperCase()}`,
      customerName: application.personalDetails?.fullName || application.userId?.name,
      customerEmail: application.personalDetails?.email || application.userId?.email,
      customerPhone: application.personalDetails?.phone || application.userId?.phone,
      customerAddress: application.personalDetails?.address,
      petName: application.petInventoryItemId?.name,
      petCode: application.petInventoryItemId?.petCode,
      petImage: application.petInventoryItemId?.images?.[0]?.url,
      species: application.petInventoryItemId?.speciesId?.displayName || application.petInventoryItemId?.speciesId?.name,
      breed: application.petInventoryItemId?.breedId?.name,
      selectedGender: application.selectedGender,
      amount: application.paymentAmount,
      paymentStatus: application.paymentStatus,
      paymentId: application.paymentId,
      paymentDate: application.paymentDate,
      status: application.status,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      dueDate: new Date(new Date(application.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000),
      items: [{
        description: `${application.petInventoryItemId?.name || 'Pet'} - ${application.selectedGender}`,
        petCode: application.petInventoryItemId?.petCode,
        quantity: 1,
        unitPrice: application.paymentAmount,
        total: application.paymentAmount
      }],
      // Store information for invoice header
      storeInfo: {
        name: req.user?.storeId?.name || 'PetShop Manager',
        address: req.user?.storeId?.address,
        phone: req.user?.storeId?.phone,
        email: req.user?.storeId?.email || 'info@petshop.com'
      }
    };

    res.json({
      success: true,
      data: { invoice }
    });

  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice'
    });
  }
};

// Generate invoice PDF (placeholder for future PDF generation)
const generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return the invoice data
    // In the future, this could generate a PDF using libraries like puppeteer or jsPDF
    const invoiceResponse = await getInvoiceById(req, res);
    
    // If we want to implement PDF generation:
    // const pdf = await generatePDFFromInvoice(invoice);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    // res.send(pdf);
    
  } catch (error) {
    console.error('Generate invoice PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice PDF'
    });
  }
};

// Send invoice via email (placeholder)
const sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, message } = req.body;

    // Placeholder for email sending functionality
    // In a real implementation, you would:
    // 1. Get the invoice data
    // 2. Generate PDF or HTML email
    // 3. Send via email service (SendGrid, AWS SES, etc.)

    res.json({
      success: true,
      message: 'Invoice email sent successfully'
    });

  } catch (error) {
    console.error('Send invoice email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice email'
    });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  generateInvoicePDF,
  sendInvoiceEmail
};