// Utility functions for pet management

export const formatPetAge = (age, ageUnit) => {
  if (!age || !ageUnit) return 'Unknown';
  
  switch (ageUnit) {
    case 'weeks':
      return `${age} week${age !== 1 ? 's' : ''}`;
    case 'months':
      return `${age} month${age !== 1 ? 's' : ''}`;
    case 'years':
      return `${age} year${age !== 1 ? 's' : ''}`;
    default:
      return `${age} ${ageUnit}`;
  }
};

export const formatPetGender = (gender) => {
  if (!gender) return 'Unknown';
  
  const genderMap = {
    'Male': 'Male',
    'Female': 'Female',
    'Unknown': 'Unknown',
    'male': 'Male',
    'female': 'Female',
    'unknown': 'Unknown'
  };
  
  return genderMap[gender] || 'Unknown';
};

export const getPetStatusColor = (status) => {
  const statusColors = {
    'Available': 'success',
    'Adopted': 'primary',
    'Reserved': 'warning',
    'Under Treatment': 'error',
    'Deceased': 'default',
    'Fostered': 'info',
    'in_petshop': 'secondary',
    'available_for_sale': 'success',
    'sold': 'primary'
  };
  
  return statusColors[status] || 'default';
};

export const getPetHealthStatusColor = (healthStatus) => {
  const healthColors = {
    'Excellent': 'success',
    'Good': 'info',
    'Fair': 'warning',
    'Poor': 'error',
    'Critical': 'error'
  };
  
  return healthColors[healthStatus] || 'default';
};

export const formatPetWeight = (weight) => {
  if (!weight || !weight.value) return 'Unknown';
  
  const { value, unit } = weight;
  return `${value} ${unit || 'kg'}`;
};

export const formatPetSize = (size) => {
  const sizeMap = {
    'tiny': 'Tiny',
    'small': 'Small',
    'medium': 'Medium',
    'large': 'Large',
    'giant': 'Giant'
  };
  
  return sizeMap[size] || size || 'Unknown';
};

export const getPetTemperamentChips = (temperament) => {
  if (!temperament || !Array.isArray(temperament)) return [];
  
  return temperament.map((trait, index) => ({
    key: index,
    label: trait
  }));
};

export const validatePetData = (petData) => {
  const errors = [];
  
  if (!petData.name || petData.name.trim().length === 0) {
    errors.push('Pet name is required');
  }
  
  if (!petData.species) {
    errors.push('Species is required');
  }
  
  if (!petData.breed) {
    errors.push('Breed is required');
  }
  
  if (petData.age && (isNaN(petData.age) || petData.age < 0)) {
    errors.push('Age must be a positive number');
  }
  
  return errors;
};

export const preparePetFormData = (petData) => {
  return {
    name: petData.name || '',
    species: petData.species || '',
    breed: petData.breed || '',
    gender: petData.gender || 'Unknown',
    age: petData.age || '',
    ageUnit: petData.ageUnit || 'months',
    color: petData.color || '',
    weight: petData.weight || { value: '', unit: 'kg' },
    size: petData.size || 'medium',
    description: petData.description || '',
    ...petData
  };
};

export const formatPetLocation = (location) => {
  if (!location) return 'Unknown';
  
  const { address, city, state, country } = location;
  const parts = [address, city, state, country];
  return parts.filter(Boolean).join(', ') || 'Unknown';
};