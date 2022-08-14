const db = require("../config/database");

const getNotificationMappings = async () => {
  const sql = `SELECT map.id, map.notification_type AS notificationType, map.employee_id AS employeeId,
        map.department_id AS departmentId, dept.department_name AS departmentName, notif.description AS notifTypeDescription,
        usr.name AS name
    FROM notification_mapping map 
        INNER JOIN user usr ON usr.employee_id = map.employee_id
        INNER JOIN department dept ON dept.id = map.department_id
        INNER JOIN notification_type notif ON notif.type = map.notification_type
    ORDER BY usr.name`;

  return await db.query(sql);
};

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
  departmentId,
  submittedTimeStart,
  submittedTimeEnd
) => {
  const sql = `SELECT COUNT(id) AS totalIdeasheet FROM ideabox WHERE status = 'OPEN' AND department_id = ? AND submitted_at BETWEEN ? AND ?`;

  const query = await db.query(sql, [
    departmentId,
    submittedTimeStart,
    submittedTimeEnd,
  ]);

  return query[0].totalIdeasheet;
};

const getTotalIdeasheetOfDepartmentManager = async (
  departmentIds,
  reviewedTimeStart,
  reviewedTimeEnd
) => {
  const sql = `SELECT COUNT(id) AS totalIdeasheet
    FROM ideabox 
    WHERE status = 'REVIEWED' AND department_id IN (${departmentIds}) AND reviewed_at BETWEEN ? AND ?`;

  const query = await db.query(sql, [reviewedTimeStart, reviewedTimeEnd]);
  return query[0].totalIdeasheet;
};

const getTotalIdeasheetOfKomite = async (
  approvedTimeStart,
  approvedTimeEnd
) => {
  const sql = `SELECT COUNT(id) AS totalIdeasheet
    FROM ideabox 
    WHERE status = 'APPROVED' AND approved_at BETWEEN ? AND ?`;

  const query = await db.query(sql, [approvedTimeStart, approvedTimeEnd]);
  return query[0].totalIdeasheet;
};

const getSectionManagerTobeNotified = async (
  departmentId,
  notificationType
) => {
  const sql = `SELECT usr.employee_id AS employeeId, apr.id AS approvalRole, usr.email
    FROM approval_role apr 
      INNER JOIN approval_role_mapping apm ON apm.role_id = apr.id
        INNER JOIN notification_mapping ntm ON ntm.employee_id = apm.employee_id
        INNER JOIN user usr ON usr.employee_id = apm.employee_id
    WHERE apr.id = 'SECTION_MANAGER' AND apm.department_id = ? AND ntm.notification_type = ?`;

  return await db.query(sql, [departmentId, notificationType]);
};

const getAllSectionManagerTobeNotified = async (notificationType) => {
  const sql = `SELECT usr.employee_id AS employeeId, apr.id AS approvalRole, usr.email
    FROM approval_role apr 
      INNER JOIN approval_role_mapping apm ON apm.role_id = apr.id
        INNER JOIN notification_mapping ntm ON ntm.employee_id = apm.employee_id
        INNER JOIN user usr ON usr.employee_id = apm.employee_id
    WHERE apr.id = 'SECTION_MANAGER' AND ntm.notification_type = ?`;

  return await db.query(sql, [notificationType]);
};

const getDepartmentManagerTobeNotified = async (
  departmentId,
  notificationType
) => {
  const sql = `SELECT usr.employee_id AS employeeId, apr.id AS approvalRole, usr.email
    FROM approval_role apr 
      INNER JOIN approval_role_mapping apm ON apm.role_id = apr.id
        INNER JOIN notification_mapping ntm ON ntm.employee_id = apm.employee_id
        INNER JOIN user usr ON usr.employee_id = apm.employee_id
    WHERE apr.id = 'DEPARTMENT_MANAGER' AND apm.department_id = ? AND ntm.notification_type = ?`;

  return await db.query(sql, [departmentId, notificationType]);
};

