# 🏷️ E-Commerce Category Hierarchy Setup

## Category Structure Overview

The e-commerce module supports **unlimited category levels** with a professional hierarchy system:

```
Level 0 (Main Categories)
├─ Level 1 (Subcategories)
│  ├─ Level 2 (Sub-subcategories)
│  │  └─ Products
```

---

## 📋 Real-World Category Examples

### 1. **Food Category**

```
Food (Level 0)
├─ Dog Food (Level 1)
│  ├─ Pedigree (Level 2)
│  ├─ Royal Canin (Level 2)
│  ├─ Drools (Level 2)
│  └─ Purina (Level 2)
├─ Cat Food (Level 1)
│  ├─ Whiskas (Level 2)
│  ├─ Royal Canin (Level 2)
│  └─ Me-O (Level 2)
├─ Bird Food (Level 1)
│  ├─ Seeds Mix (Level 2)
│  ├─ Pellets (Level 2)
│  └─ Treats (Level 2)
└─ Fish Food (Level 1)
   ├─ Flakes (Level 2)
   ├─ Pellets (Level 2)
   └─ Frozen Food (Level 2)
```

### 2. **Toys Category**

```
Toys (Level 0)
├─ Dog Toys (Level 1)
│  ├─ Balls (Level 2)
│  ├─ Chew Toys (Level 2)
│  ├─ Rope Toys (Level 2)
│  ├─ Squeaky Toys (Level 2)
│  └─ Interactive Toys (Level 2)
├─ Cat Toys (Level 1)
│  ├─ Feather Wands (Level 2)
│  ├─ Laser Pointers (Level 2)
│  ├─ Catnip Toys (Level 2)
│  └─ Mice Toys (Level 2)
└─ Bird Toys (Level 1)
   ├─ Swings (Level 2)
   ├─ Bells (Level 2)
   └─ Mirrors (Level 2)
```

### 3. **Accessories Category**

```
Accessories (Level 0)
├─ Collars & Leashes (Level 1)
│  ├─ Dog Collars (Level 2)
│  ├─ Cat Collars (Level 2)
│  ├─ Harnesses (Level 2)
│  └─ Leashes (Level 2)
├─ Bowls & Feeders (Level 1)
│  ├─ Food Bowls (Level 2)
│  ├─ Water Fountains (Level 2)
│  └─ Automatic Feeders (Level 2)
└─ Beds & Furniture (Level 1)
   ├─ Dog Beds (Level 2)
   ├─ Cat Trees (Level 2)
   └─ Pet Houses (Level 2)
```

### 4. **Grooming Category**

```
Grooming (Level 0)
├─ Shampoos & Conditioners (Level 1)
│  ├─ Dog Shampoo (Level 2)
│  ├─ Cat Shampoo (Level 2)
│  ├─ Medicated Shampoo (Level 2)
│  └─ Dry Shampoo (Level 2)
├─ Brushes & Combs (Level 1)
│  ├─ Slicker Brushes (Level 2)
│  ├─ De-shedding Tools (Level 2)
│  └─ Nail Clippers (Level 2)
└─ Dental Care (Level 1)
   ├─ Toothbrush (Level 2)
   ├─ Toothpaste (Level 2)
   └─ Dental Chews (Level 2)
```

### 5. **Healthcare Category**

```
Healthcare (Level 0)
├─ Supplements (Level 1)
│  ├─ Multivitamins (Level 2)
│  ├─ Joint Support (Level 2)
│  ├─ Skin & Coat (Level 2)
│  └─ Digestive Health (Level 2)
├─ Medicines (Level 1)
│  ├─ Dewormers (Level 2)
│  ├─ Flea & Tick (Level 2)
│  └─ Antibiotics (Level 2)
└─ First Aid (Level 1)
   ├─ Bandages (Level 2)
   ├─ Antiseptics (Level 2)
   └─ First Aid Kits (Level 2)
```

---

## 🚀 Setting Up Categories (Manager)

### Step 1: Create Level 0 (Main Category)

**POST** `/api/ecommerce/manager/categories`

```json
{
  "name": "Food",
  "slug": "food",
  "description": "Pet food for all types of pets",
  "parent": null,
  "image": "https://example.com/food-category.jpg",
  "icon": "🍖",
  "displayOrder": 1,
  "metaTitle": "Pet Food - Best Quality Pet Food Online",
  "metaDescription": "Shop premium pet food for dogs, cats, birds, and fish",
  "metaKeywords": "pet food, dog food, cat food, bird food",
  "isActive": true
}
```

