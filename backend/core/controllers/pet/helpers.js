// Helper: ensure current user can access this pet
const canAccessPet = (user, pet) => {
  if (!pet) return false;
  if (!user.storeId) return true; // public users or others without store restriction
  return String(pet.storeId || '') === String(user.storeId || '');
};

module.exports = {
  canAccessPet
};