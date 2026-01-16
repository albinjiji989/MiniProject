# 🛡️ Petshop Blockchain Security & Auditability Plan (Pinned)

## PetCode Generation Security
- Ensure petCode is generated only by trusted backend logic (never from the client).
- Use a secure, unique, and cryptographically strong petCode generator (already present in code).
- Log every petCode generation event on the blockchain.

## Manager Pet Addition Controls
- Only authenticated managers can add pets.
- Log manager ID, timestamp, and all pet details on the blockchain for every addition.
- Prevent duplicate or reused petCodes by enforcing uniqueness in both DB and blockchain.

## Ownership Tracking
- Every pet sale or transfer updates the blockchain with new owner info.
- Track the full chain of custody (from petshop to user, and any further transfers).

## Anti-Fraud & Security
- Expose verification endpoints in the frontend so users can check a pet’s blockchain history and ownership before buying.
- Add alerts for any blockchain verification failures or hash-chain breaks.
- Require blockchain verification before allowing critical actions (e.g., transfer, review, payment).

## Audit & Transparency
- Provide an admin dashboard to view all blockchain events, search by petCode, user, or event type.
- Allow users to download a blockchain-backed certificate of authenticity for their pet.

## Data Privacy
- Ensure sensitive user data is not stored in blockchain eventData (store only references/IDs).

## Frontend Integration
- Show blockchain status (verified/unverified) on pet detail pages.
- Allow users to view the full blockchain event history for any pet they own.

## Backup & Recovery
- Regularly back up the blockchain ledger collection.
- Document recovery procedures for blockchain data.

## Legal & Compliance
- Ensure all blockchain records comply with local data protection and animal welfare laws.
# Petshop Module Minimal Blockchain Plan


while creating blockchain in the petshop module, do not delete existing code and functions from the petshop module 
## Key Goals & Actions

### Prevent Fake Inventory and Sales
- Use a simple blockchain ledger (MongoDB hash-chain) to make all petshop events tamper-proof and verifiable.

### Track Each Pet and Its Ownership
- Record every pet addition, status change, and sale event, linking each pet to its real owner.

### Immutable Pet & Batch Identity
- Create a blockchain record for each pet and batch when added.
- Track all status changes (created, available, reserved, sold).

### Transparent Reservation and Purchase Tracking
- Record every reservation and purchase event, including status changes, on the blockchain.

### Expose Verification
- Provide API endpoints to verify a pet’s provenance, batch, and ownership history.

### Show Blockchain Status in UI
- Let users and managers view blockchain-backed petshop history and verification status for each pet.

---

## Implementation Steps

### 1. Blockchain Ledger Setup
- Create a MongoDB collection (e.g., `petshop_blockchain_ledger`).
- Each block should include:
  - Block hash (SHA256 of block data + previous hash)
  - Previous block hash
  - Timestamp
  - Event type (pet_created, batch_created, status_changed, reserved, sold, etc.)
  - Event data (pet/batch/user IDs, status, details)
  - Optional: Hashes of off-chain documents (images, certificates)

### 2. Backend Integration
- On each key event (pet/batch created, status changed, reserved, sold):
  - Write a new block to the blockchain ledger collection.
  - Calculate and store the block hash and previous hash.
- Expose API endpoints to:
  - Verify pet/batch/ownership history (by traversing the hash-chain for a pet or batch).
  - List all blockchain events for a pet, batch, or user.

### 3. Frontend Updates
- Show blockchain verification status for each pet and sale event.
- Allow users/managers to view petshop history (blockchain-backed) in the UI.

---

## Example Block Schema (MongoDB)
```json
{
  "_id": ObjectId,
  "blockHash": "...",
  "previousHash": "...",
  "timestamp": ISODate,
  "eventType": "pet_created", // or batch_created, status_changed, reserved, sold
  "eventData": {
    "petId": "...",
    "batchId": "...",
    "userId": "...",
    "status": "available",
    // ...other relevant fields
  },
  "documentHashes": ["..."], // optional
}
```

---

## Step-by-Step Implementation

1. **Design the blockchain ledger schema**
   - Define the MongoDB collection and block structure as above.

2. **Implement backend blockchain service**
   - Create functions to add a new block for each event.
   - Ensure each block includes the hash of the previous block (hash-chain).
   - Use SHA256 for hashing block data + previous hash.

3. **Integrate with petshop flows**
   - On pet or batch creation, status change, reservation, or sale, call the blockchain service to write a new block.

4. **Add verification endpoints**
   - API to fetch and verify the full blockchain history for a pet, batch, or user.
   - API to check the integrity of the hash-chain for a given pet or batch.

5. **Update frontend for blockchain status**
   - Display blockchain verification status and history for each pet and sale event.
   - Allow users/managers to view blockchain-backed petshop history.

6. **Test and document**
   - Test all blockchain flows and verification endpoints.
   - Document the API and UI changes.

---

## Why This Works
- Fast to implement (can be done in days, not weeks).
- No need for heavy blockchain infrastructure.
- Provides tamper-proof, auditable records for all critical petshop flows.
- Can be extended later for more features (certificates, payments, reviews).

---

## Next Steps
- [ ] Design and create the MongoDB blockchain ledger collection
- [ ] Implement backend blockchain service and hashing logic
- [ ] Integrate with petshop event flows
- [ ] Add verification API endpoints
- [ ] Update frontend for blockchain status
- [ ] Test and document