### Step 2: Create Level 1 (Subcategory)

**POST** `/api/ecommerce/manager/categories`

```json
{
  "name": "Dog Food",
  "slug": "dog-food",
  "description": "Nutritious food for dogs of all ages",
  "parent": "FOOD_CATEGORY_ID",  // ← Reference to parent
  "image": "https://example.com/dog-food.jpg",
  "displayOrder": 1,
  "metaTitle": "Dog Food - Premium Dog Food Online",
  "metaDescription": "Buy the best dog food brands",
  "isActive": true
}
```

### Step 3: Create Level 2 (Brand/Sub-subcategory)

**POST** `/api/ecommerce/manager/categories`

```json
{
  "name": "Pedigree",
  "slug": "pedigree",
  "description": "Pedigree dog food products",
  "parent": "DOG_FOOD_CATEGORY_ID",  // ← Reference to parent
  "image": "https://example.com/pedigree.jpg",
  "displayOrder": 1,
  "metaTitle": "Pedigree Dog Food - Buy Online",
  "metaDescription": "Premium Pedigree dog food at best prices",
  "isActive": true
}
```

### Step 4: Add Product to Category

**POST** `/api/ecommerce/manager/products`

```json
{
  "name": "Pedigree Adult Dry Dog Food, Chicken & Vegetables, 10kg",
  "category": "DOG_FOOD_CATEGORY_ID",      // Level 1
  "subcategory": "PEDIGREE_CATEGORY_ID",   // Level 2
  "basePrice": 1499,
  "salePrice": 1299,
  "stock": 100,
  "petType": "dog",
  "ageGroup": "adult",
  "brand": "Pedigree",
  "weight": "10kg",
  "description": "Complete nutrition for adult dogs...",
  "images": [
    {
      "url": "https://example.com/pedigree-10kg.jpg",
      "alt": "Pedigree Dog Food 10kg",
      "isPrimary": true,
      "order": 1
    }
  ],
  "status": "active"
}
```

---

## 🌐 User Experience - Category Browsing

### Homepage Category Display

Users see main categories (Level 0):

```
┌─────────────────────────────────────────────────┐
│  Browse by Category                              │
├─────────────────────────────────────────────────┤
│  🍖 Food    🎾 Toys    🎀 Accessories          │
│  💅 Grooming    🏥 Healthcare    🛏️ Furniture    │
└─────────────────────────────────────────────────┘
```

### Category Page (Level 0 → Level 1)

Click "Food" → Show subcategories:

```
Food
├─ 🐕 Dog Food
├─ 🐱 Cat Food
├─ 🦜 Bird Food
└─ 🐠 Fish Food
```

### Subcategory Page (Level 1 → Level 2)

Click "Dog Food" → Show brands:

```
Dog Food
├─ Pedigree (234 products)
├─ Royal Canin (189 products)
├─ Drools (156 products)
└─ Purina (98 products)
```

### Brand Page (Level 2 → Products)

Click "Pedigree" → Show products:

```
Pedigree Dog Food
├─ Pedigree Adult Dry Dog Food 10kg
├─ Pedigree Puppy Dry Dog Food 3kg
├─ Pedigree Senior Dog Food 1kg
└─ ... (234 products)
```

---

## 📊 Manager Dashboard - Category Tree View

**GET** `/api/ecommerce/manager/categories/tree`

Returns hierarchical structure:

```json
[
  {
    "_id": "food_id",
    "name": "Food",
    "level": 0,
    "productCount": 1234,
    "children": [
      {
        "_id": "dog_food_id",
        "name": "Dog Food",
        "level": 1,
        "productCount": 567,
        "children": [
          {
            "_id": "pedigree_id",
            "name": "Pedigree",
            "level": 2,
            "productCount": 234,
            "children": []
          },
          {
            "_id": "royal_canin_id",
            "name": "Royal Canin",
            "level": 2,
            "productCount": 189,
            "children": []
          }
        ]
      },
      {
        "_id": "cat_food_id",
        "name": "Cat Food",
        "level": 1,
        "productCount": 423,
        "children": [...]
      }
    ]
  }
]
```

---

## 🎯 Breadcrumb Navigation (User View)

When viewing product:

```
Home > Food > Dog Food > Pedigree > Pedigree Adult 10kg
```

**GET** `/api/ecommerce/categories/:categoryId`

Returns with breadcrumb:

