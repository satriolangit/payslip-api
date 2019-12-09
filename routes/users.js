const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const IncomingForm = require('formidable').IncomingForm;
const fs = require('fs');
const readExcel = require('read-excel-file/node');

const auth = require('../middleware/auth');
const db = require('../config/database');
const adminOnly = require('../middleware/adminOnly');
const service = require('../services/userService');

const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
const secretKey = config.get('jwtSecretKey');
const tokenExpiryTime = config.get('tokenExpiryTime');

// @route   GET api/user
// @desc    Get all users
// @access  Private
router.get('/', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM user ORDER BY name';
		const data = await db.query(sql);

		res.status(200).json({
			message: 'OK',
			data: data,
			errors: null,
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({
			message: 'Failed to get users',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/user/:userId
// @desc    Get user by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM user WHERE user_id = ?';
		const data = await db.query(sql, req.params.id);

		res.status(200).json({
			message: 'OK',
			data: data,
			errors: null,
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({
			message: 'Failed to get users',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/users/profile/:userId
// @desc    Get user profile by id
// @access  Private
router.get('/profile/:id', auth, async (req, res) => {
	try {
		const sql = 'SELECT user_id, name, email, employee_id, role, photo, phone FROM user WHERE user_id = ?';
		const data = await db.query(sql, req.params.id);

		res.status(200).json({
			message: 'OK',
			data: data,
			errors: null,
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({
			message: 'Failed to get users',
			data: req.body,
			errors: err,
		});
	}
});

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
		check('phone', 'Please fill phone number')
			.not()
			.isEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Bad request',
				data: req.body,
				errors: errors.array(),
			});
		}

		const { name, email, password, employeeId, phone } = req.body;

		try {
			let sql = 'SELECT user_id, role FROM user WHERE email = ? LIMIT 1';
			let user = await db.query(sql, email);

			if (user.length > 0) {
				console.log('user:', user);
				return res.status(400).json({
					message: 'User already exists',
					data: req.body,
					errors: null,
				});
			}

			//create new user
			sql =
				'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active, phone, password_plain) ' +
				'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			const userId = uuidv4();

			await db.query(sql, [
				userId,
				hashedPassword,
				email,
				name,
				employeeId,
				'employee',
				'system',
				timestamp,
				1,
				phone,
				password,
			]);

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
			check('employeeId', 'Please enter your employee id (NIK)')
				.not()
				.isEmpty(),
			check('role')
				.not()
				.isEmpty(),
			check('isActive')
				.not()
				.isEmpty(),
			check('phone', 'Please fill phone number')
				.not()
				.isEmpty(),
			check('password', 'Please enter a password with 6 or more characters')
				.isLength({ min: 6 })
				.custom((value, { req, loc, path }) => {
					if (value !== req.body.confirmPassword) {
						// trow error if passwords do not match
						throw new Error("Confirm passwords don't match");
					} else {
						return value;
					}
				}),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			console.log('errors :', errors.array());

			return res.status(400).json({
				status: 400,
				message: 'Bad request',
				data: req.body,
				errors: errors.array(),
			});
		}

		try {
			const { name, email, password, employeeId, role, isActive, phone } = req.body;

			let sql = 'SELECT user_id, role FROM user WHERE email = ? OR employee_id = ? LIMIT 1';
			let user = await db.query(sql, [email, employeeId]);

			if (user.length > 0) {
				return res.status(400).json({
					message: 'User already exists',
					data: req.body,
					errors: [{ msg: 'User already exists, please change nik or email' }],
				});
			}

			//create new user
			sql =
				'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active, phone, password_plain) ' +
				'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			const userId = uuidv4();

			const token = req.header('x-auth-token');
			const decoded = jwt.verify(token, secretKey);
			const loggedUser = decoded.user;
			const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
			await db.query(sql, [
				userId,
				hashedPassword,
				email,
				name,
				employeeId,
				role,
				loggedUser.id,
				now,
				isActive,
				phone,
				password,
			]);

			res.status(200).json({
				message: 'Successfully add user',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.error('Add user error : ', err.message);
			res.status(500).json({
				message: 'Add user failed, internal server error',
				data: req.body,
				errors: err,
			});
		}
	}
);

router.post(
	'/test',
	[
		[
			check('name', 'Please add name')
				.not()
				.isEmpty(),
			check('email', 'Please enter valid email').isEmail(),
			check('password', 'Please enter a password with 6 or more characters')
				.isLength({ min: 6 })
				.custom((value, { req, loc, path }) => {
					if (value !== req.body.confirmPassword) {
						// trow error if passwords do not match
						throw new Error("Confirm passwords don't match");
					} else {
						return value;
					}
				}),
			check('employeeId', 'Please enter your employee id (NIK)')
				.not()
				.isEmpty(),
			check('role')
				.not()
				.isEmpty(),
			check('isActive')
				.not()
				.isEmpty(),
			check('phone', 'Please fill phone number')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);

		//console.log('req.body: ', req.body);

		if (!errors.isEmpty()) {
			//console.log('req.body: ', req.body);
			//console.log('enter errors :', errors.array());

			return res.status(400).json({
				message: 'Bad request',
				data: req.body,
				errors: errors.array(),
			});
		}

		try {
			const { name, email, password, employeeId, role, isActive, phone, confirmPassword } = req.body;

			let sql = 'SELECT user_id, role FROM user WHERE email = ? OR employee_id = ? LIMIT 1';
			let user = await db.query(sql, [email, employeeId]);

			if (user.length > 0) {
				return res.status(400).json({
					message: 'User already exists',
					data: req.body,
					errors: [{ msg: 'User already exists, please change nik or email' }],
				});
			}

			res.status(200).json({
				status: 200,
				message: 'Successfully add user',
				data: req.body,
				errors: null,
			});

			console.log('OK');
		} catch (err) {
			console.error('Add user error : ', err.message);
			res.status(500).json({
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
			check('employeeId', 'Please enter your employee id (NIK)')
				.not()
				.isEmpty(),
			check('userId')
				.not()
				.isEmpty(),
			check('isActive')
				.not()
				.isEmpty(),
			check('phone', 'Please fill phone number')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Bad request',
				data: req.body,
				errors: errors.array(),
			});
		}

		try {
			const { name, email, employeeId, role, isActive, userId, phone } = req.body;
			console.log(req.body);
			//check user
			let sql = 'SELECT user_id, role FROM user WHERE user_id != ? AND (email = ? OR employee_id = ?) LIMIT 1';
			let user = await db.query(sql, [userId, email, employeeId]);

			if (user.length > 0) {
				return res.status(400).json({
					message: 'User already exists',
					data: req.body,
					errors: [{ msg: 'User already exists, please change nik or email' }],
				});
			}

			//update new user
			sql =
				'UPDATE user SET email = ?, name = ?, employee_id = ?, role = ? , updated_by = ?, updated_on = ?, is_active = ?, phone = ? WHERE user_id = ?';

			const token = req.header('x-auth-token');
			const decoded = jwt.verify(token, secretKey);
			const loggedUser = decoded.user;
			const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
			await db.query(sql, [email, name, employeeId, role, loggedUser.id, now, isActive, phone, userId]);

			res.status(200).json({
				message: 'Successfully update user',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.error('Update user error : ', err.message);
			return res.status(500).json({
				message: 'Update user failed, internal server error',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/users/changepwd
// @desc    Update a user
// @access  private, admin only

router.post(
	'/changepwd',
	[
		auth,
		adminOnly,
		[
			check('password', 'Please provide password')
				.not()
				.isEmpty(),
			check('userId')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);

		console.log(req.body);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Bad request',
				data: req.body,
				errors: errors.array(),
			});
		}

		try {
			const { userId, password } = req.body;

			//create new user
			const sql =
				'UPDATE user SET password = ?, updated_by = ?, updated_on = ?, last_change_password = ?, password_plain = ? WHERE user_id = ?';

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);

			const token = req.header('x-auth-token');
			const decoded = jwt.verify(token, secretKey);
			const loggedUser = decoded.user;

			const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
			await db.query(sql, [hashedPassword, loggedUser.id, now, now, password, userId]);

			res.status(200).json({
				message: 'Successfully change password of user',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.error('Update user error : ', err.message);
			return res.status(500).json({
				message: 'Change password user failed, internal server error',
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

// @route   POST api/users/deletes
// @desc    Delete a users
// @access  private
router.post(
	'/deletes',
	[
		auth,
		adminOnly,
		[
			check('ids')
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

		const { ids } = req.body;

		try {
			for (i = 0; i < ids.length; i++) {
				let userId = ids[i];

				let sql = 'DELETE FROM user WHERE user_id = ?';
				await db.query(sql, userId);
			}

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

router.post('/upload', async (req, res) => {
	try {
		var form = new IncomingForm();
		let ok = 0;
		let fail = 0;
		let users = [];

		form.parse(req, (err, fields, files) => {
			var f = files[Object.keys(files)[0]];

			readExcel(f.path).then(rows => {
				for (i = 1; i < rows.length; i++) {
					const row = rows[i];
					const name = row[0];
					const email = row[1];
					const nik = row[2];
					const role = row[3];
					const phone = row[4];
					const password = row[5];
					const salt = bcrypt.genSaltSync(10);
					const hashedPassword = bcrypt.hashSync(password.toString(), salt);
					const userId = uuidv4();
					//const token = req.header('x-auth-token');
					//const decoded = jwt.verify(token, secretKey);
					//const loggedUser = decoded.user;
					const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

					db.query(
						'SELECT user_id, role FROM user WHERE email = ? OR employee_id = ? LIMIT 1',
						[email, nik],
						(error, results, fields) => {
							if (results <= 0) {
								const sql =
									'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active, phone, password_plain) ' +
									'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

								db.query(
									sql,
									[
										userId,
										hashedPassword,
										email,
										name,
										nik,
										role,
										'system upload',
										now,
										1,
										phone,
										password,
									],
									(error, results, fields) => {
										if (error) {
											fail++;
											console.log(error);
										} else {
											ok++;
											console.log('ok', ok);
										}
									}
								);
							} else {
								//update
								const sql =
									'UPDATE user SET name = ?, email = ?, role = ?, phone = ?, password = ?, password_plain = ?, updated_by = ?, updated_on = ? WHERE employee_id = ?';
								db.query(
									sql,
									[
										name,
										email,
										role,
										phone,
										hashedPassword,
										password,
										'system upload',
										timestamp,
										nik,
									],
									(error, result, fields) => {
										if (error) {
											fail++;
											console.log(error);
										} else {
											ok++;
										}
									}
								);
							}
						}
					);
				}

				const uploadMessage = 'Upload user data done, ok :' + ok + ', fail :' + fail;
				console.log(uploadMessage);
				return res.json({ message: uploadMessage });
			});
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			status: 500,
			message: 'Failed to upload users',
			data: req.body,
			errors: error,
		});
	}
});

// @route   POST api/users/search
// @desc    POST search
// @access  Private
router.post('/search', auth, async (req, res) => {
	try {
		const { keywords } = req.body;

		const sql =
			'SELECT * FROM user WHERE name LIKE ? OR email LIKE ? OR employee_id LIKE ? ORDER BY created_on DESC';
		const data = await db.query(sql, ['%' + keywords + '%', '%' + keywords + '%', '%' + keywords + '%']);

		res.status(200).json({
			status: 200,
			message: 'OK',
			data: data,
			errors: null,
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({
			status: 500,
			message: 'Failed to get users',
			data: req.body,
			errors: err,
		});
	}
});

router.post('/upload1', async (req, res) => {
	var form = new IncomingForm();
	let ok = 0;
	let fail = 0;
	let users = [];

	form.parse(req, (err, fields, files) => {
		var f = files[Object.keys(files)[0]];
		readExcel(f.path).then(rows => {
			for (i = 1; i < rows.length; i++) {
				try {
					const row = rows[i];
					const name = row[0];
					const email = row[1];
					const nik = row[2];
					const role = row[3];
					const phone = row[4];
					const password = row[5];
					const salt = bcrypt.genSaltSync(10);
					const hashedPassword = bcrypt.hashSync(password.toString(), salt);
					const userId = uuidv4();

					ok++;
				} catch {
					fail++;
				}
			}

			console.log('ok:', ok, ' fail:', fail);
		});
	});
});

module.exports = router;
