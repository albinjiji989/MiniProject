# 🗂️ Petshop Module: Blockchain Domain Model (DOM)

This document summarizes all the key domain objects (DOM) and blockchain-related entities in the Petshop module, including their relationships and blockchain event coverage.

---

## 1. PetshopBlockchainBlock (Blockchain Ledger)
- **Purpose:** Stores every tamper-proof event in the petshop module.
- **Fields:**
  - `blockHash`: SHA256 hash of block data + previous hash
  - `previousHash`: Hash of previous block
  - `timestamp`: Event time
  - `eventType`: (e.g., pet_created, batch_created, reserved, sold, ownership_transferred, etc.)
  - `eventData`: Object with event-specific data (petId, batchId, userId, status, etc.)
  - `documentHashes`: Array of hashes for off-chain docs (optional)

---

## 2. PetInventoryItem
- **Purpose:** Represents an individual pet in the petshop inventory.
- **Blockchain Events:**
  - `petCode_generated`
  - `pet_created`
  - `pet_reserved`
  - `pet_sold`
  - `ownership_transferred`
  - `status_changed`

---

## 3. PetBatch
- **Purpose:** Represents a batch of pets (e.g., litter or group arrival).
- **Blockchain Events:**
  - `batch_created`
  - `batch_published`
  - `batch_archived`
  - `custody_transfer`

---

## 4. Reservation
- **Purpose:** Tracks reservation of pets by users.
- **Blockchain Events:**
  - `pet_reserved`
  - `reservation_confirmed`
  - `reservation_released`

---

## 5. Sale / Purchase
- **Purpose:** Represents the sale of a pet to a user.
- **Blockchain Events:**
  - `pet_sold`
  - `ownership_transferred`
  - `registry_ownership_transfer`

---

## 6. PetRegistry
- **Purpose:** Central registry for all pets, tracking current and historical ownership.
- **Blockchain Events:**
  - `registry_ownership_transfer`
  - `status_changed`

---

## 7. Manager
- **Purpose:** Authenticated user who can add pets, manage inventory, and approve reservations.
- **Blockchain Events:**
  - All manager actions are logged with manager ID in eventData.

---

## 8. User
- **Purpose:** End-user who can reserve, purchase, and own pets.
- **Blockchain Events:**
  - All user actions (reservation, purchase, transfer) are logged with user ID in eventData.

---

## 9. Blockchain API Endpoints
- `/blockchain/pet/:petId` — Get blockchain event history for a pet
- `/blockchain/verify` — Verify blockchain integrity
- `/blockchain/stats` — Get blockchain analytics

---

## 10. Event Types (Summary)
- `petCode_generated`, `pet_created`, `batch_created`, `batch_published`, `batch_archived`, `pet_reserved`, `reservation_confirmed`, `reservation_released`, `pet_sold`, `ownership_transferred`, `registry_ownership_transfer`, `status_changed`, `custody_transfer`

---

**All these domain objects and events are cryptographically linked and auditable via the blockchain ledger.**
