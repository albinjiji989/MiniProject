# 🛒 PetConnect E-Commerce Module - Complete Documentation

## Overview
A professional, Flipkart-style e-commerce platform for pet products with advanced features including:
- Product catalog with variants
- Shopping cart with real-time updates
- Multi-address management
- Multiple payment options (COD, Online via Razorpay)
- Order tracking and management
- Wishlist functionality
- Product reviews and ratings
- Coupon/discount system
- Comprehensive analytics

---

## 📦 Database Models

### 1. ProductCategory
Hierarchical category structure with unlimited nesting levels.

**Features:**
- Parent-child relationships
- SEO optimization (meta tags, slug)
- Display ordering
- Product count tracking
- Active/inactive status

**Example Structure:**
```
Dogs (Level 0)
  ├─ Food (Level 1)
  │   ├─ Dry Food (Level 2)
  │   └─ Wet Food (Level 2)
  ├─ Toys (Level 1)
  └─ Grooming (Level 1)
```

### 2. Product
Comprehensive product model with 300+ fields.

**Key Features:**
- **Variants:** Multiple SKUs with different prices/stock (e.g., sizes, colors)
- **Pricing:** Base price, sale price, cost price, dynamic discounts
- **Inventory:** Real-time stock tracking, reserved stock, backorder support
- **Pet-Specific:** Pet type, age group, breed compatibility
- **Media:** Multiple images with ordering, video support
- **SEO:** Meta tags, canonical URLs, text search indexing
- **Analytics:** Views, clicks, purchases, revenue, wishlist count
- **Shipping:** Weight, dimensions, free shipping flags
- **Ratings:** Average rating, distribution, review count

**Virtual Fields:**
- `availableStock` = stock - reserved
- `finalPrice` = salePrice || basePrice
- `discountPercentage` = calculated discount %

**Methods:**
- `isInStock()` - Check availability
- `canPurchase(quantity)` - Validate purchase quantity
- `updateRating(newRating)` - Recalculate average rating

### 3. Cart
User shopping cart with auto-price updates.

**Features:**
- Item-level pricing and quantities
- Summary calculations (subtotal, tax, shipping, total)
- Coupon application
- Auto-validation (stock, price changes)
- Item variant support

**Auto-Updates:**
- Removes out-of-stock items
- Updates changed prices
- Adjusts quantities exceeding stock
- Recalculates totals on save

### 4. Order
Complete order management system.

**Features:**
- Unique order number generation (ORDYYYYMMDD00001)
- Item-level status tracking
- Comprehensive shipping address
- Separate billing address
- Payment integration (Razorpay, COD)
- Status timeline with history
- Cancellation and return handling
- Invoice generation
- Delivery tracking

**Order Statuses:**
- `pending` → `confirmed` → `processing` → `packed` → `shipped` → `out_for_delivery` → `delivered`
- Special: `cancelled`, `returned`, `refunded`

**Payment Statuses:**
- `pending` → `processing` → `completed`
- Special: `failed`, `refunded`

### 5. ProductReview
Multi-criteria review system.

**Features:**
- Overall + detailed ratings (quality, value, packaging)
- Title and detailed comment
- Image and video uploads
- Verified purchase badge
- Helpful/Not helpful voting
- Seller responses
- Moderation system
- Report functionality
- Pet information (optional)

**Auto-Updates:**
- Updates product rating on save/delete
- Calculates rating distribution

### 6. Wishlist
User wishlist with priority levels.

**Features:**
- Multiple items per user
- Variant support
- Priority levels (low, medium, high)
- Notes for items
- Public/private toggle
- Move to cart functionality

### 7. Address
Multi-address management.

**Features:**
- Multiple addresses per user
- Address types (home, work, other)
- Default flags (shipping, billing, both)
- Delivery instructions
- Usage tracking
- Location coordinates (2dsphere index)
- Auto-ensure single default

### 8. Coupon
Advanced discount system.

**Features:**
- Discount types (percentage, fixed, free shipping)
- Maximum discount cap
- Minimum order value
- Validity period
- Usage limits (total, per user)
- Applicable to (all, categories, products, brands)
- Exclusions
- User eligibility (all, new users, specific users, tiers)
- First order only option
- Payment method restrictions
- Auto-apply with priority
- Banner display

