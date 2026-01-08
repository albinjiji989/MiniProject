# 🏗️ E-Commerce Module - Complete Architecture

## 🎭 Role-Based Architecture

### Clear Separation of Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│                    PETCONNECT E-COMMERCE                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  👑 ADMIN              🏪 MANAGER              🛍️ USER       │
│  ─────────             ─────────────            ──────────    │
│  • Monitor only        • Create products       • Browse       │
│  • View analytics      • Manage inventory      • Add to cart │
│  • Reports             • Process orders        • Place order │
│  • Statistics          • Categories            • Track order │
│  • No creation         • Full control          • Reviews     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Module Structure

```
backend/modules/ecommerce/
├── admin/                          # ADMIN - Monitoring Only
│   ├── dashboardController.js     # ✅ View stats, reports
│   └── routes.js                   # ✅ Read-only routes
│
├── manager/                        # MANAGER - Full Product Control
│   ├── categoryController.js      # ✅ CRUD categories
│   ├── productController.js       # ✅ CRUD products
│   ├── orderController.js         # ✅ Order fulfillment
│   └── routes.js                   # ✅ Management routes
│
├── user/                           # USER - Shopping Experience
│   ├── productController.js       # ✅ Browse products
│   ├── cartController.js          # ✅ Shopping cart
│   ├── orderController.js         # ✅ Place orders
│   ├── wishlistController.js      # ✅ Wishlist
│   ├── addressController.js       # ✅ Addresses
│   ├── reviewController.js        # ✅ Product reviews
│   └── routes.js                   # ✅ Public + protected routes
│
└── models/                         # Shared Database Models
    ├── ProductCategory.js         # Hierarchical categories
    ├── Product.js                 # Products with variants
    ├── Cart.js                    # Shopping cart
    ├── Order.js                   # Order management
    ├── ProductReview.js           # Reviews & ratings
    ├── Wishlist.js                # User wishlist
    ├── Address.js                 # Shipping addresses
    └── Coupon.js                  # Discount coupons
```

---

## 🔐 Role Permissions

### 👑 ADMIN (Monitor & Maintain)

**What Admin CAN do:**
- ✅ View dashboard statistics
- ✅ View sales analytics
- ✅ View inventory reports
- ✅ View order fulfillment metrics
- ✅ View customer insights
- ✅ View category performance
- ✅ View top-selling products
- ✅ View review statistics
- ✅ View reported content
- ✅ Export sales reports

**What Admin CANNOT do:**
- ❌ Create products
- ❌ Update products
- ❌ Delete products
- ❌ Create categories
- ❌ Modify inventory
- ❌ Process orders directly

**Admin Routes:**
```javascript
GET /api/ecommerce/admin/dashboard/stats
GET /api/ecommerce/admin/analytics/sales
GET /api/ecommerce/admin/analytics/top-products
GET /api/ecommerce/admin/analytics/categories
GET /api/ecommerce/admin/reports/inventory
GET /api/ecommerce/admin/reports/fulfillment
GET /api/ecommerce/admin/analytics/customers
GET /api/ecommerce/admin/analytics/reviews
GET /api/ecommerce/admin/reports/reported-content
GET /api/ecommerce/admin/reports/sales/export
```

---

### 🏪 MANAGER (Product & Inventory Management)

**What Manager CAN do:**

**Categories:**
- ✅ Create categories (all levels)
- ✅ Update categories
- ✅ Delete categories (if no products)
- ✅ Toggle category status
- ✅ Reorder categories
- ✅ View category statistics

**Products:**
- ✅ Create products
- ✅ Update products
- ✅ Delete products
- ✅ Update product status
- ✅ Manage inventory
- ✅ Bulk update inventory
- ✅ Update pricing
- ✅ Add/update/delete variants
- ✅ View product analytics

**Orders:**
- ✅ View all orders
- ✅ Update order status
- ✅ Confirm orders
- ✅ Ship orders
- ✅ Mark as delivered
- ✅ Process cancellations
- ✅ Process returns
- ✅ Add internal notes
- ✅ View order statistics

**Manager Routes:**

