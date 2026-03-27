# 4.5 TABLE DESIGN - MAIN PROJECT COMPREHENSIVE

## Overview
This document outlines the comprehensive table design for the PetConnect Main Project, featuring 10 core tables that support all modules including Adoption, PetShop, E-commerce, Veterinary Care, Temporary Care, Pharmacy, AI/ML predictions, and Blockchain integration.

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
| 11 | adoptionProfile | JSON | User's adoption preferences and lifestyle data | NULL |
| 12 | aiPreferences | JSON | AI-learned user preferences and behavior patterns | NULL |
| 13 | walletBalance | DECIMAL(10,2) | User wallet balance | DEFAULT 0.00 |
| 14 | loyaltyPoints | INT | Loyalty points earned | DEFAULT 0 |
| 15 | created_at | DATETIME | Timestamp when user was registered | Timestamp |
| 16 | updated_at | DATETIME | Timestamp of last update | Timestamp |

## 4.5.2 Tbl_Pet_Registry
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique identifier for each pet | Primary Key (PK) |
| 2 | petCode | VARCHAR(20) | Unique pet identification code | NOT NULL, Unique |
| 3 | name | VARCHAR(100) | Pet's name | NOT NULL |
| 4 | species | VARCHAR(50) | Pet species (Dog, Cat, Bird, etc.) | NOT NULL |
| 5 | breed | VARCHAR(100) | Pet breed | NOT NULL |
| 6 | age | INT | Pet age in months | NOT NULL |
| 7 | gender | VARCHAR(10) | Pet gender | ENUM ('Male', 'Female') |
| 8 | size | VARCHAR(20) | Pet size category | ENUM ('Small', 'Medium', 'Large') |
| 9 | color | VARCHAR(50) | Pet color/markings | NOT NULL |
| 10 | weight | DECIMAL(5,2) | Pet weight in kg | NULL |
| 11 | description | TEXT | Detailed pet description | NOT NULL |
| 12 | images | JSON | Array of image URLs | NOT NULL |
| 13 | module | VARCHAR(30) | Module pet belongs to | ENUM ('adoption', 'petshop', 'veterinary', 'temporary_care') |
| 14 | status | VARCHAR(30) | Current pet status | ENUM ('available', 'pending', 'adopted', 'sold', 'reserved', 'in_care', 'medical_treatment') |
| 15 | managerId | ObjectId | Manager who added the pet | Foreign Key (FK) |
| 16 | ownerId | ObjectId | Current pet owner | Foreign Key (FK) |
| 17 | compatibilityProfile | JSON | AI compatibility scores and personality traits | NULL |
| 18 | medicalHistory | JSON | Complete medical records and vaccinations | NULL |
| 19 | price | DECIMAL(10,2) | Pet price (for petshop module) | NULL |
| 20 | aiBreedConfidence | DECIMAL(5,2) | AI breed identification confidence score | NULL |
| 21 | personalityCluster | VARCHAR(50) | AI-determined personality cluster | NULL |
| 22 | blockchainHash | VARCHAR(255) | Blockchain tracking hash | NULL |
| 23 | created_at | DATETIME | Pet registration timestamp | Timestamp |
| 24 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.3 Tbl_Products
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique product identifier | Primary Key (PK) |
| 2 | productCode | VARCHAR(20) | Unique product code | NOT NULL, Unique |
| 3 | name | VARCHAR(200) | Product name | NOT NULL |
| 4 | description | TEXT | Detailed product description | NOT NULL |
| 5 | category | VARCHAR(100) | Product category | NOT NULL |
| 6 | subcategory | VARCHAR(100) | Product subcategory | NULL |
| 7 | brand | VARCHAR(100) | Product brand | NOT NULL |
| 8 | price | DECIMAL(10,2) | Product price | NOT NULL |
| 9 | discountPrice | DECIMAL(10,2) | Discounted price | NULL |
| 10 | images | JSON | Array of product image URLs | NOT NULL |
| 11 | specifications | JSON | Product specifications and features | NULL |
| 12 | petType | VARCHAR(50) | Suitable pet type | ENUM ('Dog', 'Cat', 'Bird', 'Fish', 'All') |
| 13 | breedCompatibility | JSON | Compatible breeds array | NULL |
| 14 | ageGroup | VARCHAR(50) | Suitable age group | ENUM ('Puppy', 'Adult', 'Senior', 'All') |
| 15 | stockQuantity | INT | Current stock quantity | NOT NULL |
| 16 | reorderLevel | INT | Minimum stock level for reorder | NOT NULL |
| 17 | tags | JSON | Search tags and keywords | NULL |
| 18 | rating | DECIMAL(2,1) | Average product rating | DEFAULT 0 |
| 19 | reviewCount | INT | Number of reviews | DEFAULT 0 |
| 20 | isFeatured | BOOLEAN | Featured product flag | DEFAULT FALSE |
| 21 | isBestseller | BOOLEAN | Bestseller flag | DEFAULT FALSE |
| 22 | managerId | ObjectId | Ecommerce manager who added product | Foreign Key (FK) |
| 23 | aiDemandForecast | JSON | AI-generated demand predictions | NULL |
| 24 | aiRecommendationScore | DECIMAL(5,2) | AI recommendation relevance score | NULL |
| 25 | seasonalityData | JSON | Seasonal demand patterns | NULL |
| 26 | created_at | DATETIME | Product creation timestamp | Timestamp |
| 27 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.4 Tbl_Orders
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique order identifier | Primary Key (PK) |
| 2 | orderNumber | VARCHAR(50) | Human-readable order number | NOT NULL, Unique |
| 3 | userId | ObjectId | User who placed the order | Foreign Key (FK) |
| 4 | items | JSON | Array of ordered items with quantities and prices | NOT NULL |
| 5 | subtotalAmount | DECIMAL(10,2) | Subtotal before discounts | NOT NULL |
| 6 | discountAmount | DECIMAL(10,2) | Total discount applied | DEFAULT 0 |
| 7 | taxAmount | DECIMAL(10,2) | Tax amount | DEFAULT 0 |
| 8 | shippingAmount | DECIMAL(10,2) | Shipping charges | DEFAULT 0 |
| 9 | finalAmount | DECIMAL(10,2) | Final payable amount | NOT NULL |
| 10 | paymentMethod | VARCHAR(50) | Payment method used | ENUM ('razorpay', 'cod', 'wallet', 'upi') |
| 11 | paymentId | VARCHAR(100) | Payment gateway transaction ID | NULL |
| 12 | paymentStatus | VARCHAR(20) | Payment status | ENUM ('pending', 'paid', 'failed', 'refunded', 'partial') |
| 13 | orderStatus | VARCHAR(30) | Order fulfillment status | ENUM ('placed', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned') |
| 14 | shippingAddress | JSON | Complete delivery address details | NOT NULL |
| 15 | billingAddress | JSON | Billing address details | NOT NULL |
| 16 | trackingNumber | VARCHAR(100) | Shipping tracking number | NULL |
| 17 | courierPartner | VARCHAR(100) | Delivery partner name | NULL |
| 18 | estimatedDelivery | DATETIME | Expected delivery date | NULL |
| 19 | deliveredAt | DATETIME | Actual delivery timestamp | NULL |
| 20 | aiRecommendations | JSON | AI-suggested related products | NULL |
| 21 | loyaltyPointsEarned | INT | Loyalty points earned from this order | DEFAULT 0 |
| 22 | notes | TEXT | Order notes and special instructions | NULL |
| 23 | created_at | DATETIME | Order placement timestamp | Timestamp |
| 24 | updated_at | DATETIME | Last status update timestamp | Timestamp |

## 4.5.5 Tbl_Adoption_Applications
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique application identifier | Primary Key (PK) |
| 2 | applicationNumber | VARCHAR(50) | Human-readable application number | NOT NULL, Unique |
| 3 | userId | ObjectId | User who applied | Foreign Key (FK) |
| 4 | petId | ObjectId | Pet being adopted | Foreign Key (FK) |
| 5 | managerId | ObjectId | Adoption manager handling case | Foreign Key (FK) |
| 6 | applicationData | JSON | Complete application form data | NOT NULL |
| 7 | status | VARCHAR(30) | Application status | ENUM ('pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled') |
| 8 | aiMatchScore | DECIMAL(5,2) | AI compatibility score (0-100) | NULL |
| 9 | aiRecommendations | JSON | AI matching insights and warnings | NULL |
| 10 | successProbability | DECIMAL(3,2) | AI predicted success rate (0-1) | NULL |
| 11 | compatibilityBreakdown | JSON | Detailed compatibility analysis | NULL |
| 12 | documents | JSON | Uploaded document URLs and verification status | NULL |
| 13 | paymentStatus | VARCHAR(20) | Payment status | ENUM ('pending', 'paid', 'failed', 'refunded') |
| 14 | paymentId | VARCHAR(100) | Razorpay payment ID | NULL |
| 15 | adoptionFee | DECIMAL(10,2) | Adoption fee amount | NOT NULL |
| 16 | handoverDate | DATETIME | Scheduled handover date | NULL |
| 17 | handoverOTP | VARCHAR(6) | OTP for handover verification | NULL |
| 18 | handoverStatus | VARCHAR(20) | Handover completion status | ENUM ('pending', 'completed', 'failed') |
| 19 | followUpSchedule | JSON | Post-adoption follow-up schedule | NULL |
| 20 | blockchainHash | VARCHAR(255) | Blockchain event hash | NULL |
| 21 | notes | TEXT | Manager notes and comments | NULL |
| 22 | created_at | DATETIME | Application submission time | Timestamp |
| 23 | updated_at | DATETIME | Last status update time | Timestamp |

## 4.5.6 Tbl_Veterinary_Records
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique record identifier | Primary Key (PK) |
| 2 | recordNumber | VARCHAR(50) | Human-readable record number | NOT NULL, Unique |
| 3 | petId | ObjectId | Pet being treated | Foreign Key (FK) |
| 4 | ownerId | ObjectId | Pet owner | Foreign Key (FK) |
| 5 | veterinarianId | ObjectId | Attending veterinarian | Foreign Key (FK) |
| 6 | managerId | ObjectId | Veterinary manager | Foreign Key (FK) |
| 7 | appointmentId | ObjectId | Related appointment | Foreign Key (FK) |
| 8 | visitType | VARCHAR(50) | Type of visit | ENUM ('checkup', 'vaccination', 'treatment', 'surgery', 'emergency', 'follow_up') |
| 9 | symptoms | TEXT | Reported symptoms | NULL |
| 10 | vitalSigns | JSON | Temperature, weight, heart rate, etc. | NULL |
| 11 | diagnosis | TEXT | Veterinarian's diagnosis | NOT NULL |
| 12 | treatment | TEXT | Prescribed treatment plan | NOT NULL |
| 13 | medications | JSON | Prescribed medications with dosage and duration | NULL |
| 14 | vaccinations | JSON | Administered vaccinations with dates | NULL |
| 15 | labTests | JSON | Laboratory test results | NULL |
| 16 | nextVisitDate | DATETIME | Scheduled follow-up date | NULL |
| 17 | cost | DECIMAL(10,2) | Total treatment cost | NOT NULL |
| 18 | paymentStatus | VARCHAR(20) | Payment status | ENUM ('pending', 'paid', 'partial', 'insurance_claimed') |
| 19 | paymentId | VARCHAR(100) | Payment transaction ID | NULL |
| 20 | documents | JSON | Medical reports, X-rays, test results URLs | NULL |
| 21 | aiHealthInsights | JSON | AI-generated health predictions and recommendations | NULL |
| 22 | riskAssessment | VARCHAR(50) | AI risk assessment | ENUM ('low', 'medium', 'high', 'critical') |
| 23 | notes | TEXT | Additional veterinarian notes | NULL |
| 24 | created_at | DATETIME | Record creation timestamp | Timestamp |
| 25 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.7 Tbl_Temporary_Care_Bookings
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique booking identifier | Primary Key (PK) |
| 2 | bookingNumber | VARCHAR(50) | Human-readable booking number | NOT NULL, Unique |
| 3 | userId | ObjectId | Pet owner making booking | Foreign Key (FK) |
| 4 | managerId | ObjectId | Temporary care manager | Foreign Key (FK) |
| 5 | pets | JSON | Array of pets being boarded with details | NOT NULL |
| 6 | checkInDate | DATETIME | Boarding start date and time | NOT NULL |
| 7 | checkOutDate | DATETIME | Boarding end date and time | NOT NULL |
| 8 | duration | INT | Total days of boarding | NOT NULL |
| 9 | serviceType | VARCHAR(50) | Type of care service | ENUM ('daycare', 'boarding', 'grooming', 'training', 'medical_boarding') |
| 10 | packageType | VARCHAR(50) | Service package selected | ENUM ('basic', 'premium', 'luxury', 'medical') |
| 11 | specialRequirements | TEXT | Special care instructions and dietary needs | NULL |
| 12 | assignedCaregiver | ObjectId | Primary assigned caregiver | Foreign Key (FK) |
| 13 | backupCaregiver | ObjectId | Backup caregiver | Foreign Key (FK) |
| 14 | dailyRate | DECIMAL(8,2) | Daily rate per pet | NOT NULL |
| 15 | additionalServices | JSON | Extra services with costs | NULL |
| 16 | totalAmount | DECIMAL(10,2) | Total booking amount | NOT NULL |
| 17 | advanceAmount | DECIMAL(10,2) | Advance payment amount | DEFAULT 0 |
| 18 | paymentStatus | VARCHAR(20) | Payment status | ENUM ('pending', 'advance_paid', 'fully_paid', 'refunded') |
| 19 | paymentId | VARCHAR(100) | Payment transaction ID | NULL |
| 20 | bookingStatus | VARCHAR(30) | Booking status | ENUM ('confirmed', 'checked_in', 'in_progress', 'checked_out', 'completed', 'cancelled') |
| 21 | checkInOTP | VARCHAR(6) | OTP for check-in verification | NULL |
| 22 | checkOutOTP | VARCHAR(6) | OTP for check-out verification | NULL |
| 23 | activityLog | JSON | Daily activity reports and photos | NULL |
| 24 | healthMonitoring | JSON | Daily health check records | NULL |
| 25 | emergencyContact | JSON | Emergency contact details | NOT NULL |
| 26 | aiCareRecommendations | JSON | AI-suggested care optimizations | NULL |
| 27 | notes | TEXT | Booking notes and updates | NULL |
| 28 | created_at | DATETIME | Booking creation timestamp | Timestamp |
| 29 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.8 Tbl_Pharmacy_Inventory
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique medication identifier | Primary Key (PK) |
| 2 | medicationCode | VARCHAR(20) | Unique medication code | NOT NULL, Unique |
| 3 | name | VARCHAR(200) | Medication name | NOT NULL |
| 4 | genericName | VARCHAR(200) | Generic medication name | NULL |
| 5 | brand | VARCHAR(100) | Manufacturer brand | NOT NULL |
| 6 | category | VARCHAR(100) | Medication category | NOT NULL |
| 7 | therapeuticClass | VARCHAR(100) | Therapeutic classification | NOT NULL |
| 8 | dosageForm | VARCHAR(50) | Form of medication | ENUM ('tablet', 'capsule', 'liquid', 'injection', 'topical', 'powder') |
| 9 | strength | VARCHAR(50) | Medication strength/concentration | NOT NULL |
| 10 | petType | VARCHAR(50) | Suitable for pet type | ENUM ('Dog', 'Cat', 'Bird', 'Fish', 'All') |
| 11 | description | TEXT | Medication description and usage instructions | NOT NULL |
| 12 | indications | TEXT | Medical conditions treated | NOT NULL |
| 13 | price | DECIMAL(8,2) | Unit price | NOT NULL |
| 14 | stockQuantity | INT | Available stock quantity | NOT NULL |
| 15 | reorderLevel | INT | Minimum stock level for reorder | NOT NULL |
| 16 | maxStockLevel | INT | Maximum stock capacity | NOT NULL |
| 17 | expiryDate | DATE | Medication expiry date | NOT NULL |
| 18 | batchNumber | VARCHAR(50) | Manufacturing batch number | NOT NULL |
| 19 | manufacturingDate | DATE | Manufacturing date | NOT NULL |
| 20 | prescriptionRequired | BOOLEAN | Requires prescription flag | DEFAULT TRUE |
| 21 | controlledSubstance | BOOLEAN | Controlled substance flag | DEFAULT FALSE |
| 22 | sideEffects | TEXT | Known side effects and warnings | NULL |
| 23 | contraindications | TEXT | Contraindications and drug interactions | NULL |
| 24 | storageInstructions | TEXT | Storage temperature and conditions | NULL |
| 25 | aiDemandForecast | JSON | AI-predicted demand patterns | NULL |
| 26 | supplierInfo | JSON | Supplier details and contact information | NOT NULL |
| 27 | managerId | ObjectId | Pharmacy manager | Foreign Key (FK) |
| 28 | created_at | DATETIME | Inventory addition timestamp | Timestamp |
| 29 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.9 Tbl_AI_Predictions
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique prediction identifier | Primary Key (PK) |
| 2 | predictionId | VARCHAR(50) | Human-readable prediction ID | NOT NULL, Unique |
| 3 | userId | ObjectId | User for whom prediction was made | Foreign Key (FK) |
| 4 | petId | ObjectId | Pet involved in prediction | Foreign Key (FK) |
| 5 | productId | ObjectId | Product involved in prediction | Foreign Key (FK) |
| 6 | predictionType | VARCHAR(50) | Type of AI prediction | ENUM ('adoption_match', 'breed_identification', 'demand_forecast', 'product_recommendation', 'health_prediction', 'behavior_analysis') |
| 7 | algorithm | VARCHAR(50) | AI algorithm used | ENUM ('content_based', 'collaborative_filtering', 'xgboost', 'mobilenetv2', 'prophet', 'kmeans', 'hybrid_ensemble') |
| 8 | inputData | JSON | Input data used for prediction | NOT NULL |
| 9 | predictions | JSON | AI model predictions and detailed scores | NOT NULL |
| 10 | confidence | DECIMAL(5,2) | Overall prediction confidence score (0-100) | NOT NULL |
| 11 | modelVersion | VARCHAR(50) | AI model version used | NOT NULL |
| 12 | processingTime | DECIMAL(6,3) | Prediction processing time in seconds | NOT NULL |
| 13 | accuracy | DECIMAL(5,2) | Historical model accuracy for this prediction type | NULL |
| 14 | featureImportance | JSON | Feature importance scores for explainability | NULL |
| 15 | alternativePredictions | JSON | Alternative predictions with lower confidence | NULL |
| 16 | feedback | JSON | User feedback on prediction quality | NULL |
| 17 | actualOutcome | JSON | Actual outcome for accuracy measurement | NULL |
| 18 | isActive | BOOLEAN | Whether prediction is still valid | DEFAULT TRUE |
| 19 | expiryDate | DATETIME | When prediction becomes invalid | NULL |
| 20 | created_at | DATETIME | Prediction timestamp | Timestamp |
| 21 | updated_at | DATETIME | Last update timestamp | Timestamp |

## 4.5.10 Tbl_Blockchain_Blocks
**Primary key**: _id

| No. | Field Name | Data Type | Description | Key Constraint |
|-----|------------|-----------|-------------|----------------|
| 1 | _id | ObjectId | Unique block identifier | Primary Key (PK) |
| 2 | blockId | VARCHAR(100) | Blockchain block ID | NOT NULL, Unique |
| 3 | blockHeight | INT | Block position in chain | NOT NULL |
| 4 | previousHash | VARCHAR(255) | Hash of previous block | NULL |
| 5 | currentHash | VARCHAR(255) | Current block hash (SHA-256) | NOT NULL |
| 6 | merkleRoot | VARCHAR(255) | Merkle root of all transactions in block | NOT NULL |
| 7 | timestamp | DATETIME | Block creation timestamp | NOT NULL |
| 8 | nonce | BIGINT | Proof of work nonce value | NOT NULL |
| 9 | difficulty | INT | Mining difficulty level | DEFAULT 1 |
| 10 | eventType | VARCHAR(50) | Type of event recorded | ENUM ('pet_registration', 'adoption_application', 'status_change', 'handover_complete', 'ownership_transfer', 'medical_record', 'vaccination') |
| 11 | petId | ObjectId | Pet involved in the event | Foreign Key (FK) |
| 12 | userId | ObjectId | User involved in the event | Foreign Key (FK) |
| 13 | transactionId | ObjectId | Related transaction/application ID | Foreign Key (FK) |
| 14 | eventData | JSON | Detailed event information and metadata | NOT NULL |
| 15 | digitalSignature | VARCHAR(500) | Digital signature for authenticity | NOT NULL |
| 16 | witnessNodes | JSON | Nodes that witnessed and validated the block | NULL |
| 17 | isValid | BOOLEAN | Block validation status | DEFAULT TRUE |
| 18 | validationErrors | JSON | Any validation errors encountered | NULL |
| 19 | gasUsed | INT | Computational resources used | DEFAULT 0 |
| 20 | blockSize | INT | Block size in bytes | NOT NULL |
| 21 | transactionCount | INT | Number of transactions in block | DEFAULT 1 |
| 22 | created_at | DATETIME | Block creation timestamp | Timestamp |
| 23 | verified_at | DATETIME | Block verification timestamp | NULL |

---

## Table Relationships Summary

### Primary Relationships:
- **Tbl_Users** → **Tbl_Pet_Registry** (managerId, ownerId)
- **Tbl_Users** → **Tbl_Adoption_Applications** (userId, managerId)
- **Tbl_Pet_Registry** → **Tbl_Adoption_Applications** (petId)
- **Tbl_Users** → **Tbl_Orders** (userId)
- **Tbl_Products** → **Tbl_Orders** (items array)
- **Tbl_Pet_Registry** → **Tbl_Veterinary_Records** (petId)
- **Tbl_Users** → **Tbl_Temporary_Care_Bookings** (userId, managerId)
- **Tbl_Users** → **Tbl_AI_Predictions** (userId)
- **Tbl_Pet_Registry** → **Tbl_Blockchain_Blocks** (petId)

### AI/ML Integration Points:
- **Tbl_AI_Predictions** stores all AI model outputs
- **Tbl_Pet_Registry.compatibilityProfile** contains AI compatibility scores
- **Tbl_Products.aiDemandForecast** contains demand predictions
- **Tbl_Adoption_Applications.aiMatchScore** contains compatibility scores
- **Tbl_Veterinary_Records.aiHealthInsights** contains health predictions

### Blockchain Integration:
- **Tbl_Blockchain_Blocks** maintains immutable event records
- All major entities reference blockchain hashes for transparency
- Pet registration, adoption, and ownership changes are blockchain-tracked

This comprehensive table design supports all modules of the PetConnect ecosystem with AI/ML integration, blockchain transparency, and scalable architecture for future enhancements.