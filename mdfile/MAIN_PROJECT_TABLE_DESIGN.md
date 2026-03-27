# 4.5 TABLE DESIGN - MAIN PROJECT

## 4.5.1 Tbl_Users
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique identifier for each user | Primary Key (PK), Auto Generated |
| 2 | name | VARCHAR(100) | Full name of the user | NOT NULL |
| 3 | email | VARCHAR(150) | Email used for login | NOT NULL, Unique |
| 4 | password | VARCHAR(255) | Encrypted user password | NOT NULL |
| 5 | role | VARCHAR(50) | Role assigned to the user | ENUM ('admin', 'super_admin', 'adoption_manager', 'petshop_manager', 'ecommerce_manager', 'veterinary_manager', 'temporary_manager', 'pharmacy_manager', 'user') |
| 6 | phone | VARCHAR(15) | Contact number | NOT NULL |
| 7 | address | TEXT | Residential address with city, state, pincode | NOT NULL |
| 8 | storeName | VARCHAR(100) | Store name for managers | NULL |
| 9 | isActive | BOOLEAN | Account status | DEFAULT TRUE |
| 10 | profileImage | VARCHAR(255) | Profile image URL | NULL |
| 11 | adoptionProfile | JSON | User's adoption preferences and lifestyle | NULL |
| 12 | created_at | DATETIME | Timestamp when user was registered | Timestamp |
| 13 | updated_at | DATETIME | Timestamp of last update | Timestamp |

## 4.5.2 Tbl_Pets
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique identifier for each pet | Primary Key (PK) |
| 2 | name | VARCHAR(100) | Pet's name | NOT NULL |
| 3 | species | VARCHAR(50) | Pet species (Dog, Cat, Bird, etc.) | NOT NULL |
| 4 | breed | VARCHAR(100) | Pet breed | NOT NULL |
| 5 | age | INT | Pet age in months | NOT NULL |
| 6 | gender | VARCHAR(10) | Pet gender | ENUM ('Male', 'Female') |
| 7 | size | VARCHAR(20) | Pet size category | ENUM ('Small', 'Medium', 'Large') |
| 8 | color | VARCHAR(50) | Pet color/markings | NOT NULL |
| 9 | weight | DECIMAL(5,2) | Pet weight in kg | NULL |
| 10 | description | TEXT | Detailed pet description | NOT NULL |
| 11 | images | JSON | Array of image URLs | NOT NULL |
| 12 | module | VARCHAR(30) | Module pet belongs to | ENUM ('adoption', 'petshop', 'veterinary') |
| 13 | status | VARCHAR(30) | Current pet status | ENUM ('available', 'pending', 'adopted', 'sold', 'reserved') |
| 14 | managerId | ObjectId | Manager who added the pet | Foreign Key (FK) |
| 15 | compatibilityProfile | JSON | AI compatibility scores and traits | NULL |
| 16 | medicalHistory | JSON | Medical records and vaccinations | NULL |
| 17 | price | DECIMAL(10,2) | Pet price (for petshop module) | NULL |
| 18 | blockchainHash | VARCHAR(255) | Blockchain tracking hash | NULL |
| 19 | created_at | DATETIME | Pet registration timestamp | Timestamp |
| 20 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.3 Tbl_Adoption_Applications
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique application identifier | Primary Key (PK) |
| 2 | userId | ObjectId | User who applied | Foreign Key (FK) |
| 3 | petId | ObjectId | Pet being adopted | Foreign Key (FK) |
| 4 | managerId | ObjectId | Adoption manager handling case | Foreign Key (FK) |
| 5 | applicationData | JSON | Complete application form data | NOT NULL |
| 6 | status | VARCHAR(30) | Application status | ENUM ('pending', 'under_review', 'approved', 'rejected', 'completed') |
| 7 | aiMatchScore | DECIMAL(5,2) | AI compatibility score (0-100) | NULL |
| 8 | aiRecommendations | JSON | AI matching insights and warnings | NULL |
| 9 | successProbability | DECIMAL(3,2) | AI predicted success rate (0-1) | NULL |
| 10 | documents | JSON | Uploaded document URLs | NULL |
| 11 | paymentStatus | VARCHAR(20) | Payment status | ENUM ('pending', 'paid', 'failed', 'refunded') |
| 12 | paymentId | VARCHAR(100) | Razorpay payment ID | NULL |
| 13 | adoptionFee | DECIMAL(10,2) | Adoption fee amount | NOT NULL |
| 14 | handoverDate | DATETIME | Scheduled handover date | NULL |
| 15 | handoverOTP | VARCHAR(6) | OTP for handover verification | NULL |
| 16 | notes | TEXT | Manager notes and comments | NULL |
| 17 | created_at | DATETIME | Application submission time | Timestamp |
| 18 | updated_at | DATETIME | Last status update time | Timestamp |

