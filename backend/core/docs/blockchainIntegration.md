/**
 * Blockchain Integration Documentation
 *
 * This document describes the blockchain implementation for the adoption module and future extensibility for other modules.
 *
 * Key Features:
 * - Tamper-proof adoption event tracking
 * - Immutable pet identity and history
 * - Transparent application and status tracking
 * - API endpoints for verification and history
 * - Frontend UI for blockchain status and history
 *
 * File Naming Convention:
 * - All blockchain-related files use the prefix 'blockchain' and module name for clarity and future extensibility.
 *   Example: blockchainAdoptionService.js, blockchainPetshopService.js, blockchainRoutes.js
 *
 * Integration Points:
 * - Pet creation, adoption application, status changes, and handover events trigger blockchain block creation.
 * - No existing adoption logic is deleted; blockchain is added as an additional layer.
 *
 * API Endpoints:
 * - GET /api/blockchain/pet/:petId: Get blockchain history for a pet
 * - GET /api/blockchain/verify: Verify blockchain integrity
 *
 * Frontend:
 * - Blockchain status and history are shown in Pet Details (manager view)
 *
 * Extending to Other Modules:
 * - Create new blockchain service files (e.g., blockchainPetshopService.js) for other modules
 * - Use the same schema and service pattern for event tracking
 *
 * Testing:
 * - Backend: Test block creation, history retrieval, and chain verification
 * - Frontend: Test UI display of blockchain status and history
 *
 * For details, see ADOPTION_BLOCKCHAIN_MINIMAL_PLAN.md
 */

// Example usage and extension notes:
// To add blockchain to another module, create a new service file (e.g., blockchainPetshopService.js)
// and follow the same event tracking and API exposure pattern.
