require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const login = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    const token = login.data.data.token;
    const prof = await axios.get('http://localhost:5000/api/profile', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Profile status:', prof.status);
    console.log('Profile body:', JSON.stringify(prof.data));
    const me = await axios.get('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Me status:', me.status);
    console.log('Me body:', JSON.stringify(me.data));
  } catch (e) {
    if (e.response) {
      console.error('Profile error status:', e.response.status);
      console.error('Profile error body:', JSON.stringify(e.response.data));
    } else {
      console.error('Error:', e.message);
    }
    process.exit(1);
  }
})();


