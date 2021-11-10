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

const createUser = async (name, email, password, employeeId, phone, role, createdBy, photo, isActive, siteName) => {
	//create new user
	const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
	const sql =
		'INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active, phone, password_plain, photo, site_name) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = bcrypt.hashSync(password.toString(), salt);
	const userId = uuidv4();

	db.query(sql, [
		userId,
		hashedPassword,
		email,
		name,
		employeeId,
		role,
		createdBy,
		timestamp,
		isActive,
		phone,
		password,
		photo,
		siteName
	]);

	return userId;
};

const updateUserById = async (userId, name, email, employeeId, role, phone, photo, isActive, updatedBy, siteName) => {
	const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
	const sql = 'UPDATE user SET name = ?, email = ?, employee_id = ?, role = ?, phone = ?, photo = ?, is_active = ?, updated_by = ?, updated_on = ?, site_name = ? WHERE user_id = ?';
	
	await db.query(sql, [name, email, employeeId, role, phone, photo, isActive, updatedBy, timestamp, siteName, userId]);

	//await db.query(sql, [name, siteName]);
};

const updateUserByEmployeeId = async (employeeId, name, email, role, phone, password, updatedBy, isActive, site) => {
	console.log('update user by employeeId');

	const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
	const sql =
		'UPDATE user SET name = ?, email = ?, role = ?, phone = ?, password = ?, password_plain = ?, updated_by = ?, updated_on = ?, site_name = ? WHERE employee_id = ?';

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password.toString(), salt);

	await db.query(sql, [name, email, role, phone, hashedPassword, password, updatedBy, timestamp, employeeId, siteName]);
};

module.exports = {
	isUserAlreadyExist,
	registerUser,
	createUser,
	updateUserByEmployeeId,
	updateUserById,
};
