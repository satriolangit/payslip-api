const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const auth = require('../middleware/auth');
const db = require('../config/database');
const adminOnly = require('../middleware/adminOnly');

const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
const secretKey = config.get('jwtSecretKey');

// @route   GET api/role
// @desc    Get all role
// @access  Private
router.get('/', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM role ORDER BY role_name';
		const data = await db.query(sql);

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
			message: 'Failed to get roles',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/role/:id
// @desc    Get role by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM role WHERE id = ?';
		const data = await db.query(sql, req.params.id);

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
			message: 'Failed to get role',
			data: req.body,
			errors: err,
		});
	}
});

// @route   POST api/role
// @desc    Create new information
// @access  Private, AdminOnly
router.post(
	'/',
	[
		auth,
		adminOnly,
		[
			check('roleName', 'Please enter role name')
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
			const token = req.header('x-auth-token');
			const decoded = jwt.verify(token, secretKey);
			const createdBy = decoded.user.id;
			const uid = uuidv4();
			const { roleName, roleDesc } = req.body;

			const sql = 'INSERT INTO role (id, role_name, role_desc) ' + 'VALUES (?, ?, ?)';

			await db.query(sql, [uid, roleName, roleDesc]);

			res.status(200).json({
				status: 200,
				message: 'OK',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.error(err.message);
			res.status(500).json({
				status: 500,
				message: 'Create new role failed',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/role/update
// @desc    Update existing role
// @access  Private, AdminOnly
router.post(
	'/update',
	[
		auth,
		adminOnly,
		[
			check('roleName', 'Please enter title')
				.not()
				.isEmpty(),
			check('id', 'Please provide role id')
				.not()
				.isEmpty(),
			check('roleDesc', 'Please provide role description')
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
			const token = req.header('x-auth-token');
			const decoded = jwt.verify(token, secretKey);
			const createdBy = decoded.user.id;
			const { roleName, roleDesc, id } = req.body;

			const sql = 'UPDATE role SET role_name=?, role_desc=? WHERE id=?';

			await db.query(sql, [roleName, roleDesc, id]);

			res.status(200).json({
				status: 200,
				message: 'OK',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.error(err.message);
			res.status(500).json({
				status: 500,
				message: 'Update role failed',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/role/delete
// @desc    Delete a role
// @access  private, admin only
router.post(
	'/delete',
	[
		auth,
		adminOnly,
		[
			check('id')
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

		const { id } = req.body;

		try {
			const sql = 'DELETE FROM role WHERE id = ?';
			await db.query(sql, id);

			return res.status(200).json({
				status: 200,
				message: 'Delete role success.',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.log('Failed to delete role, error : ', err.message);
			return res.status(500).json({
				status: 500,
				message: 'Failed to delete role',
				data: req.body,
				errors: err,
			});
		}
	}
);

module.exports = router;
