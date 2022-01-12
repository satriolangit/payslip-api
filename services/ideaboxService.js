const db = require("../config/database");
const moment = require("moment");
const repo = require("./../repositories/ideaboxRepository");

const generateNumber = async () => {
  const sql =
    "SELECT idea_number as number FROM ideabox ORDER BY submitted_at DESC LIMIT 1";
  let query = await db.query(sql);

  let number = `${moment.utc().format("YYYY-MM")}-0001`;

  if (query.length > 0) {
    const oldNumber = query[0].number;
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

const submit = async (master) => {
  var date = moment.utc().format("YYYY-MM-DD HH:mm:ss");
  var stillUtc = moment.utc(date).toDate();
  var timestamp = moment(stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  const {
    ideaType,
    submittedBy,
    tema,
    kaizenArea,
    isIdeasheet,
    impactType,
    kaizenAmount,
    departmentId,
    employeeId,
    approvalRole,
  } = master;

  const sql =
    "INSERT INTO ideabox (idea_number, idea_type, submitted_by, submitted_at, tema, kaizen_area, pelaksanaan_ideasheet, impact_type, kaizen_amount, department_id, assigned_to, status) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const number = await generateNumber();

  const assignedTo =
    approvalRole !== "EMPLOYEE"
      ? await repo.getNextAssignee(employeeId)
      : "EMPLOYEE";

  var result = await db.query(sql, [
    number,
    ideaType,
    submittedBy,
    timestamp,
    tema,
    kaizenArea,
    isIdeasheet,
    impactType,
    kaizenAmount,
    departmentId,
    assignedTo,
    "OPEN",
  ]);

  const ideaboxId = result.insertId;

  return ideaboxId;
};

const submitDetailUmum = async (ideaboxId, detail) => {
  const { beforeSummary, beforeImage, afterSummary, afterImage } = detail;

  const sql = `INSERT INTO ideabox_detail (master_id, before_value_summary, before_image, after_value_summary, after_image)
		VALUES (?, ?, ?, ?, ?)`;

  await db.query(sql, [
    ideaboxId,
    beforeSummary,
    beforeImage,
    afterSummary,
    afterImage,
  ]);
};

const submitDetailKyt = async (ideaboxId, detail) => {
  const sql = `INSERT INTO ideabox_detail (master_id, before_value_summary, before_image, before_value_kapan, 
    before_value_dimana,
		before_value_siapa, before_value_apa, before_value_bagaimana, before_value_incident, 
    before_value_situation,
		after_value_summary, after_image, after_value_rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const {
    beforeSummary,
    beforeImage,
    beforeKapan,
    beforeDimana,
    beforeSiapa,
    beforeApa,
    beforeBagaimana,
    beforeIncident,
    beforeSituation,
    afterSummary,
    afterImage,
    afterRank,
  } = detail;

  await db.query(sql, [
    ideaboxId,
    beforeSummary,
    beforeImage,
    beforeKapan,
    beforeDimana,
    beforeSiapa,
    beforeApa,
    beforeBagaimana,
    beforeIncident,
    beforeSituation,
    afterSummary,
    afterImage,
    afterRank,
  ]);
};

const isCommentExist = async (ideaboxId, employeeId) => {
  const sql =
    "SELECT id FROM ideabox_comment WHERE master_id = ? AND created_by = ?";
  const comment = await db.query(sql, [ideaboxId, employeeId]);
  return comment.length > 0;
};

const submitComment = async (ideaboxId, comment) => {
  const { comment: message, createdBy } = comment;
  const isExist = await isCommentExist(ideaboxId, createdBy);

  if (isExist) {
    await updateComment(ideaboxId, comment);
  } else {
    await insertComment(ideaboxId, comment);
  }
};

const insertComment = async (ideaboxId, comment) => {
  const sql = `INSERT ideabox_comment (master_id, created_by, created_at, comment) VALUES (?,?,?,?)`;

  const { comment: message, createdBy } = comment;

  var date = moment.utc().format("YYYY-MM-DD HH:mm:ss");
  var stillUtc = moment.utc(date).toDate();
  var timestamp = moment(stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  await db.query(sql, [ideaboxId, createdBy, timestamp, message]);
};

const updateComment = async (ideaboxId, comment) => {
  const { comment: message, createdBy } = comment;
  const sql =
    "UPDATE ideabox_comment SET comment=?  WHERE master_id = ? AND created_by = ? ";
  await db.query(sql, [message, ideaboxId, createdBy]);
};

const deleteImpactByIdeaboxId = async (ideaboxId) => {
  const sql = "DELETE FROM ideabox_impact WHERE ideabox_id = ?";
  await db.query(sql, ideaboxId);
};

const submitImpact = async (ideaboxId, impactId) => {
  const command = "INSERT ideabox_impact (ideabox_id, impact_id) VALUES (?, ?)";
  await db.query(command, [ideaboxId, impactId]);
};

const update = async (ideabox) => {
  const sql = `UPDATE ideabox SET idea_type =?, tema = ?, kaizen_area = ?, 
    pelaksanaan_ideasheet = ?, kaizen_amount = ? WHERE id = ?`;

  const { ideaType, tema, kaizenArea, isIdeasheet, kaizenAmount, ideaboxId } =
    ideabox;

  await db.query(sql, [
    ideaType,
    tema,
    kaizenArea,
    isIdeasheet,
    kaizenAmount,
    ideaboxId,
  ]);
};

const updateDetail = async (data) => {
  const {
    beforeSummary,
    beforeImage,
    beforeKapan,
    beforeDimana,
    beforeSiapa,
    beforeApa,
    beforeBagaimana,
    beforeIncident,
    beforeSituation,
    afterSummary,
    afterImage,
    afterRank,
    id,
  } = data;

  const sql = `UPDATE ideabox_detail SET
      before_value_summary = ?
      ,before_image = ?
      ,before_value_kapan=?
      ,before_value_dimana=?
      ,before_value_siapa=?
      ,before_value_apa=?
      ,before_value_bagaimana=?
      ,before_value_incident=?
      ,before_value_situation=?
      ,after_value_summary=?
      ,after_image=?
      ,after_value_rank=?
      WHERE id=?`;

  await db.query(sql, [
    beforeSummary,
    beforeImage,
    beforeKapan,
    beforeDimana,
    beforeSiapa,
    beforeApa,
    beforeBagaimana,
    beforeIncident,
    beforeSituation,
    afterSummary,
    afterImage,
    afterRank,
    id,
  ]);
};

const replaceImpacts = async (ideaboxId, impacts) => {
  await deleteImpactByIdeaboxId(ideaboxId);

  impacts.map(async (item) => {
    await submitImpact(ideaboxId, item);
  });
};

const posting = async (ideaboxId, employeeId) => {
  console.log(
    "posting: ",
    ideaboxId,
    employeeId,
    "EMPLOYEE",
    "SECTION_MANAGER"
  );

  let sql =
    "UPDATE ideabox SET assigned_to = 'SECTION_MANAGER', status = 'POSTED' WHERE id = ? AND (status = 'OPEN' OR status = 'REJECTED')";

  console.log(sql);
  await db.query(sql, [ideaboxId]);
};

const approve = async (ideaboxId, employeeId) => {
  const approvalRole = await repo.getApprovalRole(employeeId);
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
    sql = `UPDATE ideabox SET accepted_by = ?, accepted_at = ?, assigned_to = ?, status = 'CLOSED' WHERE id = ?`;
  }

  console.log(sql);
  await db.query(sql, [employeeId, now, assignedTo, ideaboxId]);
};

const reject = async (ideaboxId, employeeId) => {
  const approvalRole = await repo.getApprovalRole(employeeId);
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
  update,
  updateComment,
  replaceImpacts,
  updateDetail,
  posting,
};
