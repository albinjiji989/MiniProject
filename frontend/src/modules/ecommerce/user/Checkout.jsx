import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ecommerce/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ecommerce/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAddresses(response.data.data);
        const defaultAddr = response.data.data.find(a => a.isDefaultShipping);
        if (defaultAddr) setSelectedAddress(defaultAddr._id);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/ecommerce/addresses`, addressForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Address added successfully!');
      setShowAddressForm(false);
      setAddressForm({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
      });
      fetchAddresses();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    setProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/ecommerce/orders`,
        {
          shippingAddress: selectedAddress,
          paymentMethod,
          paymentDetails: paymentMethod === 'cod' ? { method: 'cod' } : {}
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const order = response.data.data;
        alert(`Order placed successfully! Order #${order.orderNumber}`);
        navigate('/ecommerce/orders');
      }
    } catch (error) {
      alert('Error placing order: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading checkout...</div>;
  }

  if (!cart || cart.items.length === 0) {
    navigate('/ecommerce/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  {showAddressForm ? 'Cancel' : '+ Add New Address'}
                </button>
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      required
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City *"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      required
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      required
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {/* Address List */}
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address._id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedAddress === address._id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address._id}
                      checked={selectedAddress === address._id}
                      onChange={() => setSelectedAddress(address._id)}
                      className="mr-3"
                    />
                    <div className="inline-block">
                      <div className="font-semibold text-gray-900">
                        {address.fullName}
                        {address.isDefaultShipping && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {address.street}, {address.city}, {address.state} - {address.pincode}
                      </div>
                      <div className="text-sm text-gray-500">Phone: {address.phone}</div>
                    </div>
                  </label>
                ))}
              </div>

              {addresses.length === 0 && !showAddressForm && (
                <p className="text-gray-500 text-center py-4">No addresses saved. Add one to continue.</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                  paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mr-3"
                  />
                  <span className="font-medium">Cash on Delivery</span>
                  <p className="text-sm text-gray-500 ml-6 mt-1">Pay when you receive your order</p>
                </label>
                
                <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                  paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="mr-3"
                  />
                  <span className="font-medium">Online Payment</span>
                  <p className="text-sm text-gray-500 ml-6 mt-1">Pay securely with UPI, Card, or Net Banking</p>
                  {paymentMethod === 'online' && (
                    <div className="ml-6 mt-3 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ Online payment integration coming soon. Please use COD for now.
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 pb-6 border-b">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product?.name} × {item.quantity}
                    </span>
                    <span className="font-medium">₹{item.total?.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{cart.subtotal?.toLocaleString()}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">- ₹{cart.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">₹{cart.shipping?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">₹{cart.tax?.toLocaleString()}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-indigo-600">
                  ₹{cart.total?.toLocaleString()}
                </span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddress || (paymentMethod === 'online')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Place Order'}
              </button>

              {/* Security Info */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>🔒 Secure checkout</p>
                <p className="mt-1">Your information is safe with us</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
