const db = require("../config/database");
const query = require("../queries/approvalNotificationQuery");
const mailSender = require("../services/mailSender");
const moment = require("moment");

const isMappingExist = async (employeeId, departmentId) => {
  const sql = `SELECT COUNT(id) total FROM notification_mapping 
    WHERE employee_id = ? AND department_id = ?`;

  const result = await db.query(sql, [employeeId, departmentId]);
  return result[0].total > 0;
};

const createMapping = async (notificationType, employeeId, departmentId) => {
  const isExist = await isMappingExist(employeeId, departmentId);

  const sql = `INSERT INTO notification_mapping (notification_type, employee_id, department_id) 
        VALUES (?, ?, ?)`;

  if (!isExist)
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
  const sectionManagers = await query.getSectionManagerTobeNotified(
    departmentId,
    1
  );

  if (sectionManagers.length > 0) {
    const tos = sectionManagers.map((item) => {
      return item.email;
    });

    const subject = "Ideasheet yang harus diperiksa";
    const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk diperiksa`;

    try {
      console.log("notifySectionManager: ", tos, message);
      mailSender.sendBulk(subject, tos, message);
    } catch (error) {
      console.log(error);
    }
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

  if (deptManagers.length > 0) {
    const tos = deptManagers.map((item) => {
      return item.email;
    });

    const subject = "Ideasheet yang harus disetujui";
    const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk disetujui`;

    try {
      console.log("notifyDeptManager: ", tos, message);
      mailSender.sendBulk(subject, tos, message);
    } catch (error) {
      console.log(error);
    }
  }
};

const notifyKomite = async (departmentName, employeeName) => {
  const komite = await query.getKomiteTobeNotified(1);

  if (komite.length > 0) {
    const tos = komite.map((item) => {
      return item.email;
    });

    const subject = "Ideasheet yang harus diterima";

    const message = `Anda mendapat form idea sheet baru atas nama ${employeeName} dari departemen ${departmentName} untuk diterima`;

    try {
      console.log("notifyKomite: ", tos, message);
      mailSender.sendBulk(subject, tos, message);
    } catch (error) {
      console.log(error);
    }
  }
};

const dailyNotification = async () => {
  //notify section manager
  const sectionManagers = await query.getAllSectionManagerTobeNotified(2);

  sectionManagers.map(async (item) => {
    await sendDailyNotifForSectionManager(item.departmentId, item.email);
  });

  //notify department manager
  // const departmentManagers = await query.getAllDepartmentManagerTobeNotified(2);

  // departmentManagers.map(async (item) => {
  //   await sendDailyNotifForDepartmentManager(item.employeeId, item.email);
  // });

  // //notify komite
  // const komite = await query.getKomiteTobeNotified(2);

  // komite.map(async (item) => {
  //   await sendDailyNotifForKomite(item.email);
  // });
};

const sendDailyNotifForSectionManager = async (departmentId, email) => {
  try {
    const yesterday = moment().add(-1, "days");
    const start = yesterday.format("YYYY-MM-DD 00:00");
    const end = yesterday.format("YYYY-MM-DD 23:59");
    const date = yesterday.format("DD MMMM YYYY");

    const total = await query.getTotalIdeasheetOfSectionManager(
      departmentId,
      start,
      end
    );
    const subject = "Ideasheet yang harus diperiksa";
    const message = `anda mendapat form idea sheet baru sejumlah ${total} form yang disubmit tanggal ${date} untuk diperiksa`;

    if (total > 0) mailSender.send(subject, email, message);
  } catch (error) {
    console.log(error);
  }
};

const sendDailyNotifForDepartmentManager = async (employeeId, email) => {
  try {
    const yesterday = moment().add(-1, "days");
    const start = yesterday.format("YYYY-MM-DD 00:00");
    const end = yesterday.format("YYYY-MM-DD 23:59");
    const date = yesterday.format("DD MMMM YYYY");

    let departmentIds = "";
    const departments =
      await query.getNotificationMappingDepartmentsByEmployeeId(employeeId);

    if (departments.length > 0) {
      departmentIds = departments.map((x) => {
        return x;
      });

      const total = await query.getTotalIdeasheetOfDepartmentManager(
        departmentIds,
        start,
        end
      );
      const subject = "Ideasheet yang harus diterima";
      const message = `anda mendapat form idea sheet baru sejumlah ${total} form yang disetujui tanggal ${date} untuk diterima`;
      if (total > 0) mailSender.send(subject, email, message);
    }
  } catch (error) {
    console.log(error);
  }
};

const sendDailyNotifForKomite = async (email) => {
  try {
    const yesterday = moment().add(-1, "days");
    const start = yesterday.format("YYYY-MM-DD 00:00");
    const end = yesterday.format("YYYY-MM-DD 23:59");
    const date = yesterday.format("DD MMMM YYYY");

    const total = await query.getTotalIdeasheetOfKomite(start, end);
    const subject = "Ideasheet yang harus diterima";
    const message = `anda mendapat form idea sheet baru sejumlah ${total} form yang disetujui tanggal ${date} untuk diterima`;

    if (total > 0) mailSender.send(subject, email, message);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  createMapping,
  removeMappingById,
  notifySectionManager,
  notifyDepartmentManager,
  notifyKomite,
  dailyNotification,
};
