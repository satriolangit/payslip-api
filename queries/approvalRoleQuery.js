const db = require("../config/database");

const getApprovalRoleMapping = async () => {
  const sql = `SELECT mapping.id AS mappingId, mapping.role_id AS approvalRoleId, mapping.employee_id AS employeeId,
        usr.name AS username, dept.department_name AS department, usr.email
        FROM approval_role_mapping mapping 
          INNER JOIN user usr ON usr.employee_id = mapping.employee_id
          LEFT JOIN department dept ON dept.id = mapping.department_id`;

  const result = await db.query(sql);
  return result;
};

const searchApprovalRoleMapping = async (keywords) => {
  const sql = `SELECT mapping.id AS mappingId, mapping.role_id AS approvalRoleId, mapping.employee_id AS employeeId,
            usr.name AS username, dept.department_name AS department, usr.email
        FROM approval_role_mapping mapping INNER JOIN user usr ON usr.employee_id = mapping.employee_id
        LEFT JOIN department dept ON dept.id = mapping.department_id
        WHERE mapping.role_id LIKE ? OR mapping.employee_id LIKE ? OR usr.name LIKE ?`;

  const result = await db.query(sql, [
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
  ]);

  return result;
};

const getUserThatNotMapped = async () => {
  const sql = `SELECT user_id AS userId, name, employee_id AS employeeId, email
        FROM user 
        WHERE employee_id NOT IN (SELECT employee_id FROM approval_role_mapping)
            AND is_active = 1`;

  const result = await db.query(sql);

  return result;
};

const searchUser = async (keywords) => {
  const sql = `SELECT user_id AS userId, name, employee_id AS employeeId, email
        FROM user 
        WHERE employee_id NOT IN (SELECT employee_id FROM approval_role_mapping)
            AND is_active = 1 AND (name LIKE ? OR employee_id LIKE ? OR email LIKE ?)`;

  const result = await db.query(sql, [
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
  ]);

  return result;
};

const getActiveUsers = async () => {
  const sql = `SELECT user_id AS userId, employee_id AS employeeId, name, site_name AS siteName
    FROM user 
    WHERE is_active = 1 AND (site_name = 'ALL' OR site_name = 'IDEABOX')
    ORDER BY name, employee_id`;

  const result = await db.query(sql);
  return result;
};

module.exports = {
  getApprovalRoleMapping,
  getUserThatNotMapped,
  searchApprovalRoleMapping,
  searchUser,
  getActiveUsers,
};
