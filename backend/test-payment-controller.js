const paymentController = require('./modules/petshop/user/controllers/paymentController');

console.log('Payment controller functions:');
console.log('- createRazorpayOrder:', typeof paymentController.createRazorpayOrder);
console.log('- verifyRazorpaySignature:', typeof paymentController.verifyRazorpaySignature);
console.log('- confirmPurchaseDecision:', typeof paymentController.confirmPurchaseDecision);
console.log('- updateDeliveryStatus:', typeof paymentController.updateDeliveryStatus);
console.log('- scheduleHandover:', typeof paymentController.scheduleHandover);
console.log('- completeHandover:', typeof paymentController.completeHandover);
console.log('- regenerateHandoverOTP:', typeof paymentController.regenerateHandoverOTP);
console.log('- schedulePickup:', typeof paymentController.schedulePickup);
console.log('- verifyPickupOTP:', typeof paymentController.verifyPickupOTP);
console.log('- getPickupDetails:', typeof paymentController.getPickupDetails);

if (paymentController.verifyRazorpaySignature === undefined) {
  console.log('ERROR: verifyRazorpaySignature is undefined!');
} else {
  console.log('SUCCESS: verifyRazorpaySignature is defined');
}

if (paymentController.schedulePickup === undefined) {
  console.log('ERROR: schedulePickup is undefined!');
} else {
  console.log('SUCCESS: schedulePickup is defined');
}

if (paymentController.verifyPickupOTP === undefined) {
  console.log('ERROR: verifyPickupOTP is undefined!');
} else {
  console.log('SUCCESS: verifyPickupOTP is defined');
}

if (paymentController.getPickupDetails === undefined) {
  console.log('ERROR: getPickupDetails is undefined!');
} else {
  console.log('SUCCESS: getPickupDetails is defined');
}