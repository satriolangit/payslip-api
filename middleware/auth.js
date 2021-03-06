const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
	//Get token from header
	const token = req.header('x-auth-token');

	if (!token) {
		res.status(401).json({
			status: 401,
			message: 'No token, authorization denied',
			data: req.body,
			errors: null,
		});
	}

	try {
		const decoded = jwt.verify(token, config.get('jwtSecretKey'));
		req.user = decoded.user;
		next();
	} catch (err) {
		res.status(401).json({
			status: 0,
			message: 'Token not valid, authorization denied',
			data: req.body,
			errors: null,
		});
	}
};