## 4.5.4 Tbl_Products
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique product identifier | Primary Key (PK) |
| 2 | name | VARCHAR(200) | Product name | NOT NULL |
| 3 | description | TEXT | Detailed product description | NOT NULL |
| 4 | category | VARCHAR(100) | Product category | NOT NULL |
| 5 | subcategory | VARCHAR(100) | Product subcategory | NULL |
| 6 | brand | VARCHAR(100) | Product brand | NOT NULL |
| 7 | price | DECIMAL(10,2) | Product price | NOT NULL |
| 8 | discountPrice | DECIMAL(10,2) | Discounted price | NULL |
| 9 | images | JSON | Array of product image URLs | NOT NULL |
| 10 | specifications | JSON | Product specifications and features | NULL |
| 11 | petType | VARCHAR(50) | Suitable pet type | ENUM ('Dog', 'Cat', 'Bird', 'Fish', 'All') |
| 12 | breed | VARCHAR(100) | Specific breed compatibility | NULL |
| 13 | ageGroup | VARCHAR(50) | Suitable age group | ENUM ('Puppy', 'Adult', 'Senior', 'All') |
| 14 | inventory | JSON | Stock quantity and management data | NOT NULL |
| 15 | tags | JSON | Search tags and keywords | NULL |
| 16 | rating | DECIMAL(2,1) | Average product rating | DEFAULT 0 |
| 17 | reviewCount | INT | Number of reviews | DEFAULT 0 |
| 18 | isFeatured | BOOLEAN | Featured product flag | DEFAULT FALSE |
| 19 | isBestseller | BOOLEAN | Bestseller flag | DEFAULT FALSE |
| 20 | managerId | ObjectId | Ecommerce manager who added product | Foreign Key (FK) |
| 21 | aiMetrics | JSON | AI-generated metrics and predictions | NULL |
| 22 | created_at | DATETIME | Product creation timestamp | Timestamp |
| 23 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.5 Tbl_Orders
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique order identifier | Primary Key (PK) |
| 2 | orderNumber | VARCHAR(50) | Human-readable order number | NOT NULL, Unique |
| 3 | userId | ObjectId | User who placed the order | Foreign Key (FK) |
| 4 | items | JSON | Array of ordered items with quantities | NOT NULL |
| 5 | totalAmount | DECIMAL(10,2) | Total order amount | NOT NULL |
| 6 | discountAmount | DECIMAL(10,2) | Total discount applied | DEFAULT 0 |
| 7 | shippingAmount | DECIMAL(10,2) | Shipping charges | DEFAULT 0 |
| 8 | finalAmount | DECIMAL(10,2) | Final payable amount | NOT NULL |
| 9 | paymentMethod | VARCHAR(50) | Payment method used | ENUM ('razorpay', 'cod', 'wallet') |
| 10 | paymentId | VARCHAR(100) | Payment gateway transaction ID | NULL |
| 11 | paymentStatus | VARCHAR(20) | Payment status | ENUM ('pending', 'paid', 'failed', 'refunded') |
| 12 | orderStatus | VARCHAR(30) | Order fulfillment status | ENUM ('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') |
| 13 | shippingAddress | JSON | Delivery address details | NOT NULL |
| 14 | trackingNumber | VARCHAR(100) | Shipping tracking number | NULL |
| 15 | estimatedDelivery | DATETIME | Expected delivery date | NULL |
| 16 | deliveredAt | DATETIME | Actual delivery timestamp | NULL |
| 17 | notes | TEXT | Order notes and special instructions | NULL |
| 18 | created_at | DATETIME | Order placement timestamp | Timestamp |
| 19 | updated_at | DATETIME | Last status update timestamp | Timestamp |