```javascript
// Categories
GET    /api/ecommerce/manager/categories
GET    /api/ecommerce/manager/categories/tree
GET    /api/ecommerce/manager/categories/:categoryId
POST   /api/ecommerce/manager/categories
PUT    /api/ecommerce/manager/categories/:categoryId
DELETE /api/ecommerce/manager/categories/:categoryId
PATCH  /api/ecommerce/manager/categories/:categoryId/toggle-active
GET    /api/ecommerce/manager/categories/:categoryId/stats
POST   /api/ecommerce/manager/categories/reorder

// Products
GET    /api/ecommerce/manager/products
GET    /api/ecommerce/manager/products/low-stock
GET    /api/ecommerce/manager/products/:productId
POST   /api/ecommerce/manager/products
PUT    /api/ecommerce/manager/products/:productId
DELETE /api/ecommerce/manager/products/:productId
PATCH  /api/ecommerce/manager/products/:productId/status
PATCH  /api/ecommerce/manager/products/:productId/inventory
POST   /api/ecommerce/manager/products/inventory/bulk
PATCH  /api/ecommerce/manager/products/:productId/pricing
GET    /api/ecommerce/manager/products/:productId/analytics

// Variants
POST   /api/ecommerce/manager/products/:productId/variants
PUT    /api/ecommerce/manager/products/:productId/variants/:variantId
DELETE /api/ecommerce/manager/products/:productId/variants/:variantId

// Orders
GET    /api/ecommerce/manager/orders
GET    /api/ecommerce/manager/orders/pending
GET    /api/ecommerce/manager/orders/stats
GET    /api/ecommerce/manager/orders/:orderId
PATCH  /api/ecommerce/manager/orders/:orderId/status
POST   /api/ecommerce/manager/orders/:orderId/confirm
POST   /api/ecommerce/manager/orders/:orderId/ship
POST   /api/ecommerce/manager/orders/:orderId/deliver
POST   /api/ecommerce/manager/orders/:orderId/cancellation/process
POST   /api/ecommerce/manager/orders/:orderId/return/process
POST   /api/ecommerce/manager/orders/:orderId/notes
```

---

### 🛍️ USER (Shopping Experience)

**What User CAN do:**

**Products:**
- ✅ Browse products (filter, search, sort)
- ✅ View product details
- ✅ View categories
- ✅ Search products
- ✅ View featured products
- ✅ View product reviews

**Cart:**
- ✅ Add to cart
- ✅ Update cart items
- ✅ Remove from cart
- ✅ Apply coupons
- ✅ View cart summary

**Orders:**
- ✅ Create payment order (Razorpay)
- ✅ Place order (COD/Online)
- ✅ View order history
- ✅ View order details
- ✅ Track order
- ✅ Cancel order
- ✅ Request return

**Wishlist:**
- ✅ Add to wishlist
- ✅ Remove from wishlist
- ✅ Move to cart
- ✅ Check if in wishlist

**Addresses:**
- ✅ Add address
- ✅ Update address
- ✅ Delete address
- ✅ Set default address

**Reviews:**
- ✅ Submit review
- ✅ Update review
- ✅ Delete review
- ✅ Mark helpful/not helpful
- ✅ Report review
- ✅ Reply to review

**User Routes:**

```javascript
// Products (Public)
GET /api/ecommerce/products
GET /api/ecommerce/products/featured
GET /api/ecommerce/products/search
GET /api/ecommerce/products/:id
GET /api/ecommerce/categories
GET /api/ecommerce/categories/tree
GET /api/ecommerce/filters
GET /api/ecommerce/products/:productId/reviews

// Cart (Protected)
GET    /api/ecommerce/cart
POST   /api/ecommerce/cart/add
PUT    /api/ecommerce/cart/items/:itemId
DELETE /api/ecommerce/cart/items/:itemId
DELETE /api/ecommerce/cart/clear
GET    /api/ecommerce/cart/summary
POST   /api/ecommerce/cart/coupon/apply
DELETE /api/ecommerce/cart/coupon/remove

// Orders (Protected)
POST   /api/ecommerce/orders/payment/create
POST   /api/ecommerce/orders/place
GET    /api/ecommerce/orders
GET    /api/ecommerce/orders/:orderId
PUT    /api/ecommerce/orders/:orderId/cancel
POST   /api/ecommerce/orders/:orderId/return
GET    /api/ecommerce/orders/:orderId/track

// Wishlist (Protected)
GET    /api/ecommerce/wishlist
POST   /api/ecommerce/wishlist/add
DELETE /api/ecommerce/wishlist/items/:itemId
GET    /api/ecommerce/wishlist/check/:productId
POST   /api/ecommerce/wishlist/items/:itemId/move-to-cart
DELETE /api/ecommerce/wishlist/clear

// Addresses (Protected)
GET    /api/ecommerce/addresses
GET    /api/ecommerce/addresses/default
POST   /api/ecommerce/addresses
PUT    /api/ecommerce/addresses/:addressId
DELETE /api/ecommerce/addresses/:addressId
PUT    /api/ecommerce/addresses/:addressId/set-default

// Reviews (Protected)
POST   /api/ecommerce/reviews/:productId
PUT    /api/ecommerce/reviews/:reviewId
DELETE /api/ecommerce/reviews/:reviewId
GET    /api/ecommerce/reviews/my
POST   /api/ecommerce/reviews/:reviewId/helpful
POST   /api/ecommerce/reviews/:reviewId/report
POST   /api/ecommerce/reviews/:reviewId/reply
```

