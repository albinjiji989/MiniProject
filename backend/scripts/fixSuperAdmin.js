const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../core/models/User');

(async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		const email = process.env.SUPER_ADMIN_EMAIL;
		const pwd = process.env.SUPER_ADMIN_PASSWORD;
		if (!email || !pwd) {
			console.error('Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD');
			process.exit(1);
		}
		let user = await User.findOne({ email }).select('+password');
		if (!user) {
			console.error('Super admin not found');
			process.exit(1);
		}
		console.log('Before:', { authProvider: user.authProvider, hasPwd: !!user.password });
		user.password = pwd;
		user.authProvider = 'both';
		user.role = 'admin';
		await user.save();
		user = await User.findOne({ email }).select('+password');
		console.log('After:', { authProvider: user.authProvider, hasPwd: !!user.password });
		process.exit(0);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
})();