**Methods:**
- `canUserUseCoupon(userId)` - Check eligibility
- `calculateDiscount(orderValue, items)` - Compute discount
- `isItemApplicable(item)` - Check item eligibility
- `incrementUsage(userId)` - Track usage

---

## 🚀 API Endpoints

### Public Product Endpoints

#### GET /api/ecommerce/products
Get all products with advanced filtering.

**Query Parameters:**
```javascript
{
  page: 1,
  limit: 20,
  sort: '-createdAt', // or 'price', '-ratings.average', etc.
  category: 'categoryId',
  subcategory: 'subcategoryId',
  petType: 'dog',
  ageGroup: 'puppy',
  breed: ['golden_retriever', 'labrador'],
  minPrice: 100,
  maxPrice: 5000,
  rating: 4, // Products with rating >= 4
  brand: 'Pedigree',
  inStock: 'true',
  isFeatured: 'true',
  search: 'dog food',
  tags: ['organic', 'grain-free']
}
```

**Response:**
```json
{
  "success": true,
  "data": [...products],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalProducts": 195,
    "limit": 20
  }
}
```

#### GET /api/ecommerce/products/:id
Get single product (by ID or slug).

**Response:** Full product details with populated categories and related products.

#### GET /api/ecommerce/products/featured
Get featured/bestseller/new products.

**Query:** `type=featured|bestseller|new`, `limit=10`

#### GET /api/ecommerce/products/search
Autocomplete search.

**Query:** `q=search term`, `limit=10`

#### GET /api/ecommerce/categories
Get all categories.

**Query:** `level=0`, `parent=categoryId`, `includeInactive=false`

#### GET /api/ecommerce/categories/tree
Get full category hierarchy.

#### GET /api/ecommerce/filters
Get available filters for current query.

**Query:** `category=id`, `petType=dog`

**Response:**
```json
{
  "success": true,
  "filters": {
    "brands": ["Pedigree", "Royal Canin", ...],
    "petTypes": ["dog", "cat", ...],
    "ageGroups": ["puppy", "adult", ...],
    "priceRange": { "minPrice": 50, "maxPrice": 10000 }
  }
}
```

#### GET /api/ecommerce/products/:productId/reviews
Get product reviews with pagination.

**Query:** `page=1`, `limit=10`, `rating=5`, `verified=true`, `sort=-createdAt`

### Cart Endpoints (Protected)

#### GET /api/ecommerce/cart
Get user's cart with populated product details.

#### POST /api/ecommerce/cart/add
Add item to cart.

**Body:**
```json
{
  "productId": "productId",
  "variantId": "variantId", // optional
  "quantity": 2
}
```

#### PUT /api/ecommerce/cart/items/:itemId
Update cart item quantity.

**Body:** `{ "quantity": 3 }`

#### DELETE /api/ecommerce/cart/items/:itemId
Remove item from cart.

#### DELETE /api/ecommerce/cart/clear
Clear entire cart.

#### GET /api/ecommerce/cart/summary
Get cart summary (item count, totals).

#### POST /api/ecommerce/cart/coupon/apply
Apply coupon code.

**Body:** `{ "code": "SAVE20" }`

#### DELETE /api/ecommerce/cart/coupon/remove
Remove applied coupon.

### Order Endpoints (Protected)

#### POST /api/ecommerce/orders/payment/create
Create Razorpay payment order.

**Body:** `{ "addressId": "addressId" }`

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_razorpay_id",
    "amount": 250000, // in paise
    "currency": "INR",
    "keyId": "rzp_key_xxx"
  }
}
```

#### POST /api/ecommerce/orders/place
Place order (COD or Online).

**Body:**
```json
{
  "addressId": "addressId",
  "paymentMethod": "cod", // or "online"
  "razorpayOrderId": "order_xxx", // for online payment
  "razorpayPaymentId": "pay_xxx", // for online payment
  "razorpaySignature": "signature", // for online payment
  "customerNote": "Please deliver after 6 PM"
}
```

**Response:** Created order with order number.

#### GET /api/ecommerce/orders
Get user's orders.

**Query:** `page=1`, `limit=10`, `status=delivered`

#### GET /api/ecommerce/orders/:orderId
Get single order details.

#### PUT /api/ecommerce/orders/:orderId/cancel
Cancel order.

**Body:** `{ "reason": "Changed mind" }`

#### POST /api/ecommerce/orders/:orderId/return
Request return (within 7 days of delivery).

**Body:** `{ "reason": "Product damaged" }`

#### GET /api/ecommerce/orders/:orderId/track
Track order status.

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD2024011500001",
    "status": "shipped",
    "trackingNumber": "TRACK123",
    "carrier": "Delhivery",
    "estimatedDelivery": "2024-01-20",
    "timeline": [
      { "status": "pending", "note": "...", "timestamp": "..." },
      { "status": "confirmed", "note": "...", "timestamp": "..." },
      { "status": "shipped", "note": "...", "timestamp": "..." }
    ]
  }
}
```

