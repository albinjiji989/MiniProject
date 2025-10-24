// Test if we can import the routes without error
try {
  const userRoutes = require('./modules/petshop/user/routes/petshopUserRoutes');
  console.log('SUCCESS: User routes loaded without error');
  console.log('Routes type:', typeof userRoutes);
} catch (error) {
  console.log('ERROR loading user routes:', error.message);
  console.log('Stack trace:', error.stack);
}