const getAllDepartmentManagerTobeNotified = async (notificationType) => {
  const sql = `SELECT usr.employee_id AS employeeId, apr.id AS approvalRole, usr.email
  FROM approval_role apr 
    INNER JOIN approval_role_mapping apm ON apm.role_id = apr.id
      INNER JOIN notification_mapping ntm ON ntm.employee_id = apm.employee_id
      INNER JOIN user usr ON usr.employee_id = apm.employee_id
  WHERE apr.id = 'DEPARTMENT_MANAGER' AND ntm.notification_type = ?
  GROUP BY usr.employee_id`;

  return await db.query(sql, [notificationType]);
};

const getNotificationMappingDepartmentsByEmployeeId = async (
  employeeId,
  notificationType
) => {
  const sql = `SELECT DISTINCT department_id AS departmentId 
      FROM notification_mapping 
      WHERE employee_id = ? AND notification_type = ?`;

  return await db.query(sql, [employeeId, notificationType]);
};

const getKomiteTobeNotified = async (departmentId, notificationType) => {
  const sql = `SELECT usr.employee_id AS employeeId, apr.id AS approvalRole, usr.email
    FROM approval_role apr 
      INNER JOIN approval_role_mapping apm ON apm.role_id = apr.id
        INNER JOIN notification_mapping ntm ON ntm.employee_id = apm.employee_id
        INNER JOIN user usr ON usr.employee_id = apm.employee_id
    WHERE apr.id = 'KOMITE_IDEABOX' AND ntm.notification_type = ? AND apm.department_id = ?`;

  return await db.query(sql, [notificationType, departmentId]);
};

const getSectionManagerTobeNotifiedDaily = async () => {
  const sql = ` SELECT usr.employee_id AS employeeId, apr.id AS approvalRole, usr.email, apm.department_id AS departmentId,
    ntm.notification_type
      FROM approval_role apr 
        INNER JOIN approval_role_mapping apm ON apm.role_id = apr.id
          INNER JOIN notification_mapping ntm ON ntm.employee_id = apm.employee_id
          INNER JOIN user usr ON usr.employee_id = apm.employee_id
      WHERE apr.id = 'SECTION_MANAGER' AND ntm.notification_type = 2`;

  const result = await db.query(sql);

  return result;
};

const getDepartmentManagerToBeNotifiedDaily = async () => {
  const sql = `SELECT usr.employee_id AS employeeId, usr.email, usr.name,
	GROUP_CONCAT(DISTINCT apm.department_id SEPARATOR ',') AS departmentIds 
    FROM approval_role apr 
      INNER JOIN approval_role_mapping apm ON apm.role_id = apr.id
        INNER JOIN notification_mapping ntm ON ntm.employee_id = apm.employee_id
        INNER JOIN user usr ON usr.employee_id = apm.employee_id
    WHERE apr.id = 'DEPARTMENT_MANAGER' AND ntm.notification_type = 2
    GROUP BY usr.employee_id, usr.email, usr.name`;

  const result = await db.query(sql);

  return result;
};

const getKomiteToBeNotifiedDaily = async () => {
  const sql = `SELECT usr.employee_id AS employeeId, usr.email, usr.name,
      GROUP_CONCAT(DISTINCT apm.department_id SEPARATOR ',') AS departmentIds
    FROM approval_role apr 
      INNER JOIN approval_role_mapping apm ON apm.role_id = apr.id
      INNER JOIN notification_mapping ntm ON ntm.employee_id = apm.employee_id
      INNER JOIN user usr ON usr.employee_id = apm.employee_id
    WHERE apr.id = 'KOMITE_IDEABOX' AND ntm.notification_type = 2
    GROUP BY usr.employee_id, usr.email, usr.name
    `;

  const result = await db.query(sql);

  return result;
};

module.exports = {
  getDepartmentByApprovalRoleEmployee,
  getNotificationMappingsByEmployeeId,
  getNotificationType,
  getMailAddressByRoleAndDepartment,
  getTotalIdeasheetOfSectionManager,
  getTotalIdeasheetOfDepartmentManager,
  getTotalIdeasheetOfKomite,
  getSectionManagerTobeNotified,
  getDepartmentManagerTobeNotified,
  getKomiteTobeNotified,
  getAllDepartmentManagerTobeNotified,
  getNotificationMappingDepartmentsByEmployeeId,
  getAllSectionManagerTobeNotified,
  getNotificationMappings,
  getSectionManagerTobeNotifiedDaily,
  getDepartmentManagerToBeNotifiedDaily,
  getKomiteToBeNotifiedDaily,
};
