const db = require("../config/database");
const moment = require("moment");

const generateNumber = async () => {
  const sql =
    "SELECT idea_number as number FROM ideabox ORDER BY submitted_at DESC LIMIT 1";
  let query = await db.query(sql);
  const oldNumber = query[0].number;

  let number = `${moment.utc().format("YYYY-MM")}-0001`;

  if (query.length > 0) {
    let arrDate = oldNumber.split("-");

    const currYear = arrDate[0];
    const currMonth = arrDate[1];
    const currNumber = arrDate[2];

    const oldDate = moment.utc(`${currYear}-${currMonth}`);
    var now = moment.utc();
    const diff = now.diff(oldDate, "months");

    if (diff <= 0) {
      var temp = parseInt(currNumber) + 1;
      var newNumber =
        currNumber.substring(0, currNumber.length - temp.toString().length) +
        temp;
      number = `${currYear}-${currMonth}-${newNumber}`;
    }
  }

  return number;
};

const getNextAssignee = async (employeeId) => {
  const sql = `SELECT map.employee_id, apr.id as role_id, apr.next_role, apr.prev_role
		FROM approval_role_mapping map 
			INNER JOIN approval_role apr ON apr.id = map.role_id
		WHERE map.employee_id = ?`;

  const query = await db.query(sql, employeeId);

  let result = "NONE";

  if (query.length > 0) {
    result = query[0].next_role;
  }

  return result;
};

const getPrevAssignee = async (employeeId) => {
  const sql = `SELECT map.employee_id, apr.id as role_id, apr.next_role, apr.prev_role
		FROM approval_role_mapping map 
			INNER JOIN approval_role apr ON apr.id = map.role_id
		WHERE map.employee_id = ?`;

  const query = await db.query(sql, employeeId);

  let result = "NONE";

  if (query.length > 0) {
    result = query[0].prev_role;
  }

  return result;
};

const getApprovalRole = async (employeeId) => {
  const sql = `SELECT map.employee_id, apr.id as role_id, apr.next_role, apr.prev_role
		FROM approval_role_mapping map 
			INNER JOIN approval_role apr ON apr.id = map.role_id
		WHERE map.employee_id = ?`;

  const query = await db.query(sql, employeeId);

  return query[0];
};