### Wishlist Endpoints (Protected)

#### GET /api/ecommerce/wishlist
Get user's wishlist.

#### POST /api/ecommerce/wishlist/add
Add to wishlist.

**Body:**
```json
{
  "productId": "productId",
  "variantId": "variantId", // optional
  "priority": "high" // low, medium, high
}
```

#### DELETE /api/ecommerce/wishlist/items/:itemId
Remove from wishlist.

#### GET /api/ecommerce/wishlist/check/:productId
Check if product is in wishlist.

#### POST /api/ecommerce/wishlist/items/:itemId/move-to-cart
Move wishlist item to cart.

#### DELETE /api/ecommerce/wishlist/clear
Clear wishlist.

### Address Endpoints (Protected)

#### GET /api/ecommerce/addresses
Get all user addresses.

#### GET /api/ecommerce/addresses/default
Get default address.

**Query:** `type=shipping|billing`

#### GET /api/ecommerce/addresses/:addressId
Get single address.

#### POST /api/ecommerce/addresses
Add new address.

**Body:**
```json
{
  "fullName": "John Doe",
  "phone": "9876543210",
  "alternatePhone": "8765432109",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apartment 4B",
  "landmark": "Near City Mall",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India",
  "addressType": "home", // home, work, other
  "label": "Home",
  "isDefault": true,
  "deliveryInstructions": "Ring bell twice"
}
```

#### PUT /api/ecommerce/addresses/:addressId
Update address.

#### DELETE /api/ecommerce/addresses/:addressId
Delete address (soft delete).

#### PUT /api/ecommerce/addresses/:addressId/set-default
Set as default address.

**Body:** `{ "type": "both" }` // shipping, billing, both

### Review Endpoints (Protected)

#### POST /api/ecommerce/reviews/:productId
Add product review.

**Body:**
```json
{
  "orderId": "orderId", // optional, for verified purchase badge
  "rating": {
    "overall": 5,
    "quality": 5,
    "value": 4,
    "packaging": 5
  },
  "title": "Excellent product!",
  "comment": "My dog loves this food...",
  "images": [
    { "url": "image1.jpg", "caption": "Happy dog" }
  ],
  "videos": [
    { "url": "video1.mp4", "thumbnail": "thumb1.jpg" }
  ],
  "petInfo": {
    "petType": "dog",
    "breed": "Golden Retriever",
    "age": "2 years",
    "usageDuration": "2 months"
  }
}
```

#### PUT /api/ecommerce/reviews/:reviewId
Update review.

#### DELETE /api/ecommerce/reviews/:reviewId
Delete review.

#### GET /api/ecommerce/reviews/my
Get user's reviews.

**Query:** `page=1`, `limit=10`

#### POST /api/ecommerce/reviews/:reviewId/helpful
Mark review as helpful.

#### POST /api/ecommerce/reviews/:reviewId/not-helpful
Mark review as not helpful.

#### POST /api/ecommerce/reviews/:reviewId/report
Report inappropriate review.

**Body:** `{ "reason": "Spam content" }`

#### POST /api/ecommerce/reviews/:reviewId/reply
Add reply to review.

**Body:** `{ "comment": "Thank you for your feedback!" }`

---

## 💳 Payment Integration

### Razorpay Setup

1. **Environment Variables:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

2. **Payment Flow:**

**Step 1:** Create payment order
```javascript
POST /api/ecommerce/orders/payment/create
Body: { addressId: "xxx" }
```

