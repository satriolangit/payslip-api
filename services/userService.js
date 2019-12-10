const db = require('../config/database');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const isUserAlreadyExist = async employeeId => {
	const sql = 'SELECT user_id, role FROM user WHERE employee_id = ? LIMIT 1';
	let user = await db.query(sql, employeeId);
	return user.length > 0;
};

const isEmployeeIdIsTaken = async employeeId => {
	const sql = 'SELECT user_id FROM user WHERE employee_id = ? LIMIT 1';
	let user = await db.query(sql, employeeId);
	return user.length > 0;
};

const registerUser = async (name, email, password, employeeId) => {
	//create new user
	const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
	const sql =
		'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	const userId = uuidv4();

	await db.query(sql, [userId, hashedPassword, email, name, employeeId, 'employee', 'system', timestamp, 1]);

	return userId;
};

const createUser = async (name, email, password, employeeId, phone, role, createdBy) => {
	//create new user
	const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
	const sql =
		'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active, phone, password_plain) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = bcrypt.hashSync(password.toString(), salt);
	const userId = uuidv4();

	db.query(sql, [userId, hashedPassword, email, name, employeeId, role, createdBy, timestamp, 1, phone, password]);

	return userId;
};

const updateUserByUserId = async (userId, name, role, phone, password) => {
	console.log('update user service');
};

const updateUserByEmployeeId = async (employeeId, name, email, role, phone, password, updatedBy) => {
	console.log('update user by employeeId');

	const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
	const sql =
		'UPDATE user SET name = ?, email = ?, role = ?, phone = ?, password = ?, password_plain = ?, updated_by = ?, updated_on = ? WHERE employee_id = ?';

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password.toString(), salt);

	await db.query(sql, [name, email, role, phone, hashedPassword, password, updatedBy, timestamp, employeeId]);
};

module.exports = {
	isUserAlreadyExist,
	registerUser,
	createUser,
	updateUserByEmployeeId,
};
