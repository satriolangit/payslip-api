const db = require("../config/database");

const getNotificationMappingsByEmployeeId = async (employeeId) => {
  const sql = `SELECT map.id, map.notification_type AS notificationType, map.employee_id AS employeeId,
        map.department_id AS departmentId, dept.department_name AS departmentName, notif.description AS notifTypeDescription,
        usr.name AS name
    FROM notification_mapping map 
        INNER JOIN user usr ON usr.employee_id = map.employee_id
        INNER JOIN department dept ON dept.id = map.department_id
        INNER JOIN notification_type notif ON notif.type = map.notification_type
    WHERE map.employee_id = ?`;

  return await db.query(sql, employeeId);
};

const getNotificationType = async () => {
  const sql = `SELECT type, description FROM notification_type`;
  return await db.query(sql);
};

const getDepartmentByApprovalRoleEmployee = async (employeeId) => {
  const sql = `SELECT roleMap.employee_id AS employeeId, roleMap.department_id AS departmentId, dept.department_name AS departmentName 
        FROM approval_role_mapping roleMap  
            LEFT JOIN department dept ON roleMap.department_id = dept.id
        WHERE roleMap.employee_id = ?
        ORDER BY dept.department_name`;

  return await db.query(sql, employeeId);
};

const getMailAddressByRoleAndDepartment = async (role, departmentId) => {
  const sql = `SELECT usr.email 
        FROM approval_role_mapping map INNER JOIN user usr ON usr.employee_id = map.employee_id
        WHERE map.role_id = ? AND map.department_id = ?`;

  return await db.query(sql, [role, departmentId]);
};

const getTotalIdeasheetOfSectionManager = async (
  departmentIds,
  submittedTimeStart,
  submittedTimeEnd
) => {
  let departments = "0";
  if (departmentIds.length > 0) departments = departmentIds.join(",");
  const sql = `SELECT COUNT(id) AS totalIdeasheet
    FROM ideabox 
    WHERE status = 'OPEN' AND department_id IN (${departments}) 
    AND submitted_at BETWEEN ? AND ?`;

  const query = await db.query(submittedTimeStart, submittedTimeEnd);

  return query[0].totalIdeasheet;
};

const getTotalIdeasheetOfDepartmentManager = async (
  departmentIds,
  reviewedTimeStart,
  reviewedTimeEnd
) => {
  let departments = "0";
  if (departmentIds.length > 0) departments = departmentIds.join(",");
  const sql = `SELECT COUNT(id) AS totalIdeasheet
    FROM ideabox 
    WHERE status = 'REVIEWED' AND department_id IN (1,2) AND reviewed_at BETWEEN ? AND '2022-01-20 23:59'`;

  const query = await db.query(reviewedTimeStart, reviewedTimeEnd);
  return query[0].totalIdeasheet;
};

const getTotalIdeasheetOfKomite = async (
  approvedTimeStart,
  approvedTimeEnd
) => {
  const sql = `SELECT COUNT(id) AS totalIdeasheet
    FROM ideabox 
    WHERE status = 'APPROVED' AND approved_at BETWEEN ? AND ?`;

  const query = await db.query(approvedTimeStart, approvedTimeEnd);
  return query[0].totalIdeasheet;
};

module.exports = {
  getDepartmentByApprovalRoleEmployee,
  getNotificationMappingsByEmployeeId,
  getNotificationType,
  getMailAddressByRoleAndDepartment,
  getTotalIdeasheetOfSectionManager,
  getTotalIdeasheetOfDepartmentManager,
  getTotalIdeasheetOfKomite,
};