**Step 2:** Frontend Razorpay checkout
```javascript
const options = {
  key: response.data.keyId,
  amount: response.data.amount,
  currency: response.data.currency,
  order_id: response.data.orderId,
  name: "PetConnect",
  description: "Order Payment",
  handler: function(response) {
    // Step 3: Place order with payment details
    placeOrder({
      addressId: selectedAddress,
      paymentMethod: 'online',
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    });
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

**Step 3:** Backend verifies signature and creates order
```javascript
POST /api/ecommerce/orders/place
Body: {
  addressId,
  paymentMethod: 'online',
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
}
```

### COD Orders
Simply set `paymentMethod: 'cod'` and skip Razorpay steps.

---

## 📊 Analytics Tracking

Products automatically track:
- **Views** - Incremented on product detail page visit
- **Clicks** - Track via `/products/:id/track-click`
- **Purchases** - Auto-incremented on order placement
- **Revenue** - Sum of order totals
- **Wishlist Count** - Add/remove from wishlist

**Access Analytics:**
```javascript
const product = await Product.findById(productId);
console.log(product.analytics);
// {
//   views: 1250,
//   clicks: 345,
//   purchases: 89,
//   revenue: 125600,
//   wishlistCount: 42
// }
```

---

## 🔍 Search & Filters

### Text Search
Products have text index on `name`, `description`, `tags`, `brand`.

```javascript
GET /api/ecommerce/products?search=grain free dog food
```

### Advanced Filtering
Combine multiple filters:

```javascript
GET /api/ecommerce/products?
  category=dogFoodCatId&
  petType=dog&
  ageGroup=puppy&
  minPrice=500&
  maxPrice=2000&
  rating=4&
  inStock=true&
  sort=-ratings.average
```

### Available Sorts
- `createdAt` / `-createdAt` (newest/oldest)
- `price` / `-price` (low to high / high to low)
- `ratings.average` / `-ratings.average`
- `analytics.purchases` (popularity)
- `name` (alphabetical)

---

## 🎁 Coupon System

### Creating Coupons
Coupons can be:
- **Percentage discount** with max cap
- **Fixed amount** discount
- **Free shipping**

### Usage Example

**Admin creates coupon:**
```javascript
{
  code: "SAVE20",
  name: "20% Off on Dog Food",
  discountType: "percentage",
  discountValue: 20,
  maxDiscount: 500,
  minOrderValue: 1000,
  validFrom: "2024-01-01",
  validTill: "2024-12-31",
  usageLimit: {
    total: 1000,
    perUser: 3
  },
  applicableTo: {
    type: "categories",
    categories: [dogFoodCategoryId]
  },
  eligibility: {
    type: "all"
  }
}
```

**User applies:**
```javascript
POST /api/ecommerce/cart/coupon/apply
Body: { code: "SAVE20" }
```

**System validates:**
- ✅ Coupon exists and active
- ✅ Within validity period
- ✅ User hasn't exceeded per-user limit
- ✅ Cart value >= minOrderValue
- ✅ Cart has applicable items

**On success:**
- Discount applied to cart
- Usage tracked for user
- Final amount updated

---

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
cd backend
npm install razorpay
```

