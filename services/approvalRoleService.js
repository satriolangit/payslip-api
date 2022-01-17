const db = require("../config/database");

const mapUserToRole = async (approvalRoleId, employeeId, departments) => {
  await removeMapping(employeeId);

  departments.map(async (departmentId) => {
    await insertMapping(approvalRoleId, employeeId, departmentId);
  });
};

const insertMapping = async (approvalRoleId, employeeId, departmentId) => {
  const sql =
    "INSERT INTO approval_role_mapping (employee_id, role_id, department_id) VALUES (?,?,?)";

  await db.query(sql, [employeeId, approvalRoleId, departmentId]);
};

const removeMapping = async (employeeId) => {
  const sql = `DELETE FROM approval_role_mapping WHERE employee_Id = ?`;

  const result = await db.query(sql, [employeeId]);
  return result;
};

const removeMappingById = async (mappingId) => {
  const sql = `DELETE FROM approval_role_mapping WHERE id = ?`;
  console.log(sql);

  const result = await db.query(sql, [mappingId]);
  return result;
};

module.exports = { mapUserToRole, removeMapping, removeMappingById };
