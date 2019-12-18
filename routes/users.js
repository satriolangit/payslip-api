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
const multer = require('multer');
const Joi = require('@hapi/joi');

const auth = require('../middleware/auth');
const db = require('../config/database');
const adminOnly = require('../middleware/adminOnly');
const service = require('../services/userService');

//filters
const validateCreateUser = require('../filters/validateCreateUser');
const validateUpdateUser = require('../filters/validateUpdateUser');

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

//upload photo config
const photoStorate = multer.diskStorage({
	destination: function(req, file, cb) {
		const path = __dirname + '/../public/photos';
		cb(null, path);
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname);
	},
});

var upload = multer({ storage: photoStorate });

// @route   POST api/users/add
// @desc    Add a user
// @access  private, admin only
router.post('/add', [auth, adminOnly, upload.single('photo'), validateCreateUser], async (req, res) => {
	try {
		const request = JSON.parse(req.body.data);
		const { email, name, password, employeeId, role, isActive, phone } = request;

		const isUserExists = await service.isUserAlreadyExist(employeeId);

		if (!isUserExists) {
			const token = req.header('x-auth-token');
			const decoded = jwt.verify(token, secretKey);
			const loggedUser = decoded.user;
			let baseUrl = config.get('photo_url');
			let photo = '';

			if (req.file) {
				photo = baseUrl + req.file.originalname;
				console.log(photo);
			}
			await service.createUser(name, email, password, employeeId, phone, role, loggedUser.id, photo, isActive);

			res.status(200).json({
				result: 'OK',
				message: 'Successfully add user',
				data: req.body,
				errors: null,
			});
		} else {
			res.status(400).json({
				result: 'FAIL',
				message: 'N.I.K sudah dipakai oleh user lain, mohon diganti',
				data: req.body,
				errors: [{ message: 'N.I.K sudah dipakai oleh user lain, mohon diganti' }],
			});
		}
	} catch (err) {
		console.error('Add user error : ', err.message);
		res.status(500).json({
			result: 'FAIL',
			message: 'Add user failed, internal server error',
			data: req.body,
			errors: err,
		});
	}
});

// @route   POST api/users/update
// @desc    Update a user
// @access  private, admin only
router.post('/update', [auth, adminOnly, upload.single('photo'), validateUpdateUser], async (req, res) => {
	try {
		const request = JSON.parse(req.body.data);
		const { name, email, employeeId, role, isActive, userId, phone } = request;
		let { photo } = request;

		const token = req.header('x-auth-token');
		const decoded = jwt.verify(token, secretKey);
		const loggedUser = decoded.user;
		let baseUrl = config.get('photo_url');

		if (req.file) {
			photo = baseUrl + req.file.originalname;
			console.log(photo);
		}
		await service.updateUserById(userId, name, email, employeeId, role, phone, photo, isActive, loggedUser.id);

		res.status(200).json({
			result: 'OK',
			message: 'Successfully update user',
			data: req.body,
			errors: null,
		});
	} catch (err) {
		console.error('Update user error : ', err.message);
		return res.status(500).json({
			result: 'FAIL',
			message: 'Update user failed, internal server error',
			data: req.body,
			errors: err,
		});
	}
});

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

router.post('/upload', async (req, res) => {
	var form = new IncomingForm();
	let ok = 0;
	let fail = 0;
	let users = [];

	form.parse(req, async (err, fields, files) => {
		var f = files[Object.keys(files)[0]];
		console.log('f:', f, 'files:', files);
		readExcel(f.path).then(async rows => {
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

					const isUserExists = await service.isUserAlreadyExist(nik);

					if (!isUserExists) {
						await service.createUser(name, email, password, nik, phone, role, 'system upload', '', 1);
					} else {
						await service.updateUserByEmployeeId(nik, name, email, role, phone, password, 'system upload');
					}

					ok++;
				} catch (err) {
					console.log(err.message);
					fail++;
				}
			}

			console.log('ok:', ok, ' fail:', fail);
			const uploadMessage = 'Upload user done, OK :' + ok + ', FAIL :' + fail;
			return res.json({ message: uploadMessage });
		});
	});
});

router.post('/test', [upload.single('photo')], function(req, res, next) {
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any

	const userSchema = Joi.object({
		name: Joi.string()
			.min(2)
			.max(100)
			.required()
			.messages({
				'string.min': 'Nama harus lebih dari 2 karakter',
				'string.max': 'Nama lebih dari 100 karakter',
				'string.empty': 'Nama harus diisi',
				'any.required': 'Nama harus diisi',
			}),
		email: Joi.string()
			.email()
			.required()
			.messages({
				'string.email': 'Alamat email tidak sesuai format',
				'string.required': 'Email harus diisi',
			}),
		employeeId: Joi.string()
			.required()
			.pattern(/^[0-9]+$/)
			.messages({
				'string.empty': 'N.I.K harus diisi',
				'any.required': 'N.I.K harus diisi',
				'string.pattern.base': 'N.I.K harus diisi dengan angka',
			}),
		phone: Joi.string()
			.required()
			.messages({ 'any.required': 'No. telepon harus diisi', 'string.empty': 'No. telepon harus diisi' }),
		password: Joi.string()
			.min(6)
			.messages({
				'string.min': 'Password harus diisi minimal 6 karakter',
			}),
		confirmPassword: Joi.any()
			.required()
			.valid(Joi.ref('password'))
			.messages({
				'any.required': 'Confirm password harus diisi',
				'any.only': 'Confirm password tidak sesuai',
			}),
		role: Joi.string(),
		isActive: Joi.number(),
	});

	const request = JSON.parse(req.body.data);

	try {
		const user = JSON.parse(req.body.data);

		const { name, email, employeeId, phone, password, confirmPassword, role, isActive } = user;

		console.log(request);

		if (req.file) {
			console.log('file attached', req.file);
		} else {
			console.log('no file');
		}

		const { error, value } = userSchema.validate(request, { abortEarly: false });

		if (error) {
			console.log('request not valid :', error);
			res.json({ msg: 'request not valid', error: error });
		} else {
			console.log('request valid no error');
			res.json({ msg: 'request valid no error' });
		}
	} catch (err) {
		res.status(400).json({ error: err });
	}
});

module.exports = router;
