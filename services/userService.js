const db = require("../config/database");
const uuidv4 = require("uuid/v4");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const isUserAlreadyExist = async (employeeId) => {
  const sql = "SELECT user_id, role FROM user WHERE employee_id = ? LIMIT 1";
  let user = await db.query(sql, employeeId);
  return user.length > 0;
};

const isEmployeeIdIsTaken = async (employeeId) => {
  const sql = "SELECT user_id FROM user WHERE employee_id = ? LIMIT 1";
  let user = await db.query(sql, employeeId);
  return user.length > 0;
};

const registerUser = async (name, email, password, employeeId) => {
  //create new user
  const timestamp = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
  const sql =
    "INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const userId = uuidv4();

  await db.query(sql, [
    userId,
    hashedPassword,
    email,
    name,
    employeeId,
    "employee",
    "system",
    timestamp,
    1,
  ]);

  return userId;
};

const getDepartmentId = async (department) => {
  const sql = "SELECT id FROM department WHERE department_code=?";
  const result = await db.query(sql, department);

  return result[0].id;
};

const mapUserToDepartment = async (userId, departmentId, employeeId) => {
  const sql = `INSERT INTO user_department (user_id, department_id, employee_id) 
		VALUES (?, ?, ?)`;

  await removeMapping(userId, departmentId);
  await db.query(sql, [userId, departmentId, employeeId]);
};

const removeMapping = async (userId, departmentId) => {
  const sql = `DELETE FROM user_department WHERE user_id=? AND department_id=?`;
  await db.query(sql, [userId, departmentId]);
};

const createUser = async (
  name,
  email,
  password,
  employeeId,
  phone,
  role,
  createdBy,
  photo,
  isActive,
  siteName,
  departmentId
) => {
  //create new user
  const timestamp = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
  const sql =
    "INSERT INTO user (user_id, password, email, name, employee_id, role, created_by, created_on, is_active, phone, password_plain, photo, site_name) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = bcrypt.hashSync(password.toString(), salt);
  const userId = uuidv4();

  await db.query(sql, [
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
    siteName,
  ]);

  await mapUserToDepartment(userId, departmentId, employeeId);

  return userId;
};

const updateUserById = async (
  userId,
  name,
  email,
  employeeId,
  role,
  phone,
  photo,
  isActive,
  updatedBy,
  siteName,
  departmentId
) => {
  const timestamp = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
  const sql =
    "UPDATE user SET name = ?, email = ?, employee_id = ?, role = ?, phone = ?, photo = ?, is_active = ?, updated_by = ?, updated_on = ?, site_name = ? WHERE user_id = ?";

  await db.query(sql, [
    name,
    email,
    employeeId,
    role,
    phone,
    photo,
    isActive,
    updatedBy,
    timestamp,
    siteName,
    userId,
  ]);
};

const updateUserByEmployeeId = async (
  employeeId,
  name,
  email,
  role,
  phone,
  password,
  updatedBy,
  isActive,
  siteName,
  departmentId
) => {
  console.log("update user by employeeId");

  const timestamp = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
  const sql =
    "UPDATE user SET name = ?, email = ?, role = ?, phone = ?, password = ?, password_plain = ?, updated_by = ?, updated_on = ?, site_name = ? WHERE employee_id = ?";

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password.toString(), salt);

  await db.query(sql, [
    name,
    email,
    role,
    phone,
    hashedPassword,
    password,
    updatedBy,
    timestamp,
    siteName,
    employeeId,
  ]);

  const query = await db.query(
    "SELECT user_id AS userId FROM user WHERE employee_id = ?",
    employeeId
  );

  const userId = query[0].userId;
  await mapUserToDepartment(userId, departmentId, employeeId);
};

module.exports = {
  isUserAlreadyExist,
  registerUser,
  createUser,
  updateUserByEmployeeId,
  updateUserById,
  getDepartmentId,
};