---

## 🌐 Complete API Flow Examples

### Example 1: Manager Creates Product

```javascript
// 1. Manager creates category hierarchy
POST /api/ecommerce/manager/categories
{
  "name": "Food",
  "parent": null
}
// Returns: { _id: "food_id", level: 0 }

POST /api/ecommerce/manager/categories
{
  "name": "Dog Food",
  "parent": "food_id"
}
// Returns: { _id: "dog_food_id", level: 1 }

POST /api/ecommerce/manager/categories
{
  "name": "Pedigree",
  "parent": "dog_food_id"
}
// Returns: { _id: "pedigree_id", level: 2 }

// 2. Manager creates product
POST /api/ecommerce/manager/products
{
  "name": "Pedigree Adult 10kg",
  "category": "dog_food_id",
  "subcategory": "pedigree_id",
  "basePrice": 1499,
  "stock": 100,
  "status": "active"
}
```

### Example 2: User Browses and Buys

```javascript
// 1. Browse products
GET /api/ecommerce/products?category=dog_food_id&subcategory=pedigree_id

// 2. View product details
GET /api/ecommerce/products/product_id

// 3. Add to cart
POST /api/ecommerce/cart/add
{
  "productId": "product_id",
  "quantity": 2
}

// 4. Apply coupon
POST /api/ecommerce/cart/coupon/apply
{
  "code": "SAVE20"
}

// 5. Add shipping address
POST /api/ecommerce/addresses
{
  "fullName": "John Doe",
  "phone": "9876543210",
  "addressLine1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}

// 6. Create payment (if online)
POST /api/ecommerce/orders/payment/create
{
  "addressId": "address_id"
}

// 7. Place order
POST /api/ecommerce/orders/place
{
  "addressId": "address_id",
  "paymentMethod": "cod"
}
```

### Example 3: Manager Fulfills Order

```javascript
// 1. View pending orders
GET /api/ecommerce/manager/orders?status=pending

// 2. Confirm order
POST /api/ecommerce/manager/orders/order_id/confirm

// 3. Update inventory
PATCH /api/ecommerce/manager/products/product_id/inventory
{
  "stock": 98
}

// 4. Ship order
POST /api/ecommerce/manager/orders/order_id/ship
{
  "trackingNumber": "TRACK123",
  "carrier": "Delhivery",
  "estimatedDelivery": "2026-01-15"
}

// 5. Mark delivered
POST /api/ecommerce/manager/orders/order_id/deliver
```

### Example 4: Admin Views Analytics

```javascript
// 1. Dashboard stats
GET /api/ecommerce/admin/dashboard/stats?period=30

// 2. Sales analytics
GET /api/ecommerce/admin/analytics/sales?groupBy=day

// 3. Top products
GET /api/ecommerce/admin/analytics/top-products?limit=10

// 4. Category performance
GET /api/ecommerce/admin/analytics/categories

// 5. Inventory report
GET /api/ecommerce/admin/reports/inventory?lowStock=true

// 6. Export sales
GET /api/ecommerce/admin/reports/sales/export?startDate=2026-01-01
```

---

## 🎨 Frontend Dashboard Layouts

