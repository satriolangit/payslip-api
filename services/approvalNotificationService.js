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

  await db.query(sql, id);
};

const notifySectionManager = async (
  departmentId,
  departmentName,
  employeeName
) => {
  console.log("notify section manager start");
  const sectionManagers = await query.getSectionManagerTobeNotified(
    departmentId,
    1
  );

  console.log("section manager:", sectionManagers);

  const tos = sectionManagers.map((item) => {
    return item.email;
  });

  const subject = "Ideasheet yang harus diperiksa";

  const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk diperiksa`;

  try {
    if (tos.length > 0) {
      console.log("notifySectionManager: ", tos, message);
      mailSender.sendBulk(subject, tos, message);
    } else {
      console.log("notifySectionManager: no section manager found");
    }
  } catch (error) {
    console.log(error);
  }
};

const notifyDepartmentManager = async (
  departmentId,
  departmentName,
  employeeName
) => {
  const deptManagers = await query.getDepartmentManagerTobeNotified(
    departmentId,
    1
  );

  const tos = deptManagers.map((item) => {
    return item.email;
  });

  const subject = "Ideasheet yang harus disetujui";

  const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk disetujui`;

  if (tos.length > 0) {
    console.log("notifyDeptManager: ", tos, message);
    mailSender.sendBulk(subject, tos, message);
  } else {
    console.log("notifyDeptManager: no dept manager found");
  }
};

const notifyKomite = async (departmentName, employeeName) => {
  const komite = await query.getKomiteTobeNotified(1);

  const tos = komite.map((item) => {
    return item.email;
  });

  const subject = "Ideasheet yang harus diterima";

  const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk diterima`;

  if (tos.length > 0) {
    console.log("notifyKomite: ", tos.join(","), message);
    mailSender.sendBulk(subject, tos, message);
  } else {
    console.log("notifyKomite: no komite found");
  }
};

module.exports = {
  createMapping,
  removeMappingById,
  notifySectionManager,
  notifyDepartmentManager,
  notifyKomite,
};
