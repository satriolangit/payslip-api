const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// @route   GET api/auth
// @desc    Get logged in user
// @access  Private

router.get('/', auth, async (req, res) => {
	try {
		const sql = 'SELECT user_id, email, name, employee_id, photo, role FROM user WHERE user_id = ?';
		const user = await db.query(sql, [req.user.id]);

		res.json(user);
	} catch (err) {
		console.log(err.message);
		res.status(500).send('Internal Server Error');
	}
});

// @route   POST api/auth
// @desc    Auth user & get token
// @access  Public
router.post(
	'/',
	[
		auth,
		[check('email', 'Please include a valid email').isEmail(), check('password', 'Password is required').exists()],
	],

	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		console.log(req.body);

		const { email, password } = req.body;

		try {
			const sql = 'SELECT user_id, role FROM user WHERE email = ? LIMIT 1';
			let user = await db.query(sql, email);

			if (!user) {
				return res.status(400).json({ msg: 'Invalid credentials' });
			}

			user = user[0];
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(400).json({ msg: 'Invalid credentials' });
			}

			const payload = {
				user: {
					id: user.user_id,
					role: user.role,
				},
			};

			const secretKey = config.get('jwtSecretKey');
			const tokenExpiryTime = config.get('tokenExpiryTime');

			jwt.sign(payload, secretKey, { expiresIn: tokenExpiryTime }, (err, token) => {
				if (err) throw err;
				res.json({ token });
			});
		} catch (err) {
			console.log(err.message);
			res.status(500).send('Internal Server Error');
		}
	}
);

module.exports = router;