```json
{
  "success": true,
  "data": {
    "_id": "pedigree_id",
    "name": "Pedigree",
    "level": 2,
    "breadcrumb": [
      { "name": "Food", "slug": "food", "level": 0 },
      { "name": "Dog Food", "slug": "dog-food", "level": 1 },
      { "name": "Pedigree", "slug": "pedigree", "level": 2 }
    ]
  }
}
```

---

## 🔧 Category Management Operations

### 1. View All Categories

**GET** `/api/ecommerce/manager/categories`

Query params:
- `level=0` - Get only main categories
- `level=1` - Get only subcategories
- `parent=categoryId` - Get children of specific category
- `search=dog` - Search categories by name

### 2. Get Category Statistics

**GET** `/api/ecommerce/manager/categories/:categoryId/stats`

```json
{
  "success": true,
  "data": {
    "category": "Dog Food",
    "level": 1,
    "directProducts": 567,
    "totalProducts": 567,      // Including all subcategories
    "subcategories": 4,
    "allDescendants": 4
  }
}
```

### 3. Reorder Categories

**POST** `/api/ecommerce/manager/categories/reorder`

```json
{
  "categories": [
    { "id": "food_id", "displayOrder": 1 },
    { "id": "toys_id", "displayOrder": 2 },
    { "id": "accessories_id", "displayOrder": 3 }
  ]
}
```

### 4. Toggle Category Active Status

**PATCH** `/api/ecommerce/manager/categories/:categoryId/toggle-active`

Activates/deactivates category (products won't show if inactive)

### 5. Delete Category

**DELETE** `/api/ecommerce/manager/categories/:categoryId`

⚠️ **Rules:**
- Cannot delete if has products
- Cannot delete if has subcategories
- Must move/delete all children first

---

## 🎨 Frontend Category Selector (Manager)

When creating product, show cascading dropdowns:

```jsx
<FormGroup>
  <Label>Main Category *</Label>
  <Select
    options={level0Categories}
    onChange={(cat) => {
      setSelectedCategory(cat);
      loadSubcategories(cat.value);
    }}
  />
</FormGroup>

<FormGroup>
  <Label>Subcategory *</Label>
  <Select
    options={level1Categories}
    onChange={(cat) => {
      setSelectedSubcategory(cat);
      loadBrands(cat.value);
    }}
    disabled={!selectedCategory}
  />
</FormGroup>

<FormGroup>
  <Label>Brand/Type</Label>
  <Select
    options={level2Categories}
    onChange={(cat) => setSelectedBrand(cat)}
    disabled={!selectedSubcategory}
  />
</FormGroup>
```

---

## 📱 User Mobile App Category Navigation

**Level 0 - Main Menu:**
```
┌────────────────────┐
│ 🍖 Food            │
│ 🎾 Toys            │
│ 🎀 Accessories     │
│ 💅 Grooming        │
│ 🏥 Healthcare      │
└────────────────────┘
```

**Level 1 - Subcategories:**
```
← Food
┌────────────────────┐
│ 🐕 Dog Food        │
│ 🐱 Cat Food        │
│ 🦜 Bird Food       │
│ 🐠 Fish Food       │
└────────────────────┘
```

**Level 2 - Brands:**
```
← Dog Food
┌────────────────────┐
│ Pedigree           │
│ Royal Canin        │
│ Drools             │
│ Purina             │
└────────────────────┘
```

---

## 🔄 Complete Setup Script

```javascript
// Run this after server starts to create initial categories

const setupCategories = async () => {
  // Level 0: Food
  const food = await createCategory({
    name: "Food",
    slug: "food",
    description: "Pet food for all pets",
    parent: null
  });

  // Level 1: Dog Food
  const dogFood = await createCategory({
    name: "Dog Food",
    slug: "dog-food",
    parent: food._id
  });

  // Level 2: Brands
  await createCategory({
    name: "Pedigree",
    slug: "pedigree",
    parent: dogFood._id
  });

  await createCategory({
    name: "Royal Canin",
    slug: "royal-canin",
    parent: dogFood._id
  });

  // Repeat for other categories...
};
```

---

## ✅ Key Features

1. **Unlimited Levels** - Support for 3+ levels if needed
2. **Auto Level Calculation** - Level auto-set based on parent
3. **Breadcrumb Support** - Full navigation path
4. **Product Count Tracking** - Real-time product counts
5. **SEO Optimized** - Meta tags for each category
6. **Display Ordering** - Custom sort order
7. **Cascading Status** - Inactive parent hides children
8. **Safe Deletion** - Prevents deletion if has products/children

---

**Manager adds products. Users browse seamlessly. Admin monitors everything!** 🚀
