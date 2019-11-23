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

// @route   GET api/todo
// @desc    Get all todolist
// @access  Private
router.get('/', auth, async (req, res) => {
	try {
		const sql =
			'select t.id, t.todo, t.start, t.end, t.created_on, t.created_by, u.name ' +
			'From todo_list t left join user u on u.employee_id = t.employee_id' +
			'ORDER BY start';
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
			message: 'Failed to get todo lists',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/todo/:employeeId
// @desc    Get all todolist
// @access  Private
router.get('/:employeeId', auth, async (req, res) => {
	try {
		const sql =
			'select t.id, t.todo, t.start, t.end, t.created_on, t.created_by, u.name ' +
			'From todo_list t left join user u on u.employee_id = t.employee_id WHERE t.employee_id = ? ORDER BY start';
		const data = await db.query(sql, req.params.employeeId);

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
			message: 'Failed to get todo lists',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/todo/latest
// @desc    Get 5 latest todolist
// @access  Private
router.get('/', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM todo_list ORDER BY start LIMIT 5';
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
			message: 'Failed to get todo lists',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/todo/limit/:limit
// @desc    Get ?limit latest todolist
// @access  Private
router.get('/limit/:limit', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM todo_list ORDER BY start LIMIT ?';
		const data = await db.query(sql, req.params.limit);

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
			message: 'Failed to get todo lists',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/todo/latest/:employeeId
// @desc    Get 5 latest todolist of selected employee
// @access  Private
router.get('/latest/:employeeId', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM todo_list WHERE employee_id = ? ORDER BY start LIMIT 5';
		const data = await db.query(sql, req.params.employeeId);

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
			message: 'Failed to get todo lists of employee',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/todo/:limit/:offset
// @desc    Get pagination todo list
// @access  Private
router.get('/:limit/:offset', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM todo_list ORDER BY start LIMIT ?,?';
		const data = await db.query(sql, [req.params.offset, req.params.limit]);

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
			message: 'Failed to get todo lists',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/todo/:employeeId/:limit/:offset
// @desc    Get pagination todo list of selected employee
// @access  Private
router.get('/:employeeId/:limit/:offset', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM todo_list WHERE employee_id = ? ORDER BY start LIMIT ?,?';
		const data = await db.query(sql, [req.params.employeeId, req.params.offset, req.params.limit]);

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
			message: 'Failed to get todo lists',
			data: req.body,
			errors: err,
		});
	}
});

// @route   POST api/todo
// @desc    Create new todo list
// @access  Private
router.post(
	'/',
	[
		auth,
		[
			check('start', 'Please enter start time')
				.not()
				.isEmpty(),
			check('end', 'Please enter end time')
				.not()
				.isEmpty(),
			check('todo', 'Please enter text')
				.not()
				.isEmpty(),
			check('employeeId', 'Please fill employeeId')
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
			const { start, end, todo, employeeId } = req.body;
			const startTime = moment(start).format('YYYY-MM-DD HH:mm:ss');
			const endTime = moment(end).format('YYYY-MM-DD HH:mm:ss');

			const sql =
				'INSERT INTO todo_list (id, start, end, todo, created_on, created_by, employee_id) ' +
				'VALUES (?, ?, ?, ?, ?)';

			await db.query(sql, [uid, startTime, endTime, todo, timestamp, createdBy, employeeId]);

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
				message: 'Create new todo list failed.',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/todo/update
// @desc    Update existing todo list
// @access  Private
router.post(
	'/update',
	[
		auth,
		[
			check('start', 'Please enter start time')
				.not()
				.isEmpty(),
			check('end', 'Please enter end time')
				.not()
				.isEmpty(),
			check('todo', 'Please enter text')
				.not()
				.isEmpty(),
			check('id', 'Please provide todo list id')
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
			const { start, end, todo, id, employeeId } = req.body;
			const startTime = moment(start).format('YYYY-MM-DD HH:mm:ss');
			const endTime = moment(end).format('YYYY-MM-DD HH:mm:ss');

			//check if createdBy === loggedUserId
			let sql = 'SELECT todo FROM todo_list created_by=? AND id=?';
			const rows = await db.query(sql, createdBy, id);

			if (rows.length > 0) {
				//employee update his/her todo list
				sql = 'UPDATE todo_list SET start=?, end=?, todo=? WHERE id=?';

				await db.query(sql, [startTime, endTime, todo, id]);

				res.status(200).json({
					status: 200,
					message: 'OK',
					data: req.body,
					errors: null,
				});
			} else {
				//administrator update employee todo list
				sql = 'UPDATE todo_list SET start=?, end=?, todo=?, employee_id=? WHERE id=?';

				await db.query(sql, [startTime, endTime, todo, employeeId, id]);

				res.status(200).json({
					status: 200,
					message: 'OK',
					data: req.body,
					errors: null,
				});
			}
		} catch (err) {
			console.error(err.message);
			res.status(500).json({
				status: 500,
				message: 'Update todo list failed',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/todo/delete
// @desc    Delete a todo list
// @access  private
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
			//check if createdBy === loggedUserId
			let sql = 'SELECT todo FROM todo_list created_by=? AND id=?';
			const rows = await db.query(sql, createdBy, id);

			sql = 'DELETE FROM todo_list WHERE id = ?';
			await db.query(sql, id);

			return res.status(200).json({
				status: 200,
				message: 'Delete todo list success.',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.log('Failed to delete todo list, error : ', err.message);
			return res.status(500).json({
				status: 500,
				message: 'Failed to delete todo list',
				data: req.body,
				errors: err,
			});
		}
	}
);

module.exports = router;
