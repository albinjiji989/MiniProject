require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'albinjiji2026@mca.ajce.in';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
    const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(res.data));
  } catch (e) {
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Body:', JSON.stringify(e.response.data));
    } else {
      console.error('Error:', e.message);
    }
    process.exit(1);
  }
})();


