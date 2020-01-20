const db = require('../config/database');
const moment = require('moment');

const isFileExist = async filename => {
	const sql = 'SELECT id FROM payslip WHERE filename = ?';
	const result = await db.query(sql, filename);

	return result.length > 0;
};

const isEmployeeFound = async employeeId => {
	const sqlCheck = 'SELECT user_id from user WHERE employee_id = ?';
	const result = await db.query(sqlCheck, employeeId);

	return result.length > 0;
};

const createPayslip = async (employeeId, employeeName, year, month, pdf, createdBy) => {
	const sql =
		'INSERT INTO payslip (employee_id, employee_name, year, month, filename, created_on, created_by) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?)';

	const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
	db.query(sql, [employeeId, employeeName, year, month, pdf, now, createdBy]);
};

const addUploadLog = async (filename, status, reason, employeeId) => {
	try {
		const now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
		const sql =
			'INSERT INTO payslip_log (upload_time, filename, status, reason, employee_id) VALUES (?, ?, ?, ?, ?)';
		db.query(sql, [now, filename, status, reason, employeeId]);
	} catch (error) {
		console.log('Failed add upload log :', error);
	}
};

module.exports = { isFileExist, isEmployeeFound, addUploadLog, createPayslip };