## 4.5.6 Tbl_Veterinary_Records
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique record identifier | Primary Key (PK) |
| 2 | petId | ObjectId | Pet being treated | Foreign Key (FK) |
| 3 | ownerId | ObjectId | Pet owner | Foreign Key (FK) |
| 4 | veterinarianId | ObjectId | Attending veterinarian | Foreign Key (FK) |
| 5 | managerId | ObjectId | Veterinary manager | Foreign Key (FK) |
| 6 | visitType | VARCHAR(50) | Type of visit | ENUM ('checkup', 'vaccination', 'treatment', 'surgery', 'emergency') |
| 7 | symptoms | TEXT | Reported symptoms | NULL |
| 8 | diagnosis | TEXT | Veterinarian's diagnosis | NOT NULL |
| 9 | treatment | TEXT | Prescribed treatment | NOT NULL |
| 10 | medications | JSON | Prescribed medications with dosage | NULL |
| 11 | vaccinations | JSON | Administered vaccinations | NULL |
| 12 | nextVisitDate | DATETIME | Scheduled follow-up date | NULL |
| 13 | cost | DECIMAL(10,2) | Treatment cost | NOT NULL |
| 14 | paymentStatus | VARCHAR(20) | Payment status | ENUM ('pending', 'paid', 'partial') |
| 15 | documents | JSON | Medical reports and test results | NULL |
| 16 | notes | TEXT | Additional notes | NULL |
| 17 | created_at | DATETIME | Record creation timestamp | Timestamp |
| 18 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.7 Tbl_Temporary_Care_Bookings
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique booking identifier | Primary Key (PK) |
| 2 | userId | ObjectId | Pet owner making booking | Foreign Key (FK) |
| 3 | managerId | ObjectId | Temporary care manager | Foreign Key (FK) |
| 4 | pets | JSON | Array of pets being boarded | NOT NULL |
| 5 | checkInDate | DATETIME | Boarding start date | NOT NULL |
| 6 | checkOutDate | DATETIME | Boarding end date | NOT NULL |
| 7 | duration | INT | Total days of boarding | NOT NULL |
| 8 | serviceType | VARCHAR(50) | Type of care service | ENUM ('daycare', 'boarding', 'grooming', 'training') |
| 9 | specialRequirements | TEXT | Special care instructions | NULL |
| 10 | assignedCaregiver | ObjectId | Assigned caregiver | Foreign Key (FK) |
| 11 | dailyRate | DECIMAL(8,2) | Daily rate per pet | NOT NULL |
| 12 | totalAmount | DECIMAL(10,2) | Total booking amount | NOT NULL |
| 13 | paymentStatus | VARCHAR(20) | Payment status | ENUM ('pending', 'paid', 'partial') |
| 14 | bookingStatus | VARCHAR(30) | Booking status | ENUM ('confirmed', 'checked_in', 'in_progress', 'checked_out', 'completed', 'cancelled') |
| 15 | checkInOTP | VARCHAR(6) | OTP for check-in verification | NULL |
| 16 | checkOutOTP | VARCHAR(6) | OTP for check-out verification | NULL |
| 17 | activityLog | JSON | Daily activity reports | NULL |
| 18 | notes | TEXT | Booking notes and updates | NULL |
| 19 | created_at | DATETIME | Booking creation timestamp | Timestamp |
| 20 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.8 Tbl_Pharmacy_Inventory
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique medication identifier | Primary Key (PK) |
| 2 | name | VARCHAR(200) | Medication name | NOT NULL |
| 3 | genericName | VARCHAR(200) | Generic medication name | NULL |
| 4 | brand | VARCHAR(100) | Manufacturer brand | NOT NULL |
| 5 | category | VARCHAR(100) | Medication category | NOT NULL |
| 6 | dosageForm | VARCHAR(50) | Form of medication | ENUM ('tablet', 'capsule', 'liquid', 'injection', 'topical') |
| 7 | strength | VARCHAR(50) | Medication strength/concentration | NOT NULL |
| 8 | petType | VARCHAR(50) | Suitable for pet type | ENUM ('Dog', 'Cat', 'Bird', 'All') |
| 9 | description | TEXT | Medication description and usage | NOT NULL |
| 10 | price | DECIMAL(8,2) | Unit price | NOT NULL |
| 11 | stockQuantity | INT | Available stock quantity | NOT NULL |
| 12 | reorderLevel | INT | Minimum stock level | NOT NULL |
| 13 | expiryDate | DATE | Medication expiry date | NOT NULL |
| 14 | batchNumber | VARCHAR(50) | Manufacturing batch number | NOT NULL |
| 15 | prescriptionRequired | BOOLEAN | Requires prescription flag | DEFAULT TRUE |
| 16 | sideEffects | TEXT | Known side effects | NULL |
| 17 | contraindications | TEXT | Contraindications and warnings | NULL |
| 18 | storageInstructions | TEXT | Storage requirements | NULL |
| 19 | managerId | ObjectId | Pharmacy manager | Foreign Key (FK) |
| 20 | created_at | DATETIME | Inventory addition timestamp | Timestamp |
| 21 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.9 Tbl_AI_Predictions
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique prediction identifier | Primary Key (PK) |
| 2 | userId | ObjectId | User for whom prediction was made | Foreign Key (FK) |
| 3 | petId | ObjectId | Pet involved in prediction | Foreign Key (FK) |
| 4 | predictionType | VARCHAR(50) | Type of AI prediction | ENUM ('adoption_match', 'breed_identification', 'demand_forecast', 'product_recommendation') |
| 5 | inputData | JSON | Input data used for prediction | NOT NULL |
| 6 | predictions | JSON | AI model predictions and scores | NOT NULL |
| 7 | confidence | DECIMAL(5,2) | Prediction confidence score | NOT NULL |
| 8 | modelVersion | VARCHAR(50) | AI model version used | NOT NULL |
| 9 | processingTime | DECIMAL(6,3) | Prediction processing time in seconds | NOT NULL |
| 10 | accuracy | DECIMAL(5,2) | Model accuracy for this prediction type | NULL |
| 11 | feedback | JSON | User feedback on prediction quality | NULL |
| 12 | created_at | DATETIME | Prediction timestamp | Timestamp |

## 4.5.10 Tbl_Blockchain_Blocks
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique block identifier | Primary Key (PK) |
| 2 | blockId | VARCHAR(100) | Blockchain block ID | NOT NULL, Unique |
| 3 | previousHash | VARCHAR(255) | Hash of previous block | NULL |
| 4 | currentHash | VARCHAR(255) | Current block hash (SHA-256) | NOT NULL |
| 5 | timestamp | DATETIME | Block creation timestamp | NOT NULL |
| 6 | eventType | VARCHAR(50) | Type of event recorded | ENUM ('pet_registration', 'adoption_application', 'status_change', 'handover_complete') |
| 7 | petId | ObjectId | Pet involved in the event | Foreign Key (FK) |
| 8 | userId | ObjectId | User involved in the event | Foreign Key (FK) |
| 9 | eventData | JSON | Detailed event information | NOT NULL |
| 10 | isValid | BOOLEAN | Block validation status | DEFAULT TRUE |
| 11 | created_at | DATETIME | Block creation timestamp | Timestamp |