# Petshop Module – Planned Blockchain Implementation

This document outlines the planned blockchain features for the Petshop module, referencing the approach and structure used in the Adoption module.

---

## 1. Supply Chain Transparency & Breeder Verification
- Register certified breeders on blockchain with credentials and compliance checks.
- Record breeding events, parentage, and custody transfers (breeder → transport → shop).
- Track health checks and regulatory compliance at each stage.

## 2. Batch Authenticity & Anti-Counterfeiting
- Create unique blockchain records for each PetBatch.
- Link batches to verified breeders and record batch composition (species, breed, counts, age range).
- Track batch status changes (draft, published, sold out) and prevent tampering.
- Enable QR code verification for authenticity.

## 3. Individual Pet Provenance Tracking
- Register each pet on blockchain when added to inventory.
- Link to parent batch and breeding event.
- Record all health checks, vaccinations, treatments, and incidents.
- Track ownership transfer to customer and enable lifetime tracking.

## 4. Purchase & Ownership Transfer Records
- Record all pet purchases and ownership transfers immutably.
- Link buyer identity to pet blockchain ID.
- Generate tamper-proof ownership certificates and support resale/warranty verification.

## 5. Reservation & Pre-booking Transparency
- Record reservations with time-locks on blockchain.
- Prevent double-booking and automate deposit/refund handling.
- Ensure fair queue management and transparent waiting lists.

## 6. Health Certificate & Vaccination Verification
- Store veterinarian-issued health certificates and vaccination records on blockchain.
- Enable instant verification by customers and authorities.

## 7. Shop Reputation & Rating System
- Store customer reviews, compliance violations, and reputation scores on blockchain.
- Ensure tamper-proof, transparent shop ratings and incentivize ethical practices.

---

## Technical Approach
- **Platform:** Hyperledger Fabric (permissioned, scalable, privacy-focused)
- **Smart Contracts:** Separate contracts for supply chain, inventory, payment, and reputation
- **Data Storage:** Hybrid (on-chain for critical records, off-chain for personal data and large files)
- **Integration:** Node.js backend with Fabric SDK, dual-write to DB and blockchain

---

## Next Steps
1. Finalize smart contract interfaces for each feature
2. Integrate blockchain service layer in backend
3. Update controllers and API endpoints
4. Add blockchain verification UI in frontend
5. Test and audit all blockchain flows

---

This plan ensures end-to-end transparency, traceability, and trust for all petshop stakeholders (managers, users, breeders, veterinarians, and regulators), following the successful model of the Adoption module.