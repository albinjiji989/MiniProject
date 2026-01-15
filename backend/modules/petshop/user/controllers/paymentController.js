const crypto = require('crypto');
const PetReservation = require('../models/PetReservation');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetStock = require('../../manager/models/PetStock');
const OwnershipHistory = require('../../../../core/models/OwnershipHistory');
const PetHistory = require('../../../../core/models/PetHistory');
const PetRegistryService = require('../../../../core/services/petRegistryService');
const { sendMail } = require('../../../../core/utils/email');
const paymentService = require('../../../../core/services/paymentService');
const UnifiedPetRegistrationService = require('../../../../core/services/unifiedPetRegistrationService');

const petshopBlockchainService = require('../../core/services/petshopBlockchainService');
// ===== Direct Buy Now (Bypasses Reservation/Approval) =====
const createDirectBuyOrder = async (req, res) => {
  try {
    const { itemId, deliveryMethod, deliveryAddress } = req.body;
    
    console.log('Creating direct buy order for:', {
      itemId,
      userId: req.user._id,
      deliveryMethod,
      hasRazorpayKeys: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
    
    // Verify item exists and is available
    const item = await PetInventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }
    // Blockchain verification before payment
    const isChainValid = await petshopBlockchainService.verifyChain('petId', item._id.toString());
    if (!isChainValid) {
      return res.status(400).json({ success: false, message: 'Blockchain verification failed for this pet. Action blocked.' });
    }
    if (item.status !== 'available_for_sale') {
      return res.status(400).json({ 
        success: false, 
        message: `Pet is not available for purchase. Current status: ${item.status}` 
      });
    }
    
    // Calculate total amount
    const petPrice = Number(item.price || 0);
    if (!petPrice || Number.isNaN(petPrice) || petPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Pet price not set' });
    }
    
    const deliveryCharges = deliveryMethod === 'delivery' ? 500 : 0;
    const taxes = Math.round(petPrice * 0.18);
    const totalAmount = petPrice + deliveryCharges + taxes;
    
    // Create a reservation with status 'payment_pending' to allow immediate payment
    const reservation = new PetReservation({
      userId: req.user._id,
      itemId: itemId,
      status: 'payment_pending', // Direct to payment, bypassing approval
      reservationType: 'direct_purchase',
      contactInfo: {
        phone: req.user.phone || '',
        email: req.user.email || '',
        preferredContactMethod: 'both'
      },
      deliveryInfo: {
        method: deliveryMethod || 'pickup',
        address: deliveryMethod === 'delivery' ? deliveryAddress : null
      },
      paymentInfo: {
        amount: totalAmount,
        currency: 'INR',
        paymentStatus: 'pending'
      },
      timeline: [{
        status: 'payment_pending',
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: 'Direct purchase - payment pending'
      }]
    });
    
    await reservation.save();
    // Blockchain logging: payment_direct_buy_initiated event
    try {
      await petshopBlockchainService.addBlock('payment_direct_buy_initiated', {
        reservationId: reservation._id,
        userId: req.user._id,
        itemId: itemId,
        amount: totalAmount,
        timestamp: new Date(),
      });
    } catch (err) {
      console.warn('Blockchain logging failed for payment_direct_buy_initiated:', err.message);
    }
    // Update item status to reserved
    item.status = 'reserved';
    await item.save();
    
    // Use the shared payment service
    const orderResult = await paymentService.createOrder(totalAmount, 'INR', {
      reservationId: reservation._id,
      userId: req.user._id,
      itemId: itemId,
      deliveryMethod: deliveryMethod || 'pickup',
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
      purchaseType: 'direct'
    });

    if (!orderResult.success) {
      // Rollback reservation if order creation fails
      await PetReservation.findByIdAndDelete(reservation._id);
      item.status = 'available_for_sale';
      await item.save();
      
      return res.status(400).json({ 
        success: false, 
        message: orderResult.error || 'Failed to create payment order'
      });
    }

    // Update reservation with order details
    reservation.paymentInfo = {
      ...reservation.paymentInfo,
      orderId: orderResult.order.id,
      amount: totalAmount,
      currency: 'INR',
      deliveryMethod: deliveryMethod || 'pickup',
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
      paymentStatus: 'pending'
    };
    await reservation.save();
    
    // Blockchain logging: payment_order_created event
    try {
      await petshopBlockchainService.addBlock('payment_order_created', {
        reservationId: reservation._id,
        userId: req.user._id,
        orderId: orderResult.order.id,
        amount: totalAmount,
        timestamp: new Date(),
      });
    } catch (err) {
      console.warn('Blockchain logging failed for payment_order_created:', err.message);
    }
    res.json({
      success: true,
      data: {
        reservationId: reservation._id,
        orderId: orderResult.order.id,
        amount: totalAmount * 100,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID
      },
      message: 'Order created successfully. Please proceed with payment.'
    });
  
  } catch (err) {
    console.error('Create direct buy order error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

// ===== Payment Gateway =====
const createRazorpayOrder = async (req, res) => {
  try {
    const { reservationId, amount, deliveryMethod, deliveryAddress } = req.body;
    
    console.log('Creating payment order for:', {
      reservationId,
      userId: req.user._id,
      deliveryMethod,
      hasRazorpayKeys: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
    
    // Verify reservation exists and belongs to user
    const reservation = await PetReservation.findOne({ 
      _id: reservationId, 
      userId: req.user._id 
    }).populate('itemId');
    
    if (!reservation) {
      console.log('Reservation not found for ID:', reservationId);
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    console.log('Found reservation:', {
      id: reservation._id,
      status: reservation.status,
      itemId: reservation.itemId?._id,
      itemPrice: reservation.itemId?.price
    });
    
    if (reservation.status === 'paid' || reservation.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Reservation already paid' });
    }
    
    // Only allow payment when manager has approved it (status changed to 'payment_pending' by manager)
    if (reservation.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: `Payment can only be initiated by manager after approval. Current status: ${reservation.status}` })
    }
    
    // Calculate total amount
    const petPrice = Number(reservation.itemId?.price || 0);
    if (!petPrice || Number.isNaN(petPrice) || petPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Item price not set for this reservation' })
    }
    const deliveryCharges = deliveryMethod === 'delivery' ? 500 : 0;
    const taxes = Math.round(petPrice * 0.18);
    const totalAmount = petPrice + deliveryCharges + taxes;
    
    // Use the shared payment service
    const orderResult = await paymentService.createOrder(totalAmount, 'INR', {
      reservationId: reservationId,
      userId: req.user._id,
      itemId: reservation.itemId._id,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null
    });

    if (!orderResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: orderResult.error || 'Failed to create payment order'
      });
    }

    // Update reservation with order details
    reservation.paymentInfo = {
      ...reservation.paymentInfo,
      orderId: orderResult.order.id,
      amount: totalAmount,
      currency: 'INR',
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
      paymentStatus: 'pending'
    };
    // Keep status as 'payment_pending' - it will be updated to 'paid' after payment verification
    await reservation.save();
    
    // Blockchain logging: payment_order_created event
    try {
      await petshopBlockchainService.addBlock('payment_order_created', {
        reservationId: reservation._id,
        userId: req.user._id,
        orderId: orderResult.order.id,
        amount: totalAmount,
        timestamp: new Date(),
      });
    } catch (err) {
      console.warn('Blockchain logging failed for payment_order_created:', err.message);
    }
    res.json({
      success: true,
      data: {
        orderId: orderResult.order.id,
        amount: totalAmount * 100,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      error: err.error
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

const verifyRazorpaySignature = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      reservationId,
      deliveryMethod,
      deliveryAddress
    } = req.body;
    
    console.log('Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      reservationId
    });
    
    // Use the shared payment service to verify payment
    const isVerified = paymentService.verifyPayment(razorpay_signature, razorpay_order_id, razorpay_payment_id);
    
    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
    
    // Update reservation
    const reservation = await PetReservation.findOne({ 
      _id: reservationId, 
      userId: req.user._id 
    }).populate('itemId').populate('userId', 'name email');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Get payment details from Razorpay
    const paymentDetails = await paymentService.getPaymentDetails(razorpay_payment_id);
    if (!paymentDetails.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to fetch payment details' 
      });
    }

    // Update payment details
    reservation.paymentInfo = {
      ...reservation.paymentInfo,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paymentStatus: 'completed',
      paidAt: new Date(),
      amount: reservation.paymentInfo?.amount || 0
    };
    reservation.status = 'at_owner';
    // Blockchain logging: payment_successful event
    try {
      await petshopBlockchainService.addBlock('payment_successful', {
        reservationId: reservation._id,
        userId: req.user._id,
        paymentId: razorpay_payment_id,
        amount: reservation.paymentInfo?.amount || 0,
        timestamp: new Date(),
      });
    } catch (err) {
      console.warn('Blockchain logging failed for payment_successful:', err.message);
    }

    // Check if this is a stock-based purchase
    const inventoryItem = await PetInventoryItem.findById(reservation.itemId._id)
      .populate('imageIds'); // Populate imageIds to ensure we get the images data
    
    // Manually populate the virtual 'images' field
    if (inventoryItem) {
      await inventoryItem.populate('images');
    }
    
    const isStockPurchase = inventoryItem?.tags?.includes('stock-purchase');
    let generatedPets = [];

    if (isStockPurchase) {
      // Extract stock info from tags
      const stockIdTag = inventoryItem.tags.find(t => t.startsWith('stock:'));
      const maleCountTag = inventoryItem.tags.find(t => t.startsWith('male:'));
      const femaleCountTag = inventoryItem.tags.find(t => t.startsWith('female:'));
      
      const stockId = stockIdTag?.split(':')[1];
      const maleCount = parseInt(maleCountTag?.split(':')[1] || '0');
      const femaleCount = parseInt(femaleCountTag?.split(':')[1] || '0');

      // Get the stock
      const stock = await PetStock.findById(stockId);
      if (!stock) {
        throw new Error('Stock not found');
      }

      // Generate individual pets from stock
      const PetCodeGenerator = require('../../shared/utils/petCodeGenerator');

      // Generate male pets
      for (let i = 0; i < maleCount; i++) {
        const petCode = await PetCodeGenerator.generateUniquePetCode();
        
        const pet = new PetInventoryItem({
          name: stock.name,
          petCode,
          speciesId: stock.speciesId,
          breedId: stock.breedId,
          gender: 'Male',
          age: stock.age,
          ageUnit: stock.ageUnit,
          color: stock.color,
          size: stock.size,
          price: stock.price,
          discountPrice: stock.discountPrice,
          storeId: stock.storeId,
          storeName: stock.storeName,
          createdBy: req.user._id,
          imageIds: stock.maleImageIds,
          status: 'sold',
          soldAt: new Date(),
          buyerId: req.user._id
        });
        
        await pet.save();
        generatedPets.push(pet);
      }

      // Generate female pets
      for (let i = 0; i < femaleCount; i++) {
        const petCode = await PetCodeGenerator.generateUniquePetCode();
        
        const pet = new PetInventoryItem({
          name: stock.name,
          petCode,
          speciesId: stock.speciesId,
          breedId: stock.breedId,
          gender: 'Female',
          age: stock.age,
          ageUnit: stock.ageUnit,
          color: stock.color,
          size: stock.size,
          price: stock.price,
          discountPrice: stock.discountPrice,
          storeId: stock.storeId,
          storeName: stock.storeName,
          createdBy: req.user._id,
          imageIds: stock.femaleImageIds,
          status: 'sold',
          soldAt: new Date(),
          buyerId: req.user._id
        });
        
        await pet.save();
        generatedPets.push(pet);
      }

      // Update stock counts
      stock.maleCount -= maleCount;
      stock.femaleCount -= femaleCount;
      await stock.save();

      // Mark temp inventory item as inactive
      inventoryItem.status = 'sold';
      inventoryItem.isActive = false;
      await inventoryItem.save();
    } else {
      // Regular inventory item purchase
      if (inventoryItem) {
        inventoryItem.status = 'sold';
        inventoryItem.soldAt = new Date();
        inventoryItem.buyerId = req.user._id;
        await inventoryItem.save();
        generatedPets = [inventoryItem];
      }
    }

    await reservation.save();

    // Create ownership history for all generated/purchased pets
    for (const pet of generatedPets) {
      await OwnershipHistory.create({
        pet: pet._id,
        previousOwner: null, // No previous owner for pet shop purchase
        newOwner: req.user._id,
        transferDate: new Date(),
        transferType: 'Sale',
        reason: 'Pet shop purchase',
        transferFee: {
          amount: pet.price || 0,
          currency: 'INR',
          paid: true,
          paymentMethod: 'Card'
        },
        notes: `Purchased through Pet Shop - ${deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'}`,
        createdBy: req.user._id,
        status: 'Completed'
      });
      // Blockchain logging: ownership_transferred event
      try {
        await petshopBlockchainService.addBlock('ownership_transferred', {
          petId: pet._id,
          petCode: pet.petCode,
          newOwner: req.user._id,
          transferType: 'Sale',
          transferDate: new Date(),
          transferReason: 'Pet shop purchase',
          transferFee: pet.price || 0,
          performedBy: req.user._id,
          timestamp: new Date(),
        });
      } catch (err) {
        console.warn('Blockchain logging failed for ownership_transferred:', err.message);
      }
    }

    // Update centralized pet registry with initial ownership for all pets
    try {
      const PetRegistryService = require('../../../../core/services/petRegistryService');
      
      for (const pet of generatedPets) {
        // Create/update registry entry with source tracking
        await PetRegistryService.upsertAndSetState({
          petCode: pet.petCode,
          name: pet.name,
          species: pet.speciesId,
          breed: pet.breedId,
          images: pet.imageIds || [], // Pass imageIds as the images parameter for PetRegistryService
          source: 'petshop',
          petShopItemId: pet._id,
          actorUserId: req.user._id,
          firstAddedSource: 'pet_shop',
          firstAddedBy: req.user._id // The store/manager who added it
        }, {
          currentOwnerId: req.user._id,
          currentLocation: 'at_owner', // Ensure pet is transferred to owner immediately
          currentStatus: 'with user', // Status when pet is with owner
          lastTransferAt: new Date()
        });
        
        // Record ownership transfer in registry
        await PetRegistryService.recordOwnershipTransfer({
          petCode: pet.petCode,
          previousOwnerId: null,
          newOwnerId: req.user._id,
          transferType: 'purchase',
          transferPrice: pet.price || 0,
          transferReason: 'Pet Shop Purchase',
          source: 'petshop',
          notes: `Payment completed - Pet transferred to owner`,
          performedBy: req.user._id
        });
        // Blockchain logging: registry_ownership_transfer event
        try {
          await petshopBlockchainService.addBlock('registry_ownership_transfer', {
            petCode: pet.petCode,
            previousOwnerId: null,
            newOwnerId: req.user._id,
            transferType: 'purchase',
            transferPrice: pet.price || 0,
            transferReason: 'Pet Shop Purchase',
            source: 'petshop',
            performedBy: req.user._id,
            timestamp: new Date(),
          });
        } catch (err) {
          console.warn('Blockchain logging failed for registry_ownership_transfer:', err.message);
        }
        console.log(`PetRegistry updated for pet ${pet.petCode}: transferred to user ${req.user._id}`);
      }
    } catch (regErr) {
      console.error('PetRegistry ownership tracking failed:', regErr); // Log the actual error
      // Even if registry update fails, we still want to complete the payment
      // But log the error for debugging
    }

    // Create user pets in PetNew collection after successful payment
    try {
      const PetNew = require('../../../../core/models/PetNew');
      
      for (const pet of generatedPets) {
        const newPet = new PetNew({
          name: pet.name || 'Unnamed Pet',
          speciesId: pet.speciesId,
          breedId: pet.breedId,
          ownerId: req.user._id,
          createdBy: req.user._id,
          currentStatus: 'with user',
          gender: pet.gender || 'Unknown',
          age: pet.age || 0,
          ageUnit: pet.ageUnit || 'months',
          color: pet.color || '',
          petCode: pet.petCode,
          imageIds: pet.imageIds || [],
          weight: {
            value: pet.weight || 0,
            unit: 'kg'
          },
          size: 'medium',
          source: 'petshop',
          acquisitionInfo: {
            method: 'purchase',
            date: new Date(),
            source: 'Pet Shop Purchase',
            cost: pet.price || 0
          }
        });
        
        await newPet.save();
        console.log(`Created PetNew entry for ${pet.petCode}`);
      }
    } catch (petNewErr) {
      console.error('Failed to create PetNew entries:', petNewErr);
    }

    // ALSO create user pet in main Pet collection after successful payment
    // This is needed for the user dashboard to display pet details correctly
    try {
      for (const pet of generatedPets) {
        const { pet: mainPet } = await UnifiedPetRegistrationService.createUserPetRecords({
          name: pet.name || 'Unnamed Pet',
          speciesId: pet.speciesId,
          breedId: pet.breedId,
          ownerId: req.user._id,
          gender: pet.gender || 'Unknown',
          age: pet.age || 0,
          ageUnit: pet.ageUnit || 'months',
          color: pet.color || '',
          weight: {
            value: pet.weight || 0,
            unit: 'kg'
          },
          size: 'medium',
          temperament: [],
          specialNeeds: [],
          imageIds: pet.imageIds || [],
          currentStatus: 'sold',
          healthStatus: 'Good',
          createdBy: req.user._id
        });

        // Register pet in unified registry
        await UnifiedPetRegistrationService.registerPet({
          petCode: pet.petCode,
          name: pet.name || 'Pet',
          species: pet.speciesId,
          breed: pet.breedId,
          images: pet.images || [],
          source: 'petshop',
          firstAddedSource: 'petshop',
          firstAddedBy: pet.createdBy,
          currentOwnerId: req.user._id,
          currentStatus: 'sold',
          currentLocation: 'at_owner',
          gender: pet.gender,
          age: pet.age,
          ageUnit: pet.ageUnit,
          color: pet.color,
          sourceReferences: {
            petShopItemId: pet._id,
            corePetId: mainPet._id
          },
          ownershipTransfer: {
            previousOwnerId: pet.createdBy,
            newOwnerId: req.user._id,
            transferType: 'purchase',
            transferPrice: pet.price || 0,
            transferReason: 'Pet Purchase',
            source: 'petshop',
            notes: 'Purchase completed successfully',
            performedBy: req.user._id
          },
          actorUserId: req.user._id
        });

        // Create ownership history entry
        try {
          await UnifiedPetRegistrationService.createOwnershipHistory({
            petId: mainPet._id,
            previousOwner: pet.createdBy,
            newOwner: req.user._id,
            transferType: 'Purchase',
            reason: 'Pet shop purchase',
            transferFee: {
              amount: pet.price || 0,
              currency: 'INR',
              paid: true,
              paymentMethod: 'Card'
            },
            createdBy: req.user._id,
          });
        } catch (ohErr) {
          console.warn('Ownership history (purchase) create failed:', ohErr?.message);
        }
      }
    } catch (petErr) {
      console.error('Failed to create user pet in main Pet collection:', petErr);
      // Don't fail the payment if pet creation fails, but log the error
    }

    // Log pet history events for all generated pets
    for (const pet of generatedPets) {
      // Payment completed event
      await PetHistory.logEvent({
        petId: pet._id,
        inventoryItemId: pet._id,
        eventType: 'payment_completed',
        eventDescription: `Payment of ₹${pet.price || 0} completed via Razorpay`,
        performedBy: req.user._id,
        performedByRole: 'user',
        relatedDocuments: [{
          documentType: 'payment',
          documentId: reservation._id
        }],
        metadata: {
          paymentAmount: pet.price || 0,
          paymentMethod: 'razorpay',
          deliveryMethod: 'pickup', // Always pickup
          notes: `Transaction ID: ${razorpay_payment_id}`,
          systemGenerated: false
        },
        storeId: pet.storeId,
        storeName: pet.storeName
      });

      // Ownership transferred event
      await PetHistory.logEvent({
        petId: pet._id,
        inventoryItemId: pet._id,
        eventType: 'ownership_transferred',
        eventDescription: `Pet ownership transferred to ${reservation.userId.name}`,
        performedBy: req.user._id,
        performedByRole: 'user',
        relatedDocuments: [{
          documentType: 'ownership_transfer',
          documentId: reservation._id
        }],
        previousValue: { owner: null },
        newValue: { owner: req.user._id },
        metadata: {
          paymentAmount: pet.price || 0,
          deliveryMethod: 'pickup', // Always pickup
          notes: `Purchased from Pet Shop`,
          systemGenerated: true
        },
        storeId: pet.storeId,
        storeName: pet.storeName
      });
    }
    
    res.json({
      success: true,
      message: isStockPurchase 
        ? `Payment verified successfully. ${generatedPets.length} pets generated and transferred to your account.` 
        : 'Payment verified successfully. Pet transferred to your account.',
      data: {
        transactionId: reservation._id,
        paymentId: razorpay_payment_id,
        amount: reservation.paymentInfo.amount,
        status: 'completed',
        deliveryMethod: 'pickup', // Always pickup
        deliveryAddress: null,
        generatedPets: isStockPurchase ? generatedPets.map(p => ({
          _id: p._id,
          name: p.name,
          petCode: p.petCode,
          gender: p.gender,
          price: p.price
        })) : undefined
      }
    });
    
  } catch (err) {
    console.error('Verify Razorpay signature error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      reservationId,
      orderId: razorpay_order_id
    });
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

// Create Razorpay order for stock-based purchase
const createRazorpayOrderForStock = async (req, res) => {
  try {
    const { stockId, maleCount, femaleCount, deliveryMethod, deliveryAddress } = req.body;
    
    console.log('Creating payment order for stock purchase:', {
      stockId,
      maleCount,
      femaleCount,
      userId: req.user._id,
      deliveryMethod,
      hasRazorpayKeys: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
    
    // Validate request
    if ((!maleCount && !femaleCount) || maleCount < 0 || femaleCount < 0) {
      return res.status(400).json({ success: false, message: 'Invalid pet count' });
    }
    
    // Find the stock
    const stock = await PetStock.findById(stockId);
    
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }
    
    // Check availability
    if (maleCount > stock.maleCount || femaleCount > stock.femaleCount) {
      return res.status(400).json({ success: false, message: 'Not enough pets available in stock' });
    }
    
    // Calculate total amount
    const petCount = maleCount + femaleCount;
    const petPrice = Number(stock.price || 0);
    if (!petPrice || Number.isNaN(petPrice) || petPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Item price not set for this stock' });
    }
    
    const deliveryCharges = deliveryMethod === 'delivery' ? 500 : 0;
    const taxes = Math.round(petCount * petPrice * 0.18);
    const totalAmount = (petCount * petPrice) + deliveryCharges + taxes;
    
    // Use the shared payment service
    const orderResult = await paymentService.createOrder(totalAmount, 'INR', {
      stockId: stockId,
      maleCount: maleCount,
      femaleCount: femaleCount,
      userId: req.user._id,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
      purchaseType: 'stock'
    });

    if (!orderResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: orderResult.error || 'Failed to create payment order'
      });
    }

    // For stock purchases, we'll create a temporary reservation record
    const tempReservation = {
      stockId: stockId,
      maleCount: maleCount,
      femaleCount: femaleCount,
      userId: req.user._id,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
      paymentInfo: {
        orderId: orderResult.order.id,
        amount: totalAmount,
        currency: 'INR',
        paymentStatus: 'pending'
      },
      status: 'payment_pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: {
        orderId: orderResult.order.id,
        amount: totalAmount * 100,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        tempReservation: tempReservation
      }
    });
  
  } catch (err) {
    console.error('Create Razorpay order for stock error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      error: err.error
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

// Verify Razorpay signature for stock-based purchase
const verifyRazorpaySignatureForStock = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      stockId,
      maleCount,
      femaleCount,
      deliveryMethod,
      deliveryAddress
    } = req.body;
    
    console.log('Verifying stock payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      stockId,
      maleCount,
      femaleCount
    });
    
    // Use the shared payment service to verify payment
    const isVerified = paymentService.verifyPayment(razorpay_signature, razorpay_order_id, razorpay_payment_id);
    
    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
    
    // Get payment details from Razorpay
    const paymentDetails = await paymentService.getPaymentDetails(razorpay_payment_id);
    if (!paymentDetails.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to fetch payment details' 
      });
    }
    
    // Find the stock
    const stock = await PetStock.findById(stockId);
    
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }
    
    // Check availability
    if (maleCount > stock.maleCount || femaleCount > stock.femaleCount) {
      return res.status(400).json({ success: false, message: 'Not enough pets available in stock' });
    }
    
    // Generate individual pets from stock
    const generatedPets = [];
    
    // Generate male pets
    for (let i = 0; i < maleCount; i++) {
      const petCode = await PetCodeGenerator.generateUniquePetCode();
      
      const pet = new PetInventoryItem({
        name: stock.name,
        petCode,
        speciesId: stock.speciesId,
        breedId: stock.breedId,
        gender: 'Male',
        age: stock.age,
        ageUnit: stock.ageUnit,
        color: stock.color,
        size: stock.size,
        price: stock.price,
        discountPrice: stock.discountPrice,
        storeId: stock.storeId,
        storeName: stock.storeName,
        createdBy: req.user.id,
        imageIds: stock.maleImageIds,
        status: 'sold',
        soldAt: new Date(),
        buyerId: req.user._id
      });
      
      await pet.save();
      generatedPets.push(pet);
      
      // Register pet in PetRegistry
      try {
        await PetRegistryService.upsertAndSetState({
          petCode: pet.petCode,
          name: pet.name,
          species: pet.speciesId,
          breed: pet.breedId,
          images: pet.imageIds || [],
          source: 'petshop',
          petShopItemId: pet._id,
          actorUserId: req.user.id,
          firstAddedSource: 'petshop',
          firstAddedBy: req.user.id,
          gender: pet.gender,
          age: pet.age,
          ageUnit: pet.ageUnit,
          color: pet.color
        }, {
          currentOwnerId: req.user._id,
          currentLocation: 'at_owner',
          currentStatus: 'sold'
        });
      } catch (regErr) {
        console.warn('Failed to register pet in PetRegistry:', regErr.message);
      }
    }
    
    // Generate female pets
    for (let i = 0; i < femaleCount; i++) {
      const petCode = await PetCodeGenerator.generateUniquePetCode();
      
      const pet = new PetInventoryItem({
        name: stock.name,
        petCode,
        speciesId: stock.speciesId,
        breedId: stock.breedId,
        gender: 'Female',
        age: stock.age,
        ageUnit: stock.ageUnit,
        color: stock.color,
        size: stock.size,
        price: stock.price,
        discountPrice: stock.discountPrice,
        storeId: stock.storeId,
        storeName: stock.storeName,
        createdBy: req.user.id,
        imageIds: stock.femaleImageIds,
        status: 'sold',
        soldAt: new Date(),
        buyerId: req.user._id
      });
      
      await pet.save();
      generatedPets.push(pet);
      
      // Register pet in PetRegistry
      try {
        await PetRegistryService.upsertAndSetState({
          petCode: pet.petCode,
          name: pet.name,
          species: pet.speciesId,
          breed: pet.breedId,
          images: pet.imageIds || [],
          source: 'petshop',
          petShopItemId: pet._id,
          actorUserId: req.user.id,
          firstAddedSource: 'petshop',
          firstAddedBy: req.user.id,
          gender: pet.gender,
          age: pet.age,
          ageUnit: pet.ageUnit,
          color: pet.color
        }, {
          currentOwnerId: req.user._id,
          currentLocation: 'at_owner',
          currentStatus: 'sold'
        });
      } catch (regErr) {
        console.warn('Failed to register pet in PetRegistry:', regErr.message);
      }
    }
    
    // Update stock counts
    stock.maleCount -= maleCount;
    stock.femaleCount -= femaleCount;
    await stock.save();
    
    // Create ownership history for each pet
    for (const pet of generatedPets) {
      await OwnershipHistory.create({
        pet: pet._id,
        previousOwner: null, // No previous owner for pet shop purchase
        newOwner: req.user._id,
        transferDate: new Date(),
        transferType: 'Sale',
        reason: 'Pet shop purchase',
        transferFee: {
          amount: stock.price || 0,
          currency: 'INR',
          paid: true,
          paymentMethod: 'Card'
        },
        notes: `Purchased through Pet Shop - ${deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'}`
      });
    }
    
    res.json({
      success: true,
      data: {
        generatedPets,
        message: `${generatedPets.length} pets generated and purchased successfully`
      }
    });
  } catch (err) {
    console.error('Verify Razorpay signature for stock error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

// User confirms they want to buy after manager approval
const confirmPurchaseDecision = async (req, res) => {
  try {
    const { id: reservationId } = req.params;
    const { wantsToBuy, notes } = req.body;
    
    console.log('Confirm purchase decision called with reservationId:', reservationId);
    console.log('User ID:', req.user._id);
    
    // Find the reservation with user filter directly
    console.log('Looking for reservation with ID and user ID filter');
    const reservation = await PetReservation.findOne({
      _id: reservationId,
      userId: req.user._id
    }).populate('itemId');
    console.log('Found reservation:', reservation);
    
    if (!reservation) {
      // Check if reservation exists but doesn't belong to user
      const reservationExists = await PetReservation.findById(reservationId);
      if (reservationExists) {
        console.log('Reservation exists but belongs to different user');
        return res.status(403).json({ 
          success: false, 
          message: 'Reservation does not belong to current user' 
        });
      }
      
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }
    
    // Check if reservation is in a valid status for purchase decision
    const validStatuses = ['approved'];
    if (!validStatuses.includes(reservation.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Reservation status is ${reservation.status}, but must be 'approved' to confirm purchase decision` 
      });
    }
    
    // Update user decision
    reservation.userDecision = {
      wantsToBuy: wantsToBuy,
      decisionDate: new Date(),
      decisionNotes: notes || '',
      remindersSent: 0
    };
    
    // Update status based on decision
    if (wantsToBuy) {
      reservation.status = 'going_to_buy';
      reservation._statusChangeNote = 'User confirmed purchase intention';
    } else {
      reservation.status = 'cancelled';
      reservation._statusChangeNote = 'User declined to purchase';
      
      // Make pet available again
      if (reservation.itemId) {
        reservation.itemId.status = 'available_for_sale';
        await reservation.itemId.save();
      }
    }
    
    reservation._updatedBy = req.user._id;
    await reservation.save();
    
    // Log pet history
    await PetHistory.logEvent({
      petId: reservation.itemId._id,
      inventoryItemId: reservation.itemId._id,
      eventType: wantsToBuy ? 'reservation_confirmed' : 'reservation_declined',
      eventDescription: wantsToBuy ? 
        'User confirmed intention to purchase pet' : 
        'User declined to purchase pet',
      performedBy: req.user._id,
      performedByRole: 'user',
      relatedDocuments: [{
        documentType: 'reservation',
        documentId: reservation._id
      }],
      metadata: {
        userDecision: wantsToBuy,
        notes: notes || '',
        systemGenerated: false
      },
      storeId: reservation.itemId.storeId,
      storeName: reservation.itemId.storeName
    });
    
    res.json({
      success: true,
      message: wantsToBuy ? 
        'Purchase confirmed! You can now proceed to payment.' : 
        'Reservation cancelled successfully.',
      data: { 
        reservation,
        nextStep: wantsToBuy ? 'payment' : 'completed'
      }
    });
    
  } catch (err) {
    console.error('Confirm purchase decision error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update delivery status (for managers)
const updateDeliveryStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status, deliveryNotes, actualDate } = req.body;
    
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId')
      .populate('userId', 'name email');
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Update delivery info
    if (!reservation.deliveryInfo) {
      reservation.deliveryInfo = {};
    }
    
    if (actualDate) {
      reservation.deliveryInfo.actualDate = new Date(actualDate);
    }
    
    if (deliveryNotes) {
      reservation.deliveryInfo.deliveryNotes = deliveryNotes;
    }
    
    // Update reservation status
    const previousStatus = reservation.status;
    reservation.status = status;
    reservation._statusChangeNote = `Delivery status updated: ${status}`;
    reservation._updatedBy = req.user._id;
    
    // If status is cancelled, also update the pet's status back to available_for_sale
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      const PetInventoryItem = require('../../manager/models/PetInventoryItem');
      await PetInventoryItem.findByIdAndUpdate(reservation.itemId, { status: 'available_for_sale' });
    }
    
    await reservation.save();
    
    // If status is completed (or legacy at_owner), transfer ownership and create pet record
    if ((status === 'completed' || status === 'at_owner') && previousStatus !== status) {
      await handlePetOwnershipTransfer(reservation, req.user._id);
    }
    
    // Log pet history for delivery status change
    try {
      await PetHistory.logEvent({
        petId: reservation.itemId?._id || reservation.itemId,
        inventoryItemId: reservation.itemId?._id || reservation.itemId,
        eventType: 'status_changed',
        eventDescription: `Delivery status updated to ${status}`,
        performedBy: req.user._id,
        performedByRole: 'manager',
        relatedDocuments: [{
          documentType: 'reservation',
          documentId: reservation._id
        }],
        metadata: {
          deliveryMethod: reservation.deliveryInfo?.method || 'pickup',
          deliveryNotes: deliveryNotes || '',
          actualDeliveryDate: actualDate || new Date(),
          systemGenerated: false
        },
        storeId: reservation.itemId?.storeId,
        storeName: reservation.itemId?.storeName
      });
    } catch (logErr) {
      console.warn('PetHistory log failed (updateDeliveryStatus):', logErr?.message || logErr);
    }
    
    // Central registry sync (identity + state)
    try {
      const item = reservation.itemId
      if (item?.petCode) {
        // Identity upsert from inventory
        await PetRegistryService.upsertIdentity({
          petCode: item.petCode,
          name: item.name || 'Pet',
          species: item.speciesId,
          breed: item.breedId,
          images: Array.isArray(item.images) ? item.images.map(img => ({ url: img.url, caption: img.caption, isPrimary: !!img.isPrimary })) : [],
          source: 'petshop',
          petShopItemId: item._id,
          actorUserId: req.user._id,
          metadata: { storeId: item.storeId, storeName: item.storeName }
        })

        // State mapping based on reservation status
        let currentLocation = 'at_petshop'
        let currentStatus = item.status || 'in_petshop'
        let currentOwnerId = undefined
        if (status === 'ready_pickup') {
          currentLocation = 'in_transit'
          currentStatus = 'reserved'
        }
        if (status === 'completed' || status === 'at_owner') {
          currentLocation = 'at_owner'
          currentStatus = 'sold'
          currentOwnerId = reservation.userId?._id || reservation.userId
        }
        // If reservation is cancelled, pet should be available for sale
        if (status === 'cancelled') {
          currentStatus = 'available_for_sale'
        }
        await PetRegistryService.updateState({
          petCode: item.petCode,
          currentOwnerId,
          currentLocation, // This will be 'at_owner' for completed/at_owner status
          currentStatus,
          actorUserId: req.user._id,
          lastTransferAt: (status === 'completed' || status === 'at_owner') ? new Date() : undefined
        })
        
        if (status === 'completed' || status === 'at_owner') {
          console.log(`PetRegistry updated for pet ${item.petCode}: transferred to user ${currentOwnerId}`);
        }

      }
    } catch (regErr) {
      console.warn('PetRegistry sync failed (updateDeliveryStatus):', regErr?.message || regErr)
    }
    
    res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Update delivery status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Handle pet ownership transfer when order is completed
const handlePetOwnershipTransfer = async (reservation, managerId) => {
  try {
    // Note: Pet is already created in the payment verification step
    // Just log the transfer event
    
    // Log comprehensive pet history
    await PetHistory.logEvent({
      petId: reservation.itemId._id,
      inventoryItemId: reservation.itemId._id,
      eventType: 'ownership_transferred',
      eventDescription: `Pet ownership transferred to ${reservation.userId.name} after successful pickup`,
      performedBy: managerId,
      performedByRole: 'manager',
      relatedDocuments: [{
        documentType: 'reservation',
        documentId: reservation._id
      }],
      metadata: {
        purchaseAmount: reservation.paymentInfo.amount,
        deliveryMethod: 'pickup',
        customerName: reservation.userId.name,
        customerEmail: reservation.userId.email,
        completionDate: new Date(),
        systemGenerated: false
      },
      storeId: reservation.itemId.storeId,
      storeName: reservation.itemId.storeName
    });
    
    console.log(`Pet ownership transferred: ${reservation.itemId.petCode} -> ${reservation.userId.name}`);
    
  } catch (error) {
    console.error('Error in pet ownership transfer:', error);
  }
};

// Schedule pickup (manager side)
const schedulePickup = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { pickupDate, pickupTime, notes } = req.body;
    
    // Find the reservation
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId')
      .populate('userId');
      
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    // Verify reservation is in correct status
    if (reservation.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Reservation must be paid to schedule pickup'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update reservation with pickup details
    reservation.pickupInfo = {
      scheduledDate: new Date(`${pickupDate}T${pickupTime}`),
      otp: otp,
      status: 'scheduled',
      notes: notes || ''
    };
    
    // Update reservation status
    reservation.status = 'pickup_scheduled';
    reservation._statusChangeNote = 'Pickup scheduled by manager';
    reservation._updatedBy = req.user._id;
    
    await reservation.save();
    
    // Update pet inventory status
    const PetInventoryItem = require('../../manager/models/PetInventoryItem');
    await PetInventoryItem.findByIdAndUpdate(reservation.itemId._id, { 
      status: 'reserved',
      buyerId: reservation.userId._id
    });
    
    // Log pet history
    await PetHistory.logEvent({
      petId: reservation.itemId._id,
      inventoryItemId: reservation.itemId._id,
      eventType: 'pickup_scheduled',
      eventDescription: `Pickup scheduled for ${pickupDate} at ${pickupTime}`,
      performedBy: req.user._id,
      performedByRole: 'manager',
      relatedDocuments: [{
        documentType: 'reservation',
        documentId: reservation._id
      }],
      metadata: {
        scheduledDate: pickupDate,
        scheduledTime: pickupTime,
        otp: otp,
        notes: notes || '',
        systemGenerated: false
      },
      storeId: reservation.itemId.storeId,
      storeName: reservation.itemId.storeName
    });
    
    // Send notification to user (in real app, this would be email/SMS)
    console.log(`Pickup scheduled for user ${reservation.userId.name}. OTP: ${otp}`);
    
    res.json({
      success: true,
      message: 'Pickup scheduled successfully',
      data: {
        reservationId: reservation._id,
        scheduledDate: pickupDate,
        scheduledTime: pickupTime,
        status: 'scheduled'
      }
    });
    
  } catch (err) {
    console.error('Schedule pickup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule pickup'
    });
  }
};

// Verify pickup OTP (user side)
const verifyPickupOTP = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { otp } = req.body;
    
    // Find the reservation
    const reservation = await PetReservation.findById(reservationId)
      .populate('itemId')
      .populate('userId');
      
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    // Verify reservation is in correct status
    if (reservation.status !== 'pickup_scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Pickup not scheduled for this reservation'
      });
    }
    
    // Verify OTP
    if (reservation.pickupInfo.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Check if pickup time has passed
    const now = new Date();
    if (now < reservation.pickupInfo.scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Pickup time has not arrived yet'
      });
    }
    
    // Update reservation status
    reservation.pickupInfo.status = 'completed';
    reservation.pickupInfo.completedAt = new Date();
    reservation.status = 'completed';
    reservation._statusChangeNote = 'Pickup completed with OTP verification';
    reservation._updatedBy = req.user._id;
    
    await reservation.save();
    
    // Update pet inventory status to sold
    const PetInventoryItem = require('../../manager/models/PetInventoryItem');
    await PetInventoryItem.findByIdAndUpdate(reservation.itemId._id, { 
      status: 'sold',
      soldAt: new Date(),
      buyerId: reservation.userId._id
    });
    
    // Update centralized pet registry
    try {
      const PetRegistryService = require('../../../../core/services/petRegistryService');
      await PetRegistryService.recordOwnershipTransfer({
        petCode: reservation.itemId.petCode,
        newOwnerId: reservation.userId._id,
        transferType: 'purchase',
        transferReason: 'Pet Shop Purchase',
        source: 'petshop',
        notes: `Purchased from ${reservation.itemId.storeName || 'Pet Shop'}`,
        performedBy: req.user._id
      });
      
      // Also update the current state to reflect that the pet is now with the owner
      await PetRegistryService.updateState({
        petCode: reservation.itemId.petCode,
        currentOwnerId: reservation.userId._id,
        currentLocation: 'at_owner', // Ensure pet is transferred to owner
        currentStatus: 'sold',
        actorUserId: req.user._id,
        lastTransferAt: new Date()
      });
      
      console.log(`PetRegistry updated for pet ${reservation.itemId.petCode}: transferred to user ${reservation.userId._id}`);
    } catch (regErr) {
      console.error('PetRegistry update failed:', regErr?.message || regErr);
      // Even if registry update fails, we still want to complete the pickup
      // But log the error for debugging
    }
    
    // Create user pet in PetNew collection after successful pickup
    try {
      const PetNew = require('../../../../core/models/PetNew');
      const inventoryItem = reservation.itemId;
      const newPet = new PetNew({
        name: inventoryItem.name || 'Unnamed Pet',
        speciesId: inventoryItem.speciesId,
        breedId: inventoryItem.breedId,
        ownerId: reservation.userId._id,
        createdBy: reservation.userId._id,
        currentStatus: 'sold',
        gender: inventoryItem.gender || 'Unknown',
        age: inventoryItem.age || 0,
        ageUnit: inventoryItem.ageUnit || 'months',
        color: inventoryItem.color || '',
        petCode: inventoryItem.petCode,
        imageIds: inventoryItem.imageIds || [],
        weight: {
          value: inventoryItem.weight || 0,
          unit: 'kg'
        },
        size: 'medium',
        temperament: [],
        behaviorNotes: '',
        specialNeeds: [],
        adoptionRequirements: [],
        adoptionFee: 0,
        isAdoptionReady: false,
        tags: ['petshop', 'purchased'],
        // Add ownership history entry
        ownershipHistory: [{
          ownerId: reservation.userId._id,
          ownerName: reservation.userId.name || 'Pet Owner',
          startDate: new Date(),
          reason: 'Pet Shop Purchase',
          notes: `Purchased from ${inventoryItem.storeName || 'Pet Shop'}`
        }]
      });
      
      await newPet.save();
      
      // Populate the pet with related data
      await newPet.populate([
        { path: 'speciesId', select: 'name displayName' },
        { path: 'breedId', select: 'name' },
        { path: 'ownerId', select: 'name email' },
        { path: 'images' } // Populate images virtual property
      ]);
      
      console.log('User pet created successfully:', newPet._id);
    } catch (petErr) {
      console.error('Failed to create user pet:', petErr);
      // Don't fail the pickup if pet creation fails, but log the error
    }
    
    // Log pet history
    await PetHistory.logEvent({
      petId: reservation.itemId._id,
      inventoryItemId: reservation.itemId._id,
      eventType: 'pickup_completed',
      eventDescription: `Pickup completed by ${reservation.userId.name} with OTP verification`,
      performedBy: req.user._id,
      performedByRole: 'user',
      relatedDocuments: [{
        documentType: 'reservation',
        documentId: reservation._id
      }],
      metadata: {
        otp: otp,
        completedAt: new Date(),
        systemGenerated: false
      },
      storeId: reservation.itemId.storeId,
      storeName: reservation.itemId.storeName
    });
    
    // Handle pet ownership transfer
    await handlePetOwnershipTransfer(reservation, req.user._id);
    
    res.json({
      success: true,
      message: 'Pickup verified successfully. Pet has been transferred to your dashboard.',
      data: {
        reservationId: reservation._id,
        status: 'completed'
      }
    });
    
  } catch (err) {
    console.error('Verify pickup OTP error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify pickup'
    });
  }
};

// Get pickup details for user
const getPickupDetails = async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    // Find the reservation with user filter for security
    const reservation = await PetReservation.findOne({
      _id: reservationId,
      userId: req.user._id
    })
    .populate('itemId')
    .populate('userId');
      
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    // Return pickup details (without OTP for security)
    const pickupDetails = reservation.pickupInfo ? {
      scheduledDate: reservation.pickupInfo.scheduledDate,
      status: reservation.pickupInfo.status,
      notes: reservation.pickupInfo.notes,
      completedAt: reservation.pickupInfo.completedAt
    } : null;
    
    res.json({
      success: true,
      data: {
        reservationId: reservation._id,
        status: reservation.status,
        pickupDetails: pickupDetails
      }
    });
    
  } catch (err) {
    console.error('Get pickup details error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get pickup details'
    });
  }
};

// ===== HANDOVER FUNCTIONS =====

// Schedule handover with OTP generation
const scheduleHandover = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { scheduledDate, scheduledTime, notes } = req.body;
    
    // Find reservation and verify ownership
    const reservation = await PetReservation.findOne({ 
      _id: reservationId, 
      userId: req.user._id,
      status: 'paid'
    }).populate('itemId').populate('userId', 'name email');
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found or not ready for handover' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update reservation with handover details
    reservation.handover = {
      ...reservation.handover,
      status: 'scheduled',
      method: 'pickup',
      scheduledAt: scheduledDate ? new Date(scheduledDate) : new Date(),
      notes: notes || '',
      location: {
        ...(reservation.handover?.location || {}),
        phone: reservation.contactInfo?.phone || ''
      }
    };
    
    // Add OTP to history
    if (!reservation.handover.otpHistory) {
      reservation.handover.otpHistory = [];
    }
    reservation.handover.otpHistory.push({
      otp: otp,
      generatedAt: new Date()
    });
    
    reservation.status = 'ready_pickup';
    
    await reservation.save();
    
    // Send email notification with OTP
    try {
      await sendMail({
        to: reservation.userId.email,
        subject: 'Pet Handover Scheduled - OTP Included',
        html: `
          <h2>Pet Handover Scheduled</h2>
          <p>Hello ${reservation.userId.name},</p>
          <p>Your pet handover has been scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}.</p>
          <p><strong>Your OTP for pickup: ${otp}</strong></p>
          <p>Please bring this OTP and a valid ID to the store for verification.</p>
          <p>Reservation Code: ${reservation.reservationCode}</p>
          <p>Pet: ${reservation.itemId.name}</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send handover email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Handover scheduled successfully',
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Schedule handover error:', err);
    res.status(500).json({ success: false, message: 'Failed to schedule handover' });
  }
};

// Complete handover with OTP verification
const completeHandover = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { otp } = req.body;
    
    // Find reservation and verify ownership
    const reservation = await PetReservation.findOne({ 
      _id: reservationId, 
      userId: req.user._id,
      status: 'ready_pickup'
    }).populate('itemId').populate('userId', 'name email');
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found or not ready for handover' });
    }
    
    // Verify OTP from the handover field
    const latestOtpRecord = reservation.handover.otpHistory
      .filter(record => !record.used)
      .sort((a, b) => b.generatedAt - a.generatedAt)[0];
    
    if (!latestOtpRecord || latestOtpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Mark OTP as used
    const otpRecord = reservation.handover.otpHistory.find(record => record.otp === otp);
    if (otpRecord) {
      otpRecord.used = true;
      otpRecord.usedAt = new Date();
    }
    
    // Update reservation status
    reservation.handover.status = 'completed';
    reservation.handoverCompletedAt = new Date();
    reservation.status = 'completed';
    
    await reservation.save();
    
    // Update inventory item status
    const inventoryItem = await PetInventoryItem.findById(reservation.itemId._id);
    if (inventoryItem) {
      inventoryItem.status = 'sold';
      inventoryItem.soldAt = new Date();
      inventoryItem.buyerId = req.user._id;
      await inventoryItem.save();
    }
    
    // Create ownership history
    await OwnershipHistory.create({
      pet: reservation.itemId._id,
      previousOwner: null, // No previous owner for pet shop purchase
      newOwner: req.user._id,
      transferDate: new Date(),
      transferType: 'Sale',
      reason: 'Pet shop purchase',
      transferFee: {
        amount: reservation.paymentInfo?.amount || 0,
        currency: 'INR'
      }
    });
    
    // Create user pet in PetNew collection after successful handover
    try {
      const PetNew = require('../../../../core/models/PetNew');
      const newPet = new PetNew({
        name: inventoryItem.name || 'Unnamed Pet',
        speciesId: inventoryItem.speciesId,
        breedId: inventoryItem.breedId,
        ownerId: req.user._id,
        createdBy: req.user._id,
        currentStatus: 'sold',
        gender: inventoryItem.gender || 'Unknown',
        age: inventoryItem.age || 0,
        ageUnit: inventoryItem.ageUnit || 'months',
        color: inventoryItem.color || '',
        petCode: inventoryItem.petCode,
        imageIds: inventoryItem.imageIds || [],
        weight: {
          value: inventoryItem.weight || 0,
          unit: 'kg'
        },
        size: 'medium',
        temperament: [],
        behaviorNotes: '',
        specialNeeds: [],
        adoptionRequirements: [],
        adoptionFee: 0,
        isAdoptionReady: false,
        tags: ['petshop', 'purchased'],
        // Add ownership history entry
        ownershipHistory: [{
          ownerId: req.user._id,
          ownerName: req.user.name || 'Pet Owner',
          startDate: new Date(),
          reason: 'Pet Shop Purchase',
          notes: `Purchased from ${reservation.itemId.storeName || 'Pet Shop'}`
        }]
      });
      
      await newPet.save();
      
      // Populate the pet with related data
      await newPet.populate([
        { path: 'speciesId', select: 'name displayName' },
        { path: 'breedId', select: 'name' },
        { path: 'ownerId', select: 'name email' },
        { path: 'images' } // Populate images virtual property
      ]);
      
      console.log('User pet created successfully in PetNew:', newPet._id);
    } catch (petErr) {
      console.error('Failed to create user pet in PetNew:', petErr);
      // Don't fail the handover if pet creation fails, but log the error
    }

    // ALSO create user pet in main Pet collection after successful handover
    // This is needed for the user dashboard to display pet details correctly
    try {
      const Pet = require('../../../../core/models/Pet');
      const mainPet = new Pet({
        name: inventoryItem.name || 'Unnamed Pet',
        species: inventoryItem.speciesId,
        breed: inventoryItem.breedId,
        owner: req.user._id,
        createdBy: req.user._id,
        currentStatus: 'sold',
        gender: inventoryItem.gender || 'Unknown',
        age: inventoryItem.age || 0,
        ageUnit: inventoryItem.ageUnit || 'months',
        color: inventoryItem.color || '',
        petCode: inventoryItem.petCode,
        imageIds: inventoryItem.imageIds || [],
        description: `Purchased from ${inventoryItem.storeName || 'Pet Shop'}`,
        storeId: inventoryItem.storeId,
        storeName: inventoryItem.storeName,
        // Set default values for required fields
        healthStatus: 'Good',
        adoptionFee: 0,
        isAdoptionReady: false,
        tags: ['petshop', 'purchased'],
        location: {
          address: '',
          city: '',
          state: '',
          country: ''
        },
        weight: {
          value: inventoryItem.weight || 0,
          unit: 'kg'
        },
        size: 'medium',
        temperament: [],
        behaviorNotes: '',
        specialNeeds: [],
        adoptionRequirements: []
      });
      
      await mainPet.save();
      
      // Populate the pet with related data
      await mainPet.populate([
        { path: 'species', select: 'name displayName' },
        { path: 'breed', select: 'name' },
        { path: 'owner', select: 'name email' },
        { path: 'images' } // Populate images virtual property
      ]);
      
      console.log('User pet created successfully in main Pet collection:', mainPet._id);
      
      // Centralized registry sync: identity + state
      try {
        const PetRegistryService = require('../../../../core/services/petRegistryService');
        
        // Create/update registry with source tracking
        await PetRegistryService.upsertAndSetState({
          petCode: inventoryItem.petCode,
          name: inventoryItem.name || 'Pet',
          species: inventoryItem.speciesId,
          breed: inventoryItem.breedId,
          images: (inventoryItem.images || []).map(img => ({ url: img.url, caption: img.caption || '', isPrimary: !!img.isPrimary })),
          source: 'petshop',
          petShopItemId: inventoryItem._id,
          corePetId: mainPet._id,
          actorUserId: req.user._id,
          firstAddedSource: 'petshop',
          firstAddedBy: inventoryItem.createdBy, // The pet shop manager who added it
          gender: inventoryItem.gender,
          age: inventoryItem.age,
          ageUnit: inventoryItem.ageUnit,
          color: inventoryItem.color
        }, {
          currentOwnerId: req.user._id,
          currentLocation: 'at_owner',
          currentStatus: 'sold',
          lastTransferAt: new Date()
        });
        
        // Record ownership transfer in registry
        await PetRegistryService.recordOwnershipTransfer({
          petCode: inventoryItem.petCode,
          previousOwnerId: inventoryItem.createdBy,
          newOwnerId: req.user._id,
          transferType: 'purchase',
          transferPrice: Number(reservation.paymentInfo?.amount || 0),
          transferReason: 'Pet Purchase',
          source: 'petshop',
          notes: 'Purchase completed successfully',
          performedBy: req.user._id
        });
      } catch (regErr) {
        console.warn('PetRegistry sync failed (handover complete):', regErr?.message || regErr);
      }
    } catch (petErr) {
      console.error('Failed to create user pet in main Pet collection:', petErr);
      // Don't fail the handover if pet creation fails, but log the error
    }
    
    // Send completion email
    try {
      await sendMail({
        to: reservation.userId.email,
        subject: 'Pet Handover Completed Successfully',
        html: `
          <h2>Pet Handover Completed</h2>
          <p>Hello ${reservation.userId.name},</p>
          <p>Congratulations! Your pet handover has been completed successfully.</p>
          <p>Reservation Code: ${reservation.reservationCode}</p>
          <p>Pet: ${reservation.itemId.name}</p>
          <p>Thank you for choosing our pet shop!</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send completion email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Handover completed successfully',
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Complete handover error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete handover' });
  }
};

// Regenerate handover OTP
const regenerateHandoverOTP = async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    // Find reservation and verify ownership
    const reservation = await PetReservation.findOne({ 
      _id: reservationId, 
      userId: req.user._id,
      status: 'ready_pickup'
    }).populate('userId', 'name email');
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found or not ready for handover' });
    }
    
    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Add new OTP to history
    reservation.handover.otpHistory.push({
      otp: otp,
      generatedAt: new Date()
    });
    
    await reservation.save();
    
    // Send email with new OTP
    try {
      await sendMail({
        to: reservation.userId.email,
        subject: 'New OTP for Pet Handover',
        html: `
          <h2>New OTP for Pet Handover</h2>
          <p>Hello ${reservation.userId.name},</p>
          <p>Your new OTP for pet pickup: <strong>${otp}</strong></p>
          <p>Please bring this OTP and a valid ID to the store for verification.</p>
          <p>Reservation Code: ${reservation.reservationCode}</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send OTP regeneration email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'New OTP generated successfully',
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Regenerate handover OTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to regenerate OTP' });
  }
};

module.exports = {
  createDirectBuyOrder,
  createRazorpayOrder,
  verifyRazorpaySignature,
  createRazorpayOrderForStock,
  verifyRazorpaySignatureForStock,
  confirmPurchaseDecision,
  updateDeliveryStatus,
  scheduleHandover,
  completeHandover,
  regenerateHandoverOTP,
  schedulePickup,
  verifyPickupOTP,
  getPickupDetails
};