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

//local lib
const auth = require('../middleware/auth');
const db = require('../config/database');
const adminOnly = require('../middleware/adminOnly');

//utils
const secretKey = config.get('jwtSecretKey');

router.post('/upload', (req, res) => {
	try {
		var form = new IncomingForm();

		form.on('fileBegin', async (name, file) => {
			file.path = __dirname + '/../public/payslip/' + file.name;
		});

		form.on('file', async (field, file) => {
			// Do something with the file
			// e.g. save it to the database
			// you can access it using file.path

			var pdf = file.name;
			var filenames = pdf.split('.');
			var year = filenames[0].split('_')[0].substring(0, 4);
			var month = filenames[0].split('_')[0].substring(4);
			var employeeId = filenames[0].split('_')[1];
			var employeeName = filenames[0]
				.replace(year, '')
				.replace(month, '')
				.replace(employeeId, '')
				.replace(/_/g, ' ')
				.trim();

			//save to db

			// const token = req.header('x-auth-token');
			// const decoded = jwt.verify(token, secretKey);
			// const createdBy = decoded.user.id;

			const sqlCheck = 'SELECT user_id from user WHERE employee_id = ?';
			const res = await db.query(sqlCheck, employeeId);

			if (res.length > 0) {
				const sql =
					'INSERT INTO payslip (employee_id, employee_name, year, month, filename, created_on, created_by) ' +
					'VALUES (?, ?, ?, ?, ?, ?, ?)';

				const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
				await db.query(sql, [employeeId, employeeName, year, month, pdf, now, 0]);

				await addUploadLog(pdf, 'OK', '', employeeId);
			} else {
				//delete file
				const path = './public/payslip/' + pdf;
				console.log('path:', path);
				fs.unlinkSync(path);

				await addUploadLog(pdf, 'NOT OK', 'NIK not found', employeeId);
			}
		});

		form.on('end', () => {
			res.json();
		});
		form.parse(req);
	} catch (error) {
		console.log(error);
	}
});

const addUploadLog = async (filename, status, reason, employeeId) => {
	try {
		const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
		const sql =
			'INSERT INTO payslip_log (upload_time, filename, status, reason, employee_id) VALUES (?, ?, ?, ?, ?)';
		await db.query(sql, [now, filename, status, reason, employeeId]);
	} catch (error) {
		console.log('Failed add upload log :', error);
	}
};

router.get('/download/:filename', async (req, res) => {
	try {
		const filename = req.params.filename;
		const path = './public/payslip/' + filename;

		res.download(path);

		//set lastdownload & downloadcount
		let downloadCount = 0;
		let sql = 'SELECT IFNULL(download_count, 0) AS download_count FROM payslip WHERE filename = ? LIMIT 1';
		let result = await db.query(sql);
		const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
		if (result.length > 0) {
			downloadCount = res.download_count;
			sql = 'UPDATE payslip SET download_count = ?, last_download_on = ? WHERE filename = ?';
			await db.query(sql, [downloadCount++, now, filename]);
		}
	} catch (error) {
		console.log('error download payslip:', error);
	}
});

// @route   GET api/payslip
// @desc    Get all payslip
// @access  Private
router.get('/', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM payslip ORDER BY year, month DESC';
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
			message: 'Failed to get payslip',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/payslip/:employeeId
// @desc    Get employee payslip
// @access  Private
router.get('/:employeeId', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM payslip WHERE employee_id = ? ORDER BY year, month DESC';
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
			message: 'Failed to get payslip',
			data: req.body,
			errors: err,
		});
	}
});

// @route   GET api/payslip/:employeeId/:limit
// @desc    Get employee payslip top limit
// @access  Private
router.get('/:employeeId/:limit', auth, async (req, res) => {
	try {
		const sql = 'SELECT * FROM payslip WHERE employee_id = ? ORDER BY year, month DESC LIMIT ' + req.params.limit;
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
			message: 'Failed to get payslip',
			data: req.body,
			errors: err,
		});
	}
});

// @route   POST api/payslip/delete
// @desc    Delete a payslip
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

		const { id, filename } = req.body;
		console.log(req.body);
		try {
			const sql = 'DELETE FROM payslip WHERE id = ?';
			await db.query(sql, id);

			//delete file
			const path = './public/payslip/' + filename;
			console.log('path:', path);
			fs.unlinkSync(path);

			return res.status(200).json({
				status: 200,
				message: 'Successfully delete payslip',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.log('Failed to delete payslip, error : ', err.message);
			return res.status(500).json({
				status: 500,
				message: 'Failed to delete user',
				data: req.body,
				errors: err,
			});
		}
	}
);

// @route   POST api/payslip/deletes
// @desc    Delete a payslip
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
		console.log(req.body);
		try {
			for (i = 0; i < ids.length; i++) {
				const id = ids[i].split(';')[0];
				const filename = ids[i].split(';')[1];

				let sql = 'DELETE FROM payslip WHERE id = ?';
				await db.query(sql, id);

				//delete file
				const path = './public/payslip/' + filename;
				console.log('path:', path);
				fs.unlinkSync(path);

				console.log('id:', id, 'filename:', filename);
			}

			return res.status(200).json({
				status: 200,
				message: 'Successfully delete payslip',
				data: req.body,
				errors: null,
			});
		} catch (err) {
			console.log('Failed to delete payslip, error : ', err.message);
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
