# Test Credentials

## User Accounts for Testing

### Regular User
- **Email**: albinjiji17@gmail.com
- **Password**: Albin@123
- **Role**: User
- **Use for**: 
  - Product browsing and shopping
  - Cart and checkout operations
  - Order management
  - Temporary care bookings
  - Pet management

### Temporary Care Manager
- **Email**: albinjiji003@gmail.com
- **Password**: Albin@123
- **Role**: Manager (Temporary Care Module)
- **Use for**:
  - Booking management
  - Application processing
  - Staff assignment
  - Activity logging
  - OTP generation and verification
  - Payment management

### Ecommerce Manager
- **Email**: albinjiji005@gmail.com
- **Password**: Albin@123
- **Role**: Manager (Ecommerce Module)
- **Use for**:
  - Product management (CRUD)
  - Category management
  - Order processing
  - Inventory management
  - Dashboard analytics
  - AI/ML inventory predictions

## Usage in Tests

### Authentication Helper
```javascript
import { AuthHelper } from './utils/auth.js';

// In your test
const authHelper = new AuthHelper(page);

// Login as user
await authHelper.loginAsUser();

// Login as temporary care manager
await authHelper.loginAsTemporaryCareManager();

// Login as ecommerce manager
await authHelper.loginAsEcommerceManager();
```

### Environment Variables
These credentials are also stored in `.env.test` file:
```env
TEST_USER_EMAIL=albinjiji17@gmail.com
TEST_USER_PASSWORD=Albin@123
TEST_TEMP_CARE_MANAGER_EMAIL=albinjiji003@gmail.com
TEST_TEMP_CARE_MANAGER_PASSWORD=Albin@123
TEST_ECOMMERCE_MANAGER_EMAIL=albinjiji005@gmail.com
TEST_ECOMMERCE_MANAGER_PASSWORD=Albin@123
```

## Security Notes

⚠️ **Important**: 
- These are test credentials for development/testing environment only
- Never commit real production credentials to version control
- Use environment variables for sensitive data
- Rotate credentials regularly
- Use different credentials for production testing

## Test Data Requirements

### User Account (albinjiji17@gmail.com)
Should have:
- ✅ At least one pet added
- ✅ Shipping address configured
- ✅ Some order history (optional)
- ✅ Some products in wishlist (optional)

### Temporary Care Manager (albinjiji003@gmail.com)
Should have:
- ✅ Store/facility set up
- ✅ At least one staff member added
- ✅ Services configured
- ✅ Pricing set up

### Ecommerce Manager (albinjiji005@gmail.com)
Should have:
- ✅ Store set up
- ✅ Product categories created
- ✅ Some products added
- ✅ Inventory configured

## Troubleshooting

### Login Failures
If login fails, check:
1. Backend server is running
2. Database is accessible
3. Credentials are correct
4. User accounts exist in database
5. Accounts are active (not disabled)

### Permission Issues
If tests fail due to permissions:
1. Verify user roles in database
2. Check module access permissions
3. Ensure RBAC is properly configured

### Session Issues
If session expires during tests:
1. Check JWT token expiration settings
2. Increase token validity period for testing
3. Implement token refresh in tests

## Creating Additional Test Users

If you need to create more test users:

```javascript
// In your test setup
const authHelper = new AuthHelper(page);
const userData = await authHelper.registerUser({
  name: 'Test User',
  email: 'newuser@example.com',
  password: 'Test@123',
  phone: '9876543210'
});
```

## Resetting Test Data

To reset test data between test runs:

```bash
# Backend
cd backend
npm run seed:test

# Or manually reset specific data
npm run reset:test-users
npm run reset:test-products
npm run reset:test-bookings
```
