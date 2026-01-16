import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Edit2, Package, MapPin, Phone, Mail, User, ShoppingBag } from 'lucide-react';

/**
 * Checkout Page - Flipkart Style
 * Step 1: User Details + Product Summary
 */
const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get product from location state (Buy Now) or cart
  const buyNowProduct = location.state?.product;
  const buyNowQuantity = location.state?.quantity || 1;
  
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });
  const [editingDetails, setEditingDetails] = useState(false);
  const [summary, setSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });

  useEffect(() => {
    // Set user details from AuthContext
    if (user) {
      const hasAddress = user.address && user.address.street && user.address.city;
      
      setUserDetails({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        }
      });
      
      // Auto-open edit mode if essential details are missing
      if (!user.name || !user.phone || !hasAddress) {
        setEditingDetails(true);
      }
    }
    
    if (buyNowProduct) {
      // Buy Now flow - single product
      setCartItems([{
        product: buyNowProduct,
        quantity: buyNowQuantity,
        price: buyNowProduct.pricing?.salePrice || buyNowProduct.pricing?.basePrice,
        total: (buyNowProduct.pricing?.salePrice || buyNowProduct.pricing?.basePrice) * buyNowQuantity
      }]);
      setLoading(false);
    } else {
      // Cart flow - multiple products
      fetchCart();
    }
  }, [user]);

  useEffect(() => {
    calculateSummary();
  }, [cartItems]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ecommerce/cart');
      const cart = response.data.data;
      setCartItems(cart.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;

    setSummary({ subtotal, shipping, tax, total });
  };

  const handleUpdateDetails = async () => {
    // Just update local state - no API call needed
    setEditingDetails(false);
    alert('Details updated successfully!');
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const item = cartItems[index];
    const maxStock = item.product.inventory?.stock || 0;
    
    if (newQuantity > maxStock) {
      alert(`Only ${maxStock} items available in stock`);
      return;
    }

    const updatedItems = [...cartItems];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = updatedItems[index].price * newQuantity;
    setCartItems(updatedItems);
  };

  const handleProceedToPayment = () => {
    // Validate user details
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      alert('Please fill in all required details');
      setEditingDetails(true);
      return;
    }

    if (!userDetails.address.street || !userDetails.address.city || !userDetails.address.pincode) {
      alert('Please fill in complete address');
      setEditingDetails(true);
      return;
    }

    // Navigate to payment page
    navigate('/user/ecommerce/payment', {
      state: {
        items: cartItems,
        userDetails,
        summary,
        isBuyNow: !!buyNowProduct
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center max-w-md">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No items to checkout</h3>
          <p className="text-gray-600 mb-6">Add some products to your cart first</p>
          <button
            onClick={() => navigate('/user/ecommerce/shop')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Details & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Details Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Delivery Details
                </h2>
                <button
                  onClick={() => setEditingDetails(!editingDetails)}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  {editingDetails ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editingDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={userDetails.name}
                      onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={userDetails.email}
                      onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={userDetails.phone}
                      onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={userDetails.address.street}
                    onChange={(e) => setUserDetails({
                      ...userDetails,
                      address: { ...userDetails.address, street: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City *"
                      value={userDetails.address.city}
                      onChange={(e) => setUserDetails({
                        ...userDetails,
                        address: { ...userDetails.address, city: e.target.value }
                      })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={userDetails.address.state}
                      onChange={(e) => setUserDetails({
                        ...userDetails,
                        address: { ...userDetails.address, state: e.target.value }
                      })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      value={userDetails.address.pincode}
                      onChange={(e) => setUserDetails({
                        ...userDetails,
                        address: { ...userDetails.address, pincode: e.target.value }
                      })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleUpdateDetails}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Save Details
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{userDetails.name || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{userDetails.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{userDetails.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-1" />
                    <span>
                      {userDetails.address.street || userDetails.address.city || userDetails.address.state || userDetails.address.pincode
                        ? `${userDetails.address.street || ''}, ${userDetails.address.city || ''}, ${userDetails.address.state || ''} - ${userDetails.address.pincode || ''}`
                        : 'Address not provided - Click Edit to add'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Products Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({cartItems.length})
              </h2>

              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <img
                      src={item.product.images?.[0]?.url || '/placeholder-product.png'}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{item.product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Stock Available: {item.product.inventory?.stock || 0}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            ₹{item.total.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₹{item.price.toFixed(2)} × {item.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{summary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={summary.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {summary.shipping === 0 ? 'FREE' : `₹${summary.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST 18%)</span>
                  <span>₹{summary.tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{summary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {summary.shipping > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                  Add ₹{(500 - summary.subtotal).toFixed(2)} more for FREE shipping!
                </div>
              )}

              <button
                onClick={handleProceedToPayment}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Proceed to Payment
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                Safe and Secure Payments. 100% Authentic products.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
