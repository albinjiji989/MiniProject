const NodeGeocoder = require('node-geocoder');
const config = require('../config/config');

const options = {
  provider: config.GEOCODER_PROVIDER,
  httpAdapter: 'https',
  apiKey: config.GEOCODER_API_KEY,
  formatter: null
};

const geocoder = NodeGeocoder(options);

// Format address for geocoding
const formatAddress = (address) => {
  const { street, city, state, country, pincode } = address;
  return `${street}, ${city}, ${state} ${pincode}, ${country}`;
};

// Geocode an address
const geocode = async (address) => {
  try {
    const formattedAddress = typeof address === 'string' ? address : formatAddress(address);
    const res = await geocoder.geocode(formattedAddress);
    
    if (res.length === 0) {
      throw new Error('No results found');
    }
    
    return {
      formattedAddress: res[0].formattedAddress,
      latitude: res[0].latitude,
      longitude: res[0].longitude,
      street: res[0].streetName || '',
      city: res[0].city || '',
      state: res[0].state || '',
      zipcode: res[0].zipcode || '',
      country: res[0].country || '',
      countryCode: res[0].countryCode || ''
    };
  } catch (err) {
    console.error('Geocoding error:', err);
    throw new Error('Could not geocode address');
  }
};

// Reverse geocode coordinates
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await geocoder.reverse({ lat, lon: lng });
    
    if (res.length === 0) {
      throw new Error('No results found');
    }
    
    return {
      formattedAddress: res[0].formattedAddress,
      latitude: res[0].latitude,
      longitude: res[0].longitude,
      street: res[0].streetName || '',
      city: res[0].city || '',
      state: res[0].state || '',
      zipcode: res[0].zipcode || '',
      country: res[0].country || '',
      countryCode: res[0].countryCode || ''
    };
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    throw new Error('Could not reverse geocode coordinates');
  }
};

// Get distance between two points in kilometers
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
};

// Convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

module.exports = {
  geocoder,
  geocode,
  reverseGeocode,
  getDistance,
  formatAddress
};