### 2. Environment Variables
Add to `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

### 3. Database Indexes
Models have built-in indexes. They'll be created automatically on first use.

### 4. Seed Data (Optional)
Create sample categories, products, coupons for testing.

---

## 🧪 Testing Checklist

### Products
- [ ] Browse products with pagination
- [ ] Filter by category, price, rating
- [ ] Search products
- [ ] View product details
- [ ] Check product variants
- [ ] View product reviews

### Cart
- [ ] Add product to cart
- [ ] Update quantity
- [ ] Remove item
- [ ] Apply coupon (valid/invalid)
- [ ] View cart summary
- [ ] Clear cart

### Orders
- [ ] Place COD order
- [ ] Place online payment order (Razorpay)
- [ ] View order history
- [ ] View order details
- [ ] Track order
- [ ] Cancel order
- [ ] Request return

### Wishlist
- [ ] Add to wishlist
- [ ] View wishlist
- [ ] Remove from wishlist
- [ ] Move to cart
- [ ] Clear wishlist

### Addresses
- [ ] Add new address
- [ ] Update address
- [ ] Delete address
- [ ] Set default address
- [ ] Use address in checkout

### Reviews
- [ ] Submit review (verified/unverified)
- [ ] Update review
- [ ] Delete review
- [ ] Mark helpful/not helpful
- [ ] Report review
- [ ] Reply to review

---

## 🎨 Frontend Integration

### Product Listing Page
```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function ProductListing() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    page: 1
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    const { data } = await axios.get('/api/ecommerce/products', {
      params: filters
    });
    setProducts(data.data);
  };

  return (
    <div className="container">
      {/* Filters sidebar */}
      <aside>
        {/* Category, price, rating filters */}
      </aside>

      {/* Product grid */}
      <main>
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </main>
    </div>
  );
}
```

### Shopping Cart
```jsx
function ShoppingCart() {
  const [cart, setCart] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    const { data } = await axios.get('/api/ecommerce/cart');
    setCart(data.data);
  };

  const updateQuantity = async (itemId, quantity) => {
    await axios.put(`/api/ecommerce/cart/items/${itemId}`, { quantity });
    fetchCart();
  };

  const removeItem = async (itemId) => {
    await axios.delete(`/api/ecommerce/cart/items/${itemId}`);
    fetchCart();
  };

  const applyCoupon = async (code) => {
    try {
      await axios.post('/api/ecommerce/cart/coupon/apply', { code });
      fetchCart();
      alert('Coupon applied!');
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <div>
      {cart?.items.map(item => (
        <CartItem
          key={item._id}
          item={item}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
        />
      ))}

      {/* Coupon input */}
      <CouponInput onApply={applyCoupon} />

      {/* Cart summary */}
      <CartSummary summary={cart?.summary} />

      {/* Checkout button */}
      <button onClick={() => navigate('/checkout')}>
        Proceed to Checkout
      </button>
    </div>
  );
}
```

### Checkout Flow
```jsx
function Checkout() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const placeOrder = async () => {
    if (paymentMethod === 'online') {
      // Create Razorpay order
      const { data } = await axios.post('/api/ecommerce/orders/payment/create', {
        addressId: selectedAddress
      });

      // Open Razorpay checkout
      const options = {
        key: data.data.keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        order_id: data.data.orderId,
        handler: async (response) => {
          // Place order with payment details
          await axios.post('/api/ecommerce/orders/place', {
            addressId: selectedAddress,
            paymentMethod: 'online',
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });
          
          navigate('/orders?success=true');
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } else {
      // COD order
      await axios.post('/api/ecommerce/orders/place', {
        addressId: selectedAddress,
        paymentMethod: 'cod'
      });

      navigate('/orders?success=true');
    }
  };

  return (
    <div>
      {/* Address selection */}
      <AddressList
        addresses={addresses}
        selected={selectedAddress}
        onSelect={setSelectedAddress}
      />

      {/* Payment method */}
      <PaymentMethods
        selected={paymentMethod}
        onSelect={setPaymentMethod}
      />

      {/* Place order */}
      <button onClick={placeOrder}>
        Place Order
      </button>
    </div>
  );
}
```

---

## 📱 Mobile App Integration

All APIs are RESTful and can be consumed by mobile apps (React Native, Flutter, etc.).

**Example (React Native):**
```javascript
import axios from 'axios';

const API_URL = 'https://your-backend.com/api/ecommerce';

export const EcommerceService = {
  getProducts: (params) => axios.get(`${API_URL}/products`, { params }),
  getCart: () => axios.get(`${API_URL}/cart`),
  addToCart: (productId, quantity) => 
    axios.post(`${API_URL}/cart/add`, { productId, quantity }),
  placeOrder: (orderData) => 
    axios.post(`${API_URL}/orders/place`, orderData),
  // ... more methods
};
```

---

## 🚀 Production Recommendations

### Performance
1. **Database Indexes** - Already implemented in models
2. **Caching** - Add Redis for product listings, categories
3. **CDN** - Use CDN for product images/videos
4. **Pagination** - Always use for large datasets

### Security
1. **Rate Limiting** - Add on checkout/payment endpoints
2. **Input Validation** - Validate all user inputs
3. **Payment Security** - Never log Razorpay credentials
4. **SQL Injection** - Mongoose handles this

### Monitoring
1. **Error Tracking** - Sentry/Bugsnag
2. **Analytics** - Track conversion rates
3. **Performance** - Monitor API response times
4. **Stock Alerts** - Low stock notifications

### Business Features
1. **Email Notifications** - Order confirmations, shipping updates
2. **SMS Alerts** - OTP verification, delivery notifications
3. **Invoice Generation** - PDF invoices for orders
4. **Inventory Management** - Auto-reorder when stock low
5. **Seller Dashboard** - For multi-vendor marketplace

---

## 📄 License
Part of PetConnect platform. All rights reserved.

## 🤝 Support
For issues or feature requests, contact the development team.

---

**Built with ❤️ for pet lovers and their furry friends! 🐶🐱**