### Admin Dashboard

```
┌────────────────────────────────────────────────────┐
│  E-Commerce Analytics Dashboard                    │
├────────────────────────────────────────────────────┤
│                                                     │
│  📊 Total Orders: 1,234    💰 Revenue: ₹12,34,567 │
│  📦 Products: 456          👥 Customers: 890       │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│  📈 Sales Chart (Last 30 Days)                     │
│  [Bar Chart showing daily sales]                   │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│  🏆 Top Selling Products                           │
│  1. Pedigree Adult 10kg - ₹45,678 (234 sales)     │
│  2. Royal Canin 3kg - ₹34,567 (189 sales)          │
│  3. Whiskas Cat Food - ₹23,456 (156 sales)         │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│  📁 Category Performance                           │
│  [Table with category stats]                       │
│                                                     │
│  [Export Reports] [View Detailed Analytics]        │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Manager Dashboard

```
┌────────────────────────────────────────────────────┐
│  Product & Order Management                         │
├────────────────────────────────────────────────────┤
│  [Products] [Orders] [Categories] [Inventory]      │
│                                                     │
│  ⚡ Quick Actions:                                  │
│  [+ Add Product] [+ Add Category] [Process Orders] │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│  🔔 Pending Orders: 15                             │
│  ⚠️ Low Stock Items: 8                             │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│  📦 Recent Orders                                   │
│  #ORD20260107001 - ₹1,299 - Pending                │
│  #ORD20260107002 - ₹2,456 - Processing             │
│  #ORD20260107003 - ₹890 - Shipped                  │
│                                                     │
│  [View All Orders]                                  │
│                                                     │
└────────────────────────────────────────────────────┘
```

### User Shopping Interface

```
┌────────────────────────────────────────────────────┐
│  [Logo] PetConnect     🔍 Search     🛒(3) 👤      │
├────────────────────────────────────────────────────┤
│                                                     │
│  Categories:                                        │
│  [Food] [Toys] [Accessories] [Grooming] [Health]  │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                     │
│  🍖 Food > Dog Food > Pedigree                     │
│                                                     │
│  Filters:                    Products (234)         │
│  ┌──────────┐              ┌─────────────────┐    │
│  │ Price    │              │ [Product Card]  │    │
│  │ ₹0-₹5000│              │                 │    │
│  │          │              │ Pedigree Adult  │    │
│  │ Brand    │              │ ₹1,499 ₹1,299  │    │
│  │ ☑ Pedigree│              │ ⭐⭐⭐⭐⭐ (234)  │    │
│  │ ☐ Royal  │              │                 │    │
│  │          │              │ [Add to Cart]   │    │
│  │ Rating   │              └─────────────────┘    │
│  │ ⭐ 4 & up │              [More products...]    │
│  └──────────┘                                      │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow

### Product Creation Flow (Manager)

```mermaid
Manager → Create Category (Level 0: Food)
       → Create Category (Level 1: Dog Food)
       → Create Category (Level 2: Pedigree)
       → Create Product
       → Set Status: Active
       → Product appears on website
```

### Order Flow (User → Manager)

```mermaid
User → Browse Products
     → Add to Cart
     → Apply Coupon
     → Add Address
     → Place Order
     
Manager → View Pending Order
        → Confirm Order
        → Update Status: Processing
        → Pack Items
        → Ship Order
        → Mark Delivered
        
User → Receive Product
     → Submit Review
```

### Monitoring Flow (Admin)

```mermaid
Admin → View Dashboard
      → Check Sales Analytics
      → View Top Products
      → Check Inventory Reports
      → View Customer Insights
      → Export Reports
      → (No product creation!)
```

---

## ✅ Key Architectural Decisions

1. **Role Separation**: Clear boundaries - Admin monitors, Manager manages, User shops
2. **Hierarchical Categories**: Unlimited levels (Food → Dog Food → Pedigree)
3. **Manager-Driven**: Managers add all products and categories
4. **Admin Oversight**: Admins have read-only access for monitoring
5. **User Experience**: Seamless browsing with breadcrumbs
6. **Real-time Updates**: Stock tracking, cart validation
7. **Professional Features**: Variants, coupons, reviews, analytics

---

**This is an industry-level e-commerce platform with clear role separation!** 🚀
