const db = require("../config/database");
const query = require("../queries/approvalNotificationQuery");
const mailSender = require("../services/mailSender");

const createMapping = async (notificationType, employeeId, departmentId) => {
  const sql = `INSERT INTO notification_mapping (notification_type, employee_id, department_id) 
        VALUES (?, ?, ?)`;

  await db.query(sql, [notificationType, employeeId, departmentId]);
};

const removeMappingById = async (id) => {
  const sql = "DELETE FROM notification_mapping WHERE id = ?";

  await db.query(sql);
};

const notifySectionManager = (departmentId, departmentName, employeeName) => {
  const tos = query.getMailAddressByRoleAndDepartment(
    "SECTION_MANAGER",
    departmentId
  );

  const subject = "Ideasheet yang harus diperiksa";

  const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk diperiksa`;

  if (tos.length > 0) {
    console.log("notifySectionManager: ", tos.join(","), message);
  } else {
    console.log("notifySectionManager: no section manager found");
  }
};

const notifyDepartmentManager = (
  departmentId,
  departmentName,
  employeeName
) => {
  const tos = query.getMailAddressByRoleAndDepartment(
    "DEPARTMENT_MANAGER",
    departmentId
  );

  const subject = "Ideasheet yang harus disetujui";

  const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk disetujui`;

  if (tos.length > 0) {
    console.log("notifyDeptManager: ", tos.join(","), message);
  } else {
    console.log("notifyDeptManager: no dept manager found");
  }
};

const notifyKomite = (departmentId, departmentName, employeeName) => {
  const tos = query.getMailAddressByRoleAndDepartment(
    "KOMITE_IDEABOX",
    departmentId
  );

  const subject = "Ideasheet yang harus diterima";

  const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk diterima`;

  if (tos.length > 0) {
    console.log("notifySectionManager: ", tos.join(","), message);
  } else {
    console.log("notifySectionManager: no section manager found");
  }
};

module.exports = {
  createMapping,
  removeMappingById,
  notifySectionManager,
  notifyDepartmentManager,
  notifyKomite,
};
