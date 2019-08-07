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
const adminOnly = require('../middleware/adminOnly');

const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
const secretKey = config.get('jwtSecretKey');
const tokenExpiryTime = config.get('tokenExpiryTime');

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

		if (!errors.isEmpty()) {
			return res.status(400).json({
				status: 0,
				message: 'Bad request',
				data: req.body,
				errors: errors.array(),
			});
		}

		const { name, email, password, employeeId } = req.body;

		try {
			let sql = 'SELECT user_id, role FROM user WHERE email = ? LIMIT 1';
			let user = await db.query(sql, email);

			if (user.length > 0) {
				console.log('user:', user);
				return res.status(400).json({
					status: 400,
					message: 'User already exists',
					data: req.body,
					errors: null,
				});
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
			res.status(500).json({
				status: 500,
				message: 'Update user failed, internal server error',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/users/add
// @desc    Add a user
// @access  private, admin only
router.post(
	'/add',
	[
		auth,
		adminOnly,
		[
			check('name', 'Please add name')
				.not()
				.isEmpty(),
			check('email', 'Please enter valid email').isEmail(),
			check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
			check('employeeId', 'Please enter your employee id (NIK)')
				.not()
				.isEmpty(),
			check('role')
				.not()
				.isEmpty(),
			check('isActive')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		const secretKey = config.get('jwtSecretKey');

		if (!errors.isEmpty()) {
			return res.status(400).json({
				status: 400,
				message: 'Bad request',
				data: req.body,
				errors: errors.array(),
			});
		}

		try {
			const { name, email, password, employeeId, role, isActive } = req.body;

			let sql = 'SELECT user_id, role FROM user WHERE email = ? LIMIT 1';
			let user = await db.query(sql, email);

			if (user.length > 0) {
				return res.status(400).json({
					status: 400,
					message: 'User already exists',
					data: req.body,
					errors: null,
				});
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

			await db.query(sql, [
				userId,
				hashedPassword,
				email,
				name,
				employeeId,
				role,
				loggedUser.id,
				timestamp,
				isActive,
			]);

			res.status(200).json({
				status: 200,
				message: 'Successfully add user',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.error('Add user error : ', err.message);
			res.status(500).json({
				status: 500,
				message: 'Add user failed, internal server error',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/users/update
// @desc    Update a user
// @access  private, admin only

router.post(
	'/update',
	[
		auth,
		adminOnly,
		[
			check('name', 'Please add name')
				.not()
				.isEmpty(),
			check('email', 'Please enter valid email').isEmail(),
			check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
			check('employeeId', 'Please enter your employee id (NIK)')
				.not()
				.isEmpty(),
			check('userId')
				.not()
				.isEmpty(),
			check('isActive')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				status: 400,
				message: 'Bad request',
				data: req.body,
				errors: errors.array(),
			});
		}

		try {
			const { name, email, password, employeeId, role, isActive, userId } = req.body;

			//create new user
			const sql =
				'UPDATE user SET password = ?, email = ?, name = ?, employee_id = ?, role = ? , updated_by = ?, updated_on = ?, is_active = ? WHERE user_id = ?';

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);

			const token = req.header('x-auth-token');
			const decoded = jwt.verify(token, secretKey);
			const loggedUser = decoded.user;

			await db.query(sql, [
				hashedPassword,
				email,
				name,
				employeeId,
				role,
				loggedUser.id,
				timestamp,
				isActive,
				userId,
			]);

			res.status(200).json({
				status: 200,
				message: 'Successfully update user',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.error('Update user error : ', err.message);
			return res.status(500).json({
				status: 500,
				message: 'Update user failed, internal server error',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/users/delete
// @desc    Delete a user
// @access  private
router.post(
	'/delete',
	[
		auth,
		adminOnly,
		[
			check('userId')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				status: 400,
				message: 'Error',
				data: req.body,
				errors: errors.array(),
			});
		}

		const { userId } = req.body;

		try {
			const sql = 'DELETE FROM user WHERE user_id = ?';
			await db.query(sql, userId);

			return res.status(200).json({
				status: 200,
				message: 'Successfully delete user',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.log('Failed to delete user, error : ', err.message);
			return res.status(500).json({
				status: 500,
				message: 'Failed to delete user',
				data: req.body,
				errors: err,
			});
		}
	}
);

module.exports = router;
