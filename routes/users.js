const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const auth = require('../middleware/auth');
const db = require('../config/database');

const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post(
	'/',
	[
		check('name', 'Please add name')
			.not()
			.isEmpty(),
		check('email', 'Please enter valid email').isEmail(),
		check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
		check('employeeId', 'Please enter your employee id (NIK)')
			.not()
			.isEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		const secretKey = config.get('jwtSecretKey');
		const tokenExpiryTime = config.get('tokenExpiryTime');

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password, employeeId } = req.body;

		try {
			let sql = 'SELECT user_id, role FROM user WHERE email = ? LIMIT 1';
			let user = await db.query(sql, email);

			if (user.length > 0) {
				console.log('user:', user);
				return res.status(400).json({ msg: 'User already exists' });
			}

			//create new user
			sql =
				'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active) ' +
				'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			const userId = uuidv4();

			await db.query(sql, [userId, hashedPassword, email, name, employeeId, 'employee', 'system', timestamp, 1]);

			//generate token
			const payload = {
				user: {
					id: userId,
					role: 'employee',
				},
			};

			jwt.sign(
				payload,
				secretKey,
				{
					expiresIn: tokenExpiryTime,
				},
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Internal server error');
		}
	}
);

// @route   POST api/users/add
// @desc    Add a user
// @access  private
router.post(
	'/',
	[
		auth,
		[
			check('name', 'Please add name')
				.not()
				.isEmpty(),
			check('email', 'Please enter valid email').isEmail(),
			check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
			check('employee_id', 'Please enter your employee id (NIK)')
				.not()
				.isEmpty(),
			check('role')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		const secretKey = config.get('jwtSecretKey');

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password, employeeId, role } = req.body;

		try {
			let sql = 'SELECT user_id, role FROM user WHERE email = ? LIMIT 1';
			let user = await db.query(sql, email);

			if (user) {
				return res.status(400).json({ msg: 'User already exists' });
			}

			//create new user
			sql =
				'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active) ' +
				'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			const userId = uuidv4();

			const token = req.header('x-auth-token');
			const decoded = jwt.verify(token, secretKey);
			const loggedUser = decoded.user;

			await db.query(sql, [userId, hashedPassword, email, name, employeeId, role, loggedUser.id, timestamp, 1]);
		} catch (err) {
			console.error(err.message);
			req.status(500).send('Internal server error');
		}
	}
);

module.exports = router;
