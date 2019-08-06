const db = require('../config/database');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const bcrypt = require('bcryptjs');

const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

const isUserAlreadyExist = async email => {
	const sql = 'SELECT user_id, role FROM user WHERE email = ? LIMIT 1';
	let user = await db.query(sql, email);
	return user.length > 0;
};

const registerUser = async (name, email, password, employeeId) => {
	//create new user
	const sql =
		'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	const userId = uuidv4();

	await db.query(sql, [userId, hashedPassword, email, name, employeeId, 'employee', 'system', timestamp, 1]);

	return userId;
};

module.exports = {
	isUserAlreadyExist,
	registerUser,
};