const submit = async (master) => {
  var date = moment.utc().format("YYYY-MM-DD HH:mm:ss");
  console.log(date); // 2015-09-13 03:39:27
  var stillUtc = moment.utc(date).toDate();
  var timestamp = moment(stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  const {
    ideaType,
    submittedBy,
    tema,
    kaizenArea,
    isIdeaSheet,
    impactType,
    kaizenAmount,
    departmentId,
    employeeId,
  } = master;

  const sql =
    "INSERT INTO ideabox (idea_number, idea_type, submitted_by, submitted_at, tema, kaizen_area, pelaksanaan_ideasheet, impact_type, kaizen_amount, department_id, assigned_to, status) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const number = await generateNumber();
  const assignedTo = await getNextAssignee(employeeId);

  var result = await db.query(sql, [
    number,
    ideaType,
    submittedBy,
    timestamp,
    tema,
    kaizenArea,
    isIdeaSheet,
    impactType,
    kaizenAmount,
    departmentId,
    assignedTo,
    "OPEN",
  ]);

  console.log("submit ideabox, insertId :", result.insertId);

  return result.insertId;
};

const submitDetailUmum = async (ideaboxId, detail) => {
  const {
    beforeValueSummary,
    beforeValueImage,
    afterValueSummary,
    afterValueImage,
  } = detail;

  const sql = `INSERT INTO ideabox_detail (master_id, before_value_summary, before_image, after_value_summary, after_image)
		VALUES (?, ?, ?, ?, ?)`;

  await db.query(sql, [
    ideaboxId,
    beforeValueSummary,
    beforeValueImage,
    afterValueSummary,
    afterValueImage,
  ]);
};

const submitDetailKyt = async (ideaboxId, detail) => {
  const sql = `INSERT INTO ideabox_detail (master_id, before_value_summary, before_image, before_value_kapan, before_value_dimana,
		before_value_siapa, before_value_bagaimana, before_value_incident, before_value_situation, before_value_situation_image,
		after_value_summary, after_image, after_value_rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  console.log(sql);

  const {
    beforeValueSummary,
    beforeValueImage,
    beforeValueKapan,
    beforeValueDimana,
    beforeValueSiapa,
    beforeValueBagaimana,
    beforeValueIncident,
    beforeValueSituation,
    beforeValueSituationImage,
    afterValueSummary,
    afterValueImage,
    afterValueRank,
  } = detail;

  await db.query(sql, [
    ideaboxId,
    beforeValueSummary,
    beforeValueImage,
    beforeValueKapan,
    beforeValueDimana,
    beforeValueSiapa,
    beforeValueBagaimana,
    beforeValueIncident,
    beforeValueSituation,
    beforeValueSituationImage,
    afterValueSummary,
    afterValueImage,
    afterValueRank,
  ]);
};

const submitComment = async (ideaboxId, comment) => {
  const sql = `INSERT ideabox_comment (master_id, created_by, created_at, comment) VALUES (?,?,?,?)`;

  const { value, createdBy } = comment;

  var date = moment.utc().format("YYYY-MM-DD HH:mm:ss");
  var stillUtc = moment.utc(date).toDate();
  var timestamp = moment(stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  await db.query(sql, [ideaboxId, createdBy, timestamp, value]);
};

const submitImpact = async (ideaboxId, impactId) => {
  const command = "INSERT ideabox_impact (ideabox_id, impact_id) VALUES (?, ?)";
  await db.query(command, [ideaboxId, impactId]);
};

const approve = async (ideaboxId, employeeId) => {
  const approvalRole = await getApprovalRole(employeeId);
  const { role_id: roleId, next_role: assignedTo } = approvalRole;
  const now = moment.utc().format("YYYY-MM-DD HH:mm:ss");

  console.log(
    "approve: ",
    ideaboxId,
    employeeId,
    approvalRole,
    roleId,
    assignedTo
  );

  let sql = "";
  if (roleId === "SECTION_MANAGER") {
    sql = `UPDATE ideabox SET reviewed_by = ?, reviewed_at = ?, assigned_to = ?, status='REVIEWED' WHERE id = ?`;
  } else if (roleId === "DEPARTMENT_MANAGER") {
    sql = `UPDATE ideabox SET approved_by = ?, approved_at = ?, assigned_to = ?, status='APPROVED' WHERE id = ?`;
  } else if (roleId === "KOMITE_IDEABOX") {
    sql = `UPDATE ideabox SET approved_by = ?, approved_at = ?, assigned_to = ?, status = 'CLOSED' WHERE id = ?`;
  }

  console.log(sql);
  await db.query(sql, [employeeId, now, assignedTo, ideaboxId]);
};

const reject = async (ideaboxId, employeeId) => {
  const approvalRole = await getApprovalRole(employeeId);
  const { role_id: roleId, prev_role: assignedTo } = approvalRole;

  const sql = `UPDATE ideabox SET assigned_to = ?, status = 'REJECTED' WHERE id = ?`;
  await db.query(sql, [assignedTo, ideaboxId]);
};

const remove = async (ideaboxId) => {
  const query1 = "DELETE FROM ideabox WHERE id = ?";
  const query2 = "DELETE FROM ideabox_detail WHERE master_id = ?";
  const query3 = "DELETE FROM ideabox_comment WHERE master_id = ?";

  await db.query(query1, ideaboxId);
  await db.query(query2, ideaboxId);
  await db.query(query3, ideaboxId);
};

module.exports = {
  submit,
  submitDetailUmum,
  submitDetailKyt,
  submitComment,
  generateNumber,
  approve,
  remove,
  reject,
  submitImpact,
};
