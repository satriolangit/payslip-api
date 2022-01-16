const db = require("../config/database");

const mapUserToRole = async (approvalRoleId, employeeId) => {
  const sql = `INSERT INTO approval_role_mapping (employee_id, role_id) VALUES (?, ?)`;

  const result = await db.query(sql, [employeeId, approvalRoleId]);
  return result;
};

const removeMapping = async (employeeId) => {
  const sql = `DELETE FROM approval_role_mapping WHERE employee_Id = ?`;

  const result = await db.query(sql, [employeeId]);
  return result;
};

module.exports = { mapUserToRole, removeMapping };
