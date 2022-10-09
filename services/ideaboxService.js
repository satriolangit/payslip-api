const db = require("../config/database");
const moment = require("moment");
const repo = require("./../repositories/ideaboxRepository");
const notifService = require("./approvalNotificationService");
const generatePdf = require("../utils/pdfGenerator");
const logger = require("../utils/logger");
const appRoot = require("app-root-path");
const appConfig = require("config");
const path = require("path");

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
  // var date = moment.utc().format("YYYY-MM-DD HH:mm:ss");
  // var stillUtc = moment.utc(date).toDate();
  var timestamp = moment().format("YYYY-MM-DD HH:mm:ss"); //moment(stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

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
      ? await repo.getNextAssignee(submittedBy)
      : "SECTION_MANAGER";

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
  const { createdBy, value } = comment;
  const isExist = await isCommentExist(ideaboxId, createdBy);

  console.log("submitComment :", comment);

  if (isExist) {
    await updateComment({ ideaboxId, comment: value, createdBy });
  } else {
    await insertComment({ ideaboxId, comment: value, createdBy });
  }
};

const insertComment = async ({ ideaboxId, comment, createdBy }) => {
  const sql = `INSERT ideabox_comment (master_id, created_by, created_at, comment) VALUES (?,?,?,?)`;

  console.log("insertComment :", comment);

  var date = moment.utc().format("YYYY-MM-DD HH:mm:ss");
  var stillUtc = moment.utc(date).toDate();
  var timestamp = moment(stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  await db.query(sql, [ideaboxId, createdBy, timestamp, comment]);
};

const updateComment = async ({ ideaboxId, comment, createdBy }) => {
  const sql =
    "UPDATE ideabox_comment SET comment=?  WHERE master_id = ? AND created_by = ? ";
  await db.query(sql, [comment, ideaboxId, createdBy]);
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
  let sql =
    "UPDATE ideabox SET assigned_to = 'SECTION_MANAGER', status = 'POSTED' WHERE id = ? AND (status = 'OPEN' OR status = 'REJECTED')";

  await db.query(sql, [ideaboxId]);
};

const approve = async (ideaboxId, employeeId) => {
  const approvalRole = await repo.getApprovalRole(employeeId);
  const ideabox = await repo.geetIdeaboxByid(ideaboxId);
  const { role_id: roleId, next_role: assignedTo } = approvalRole;
  const now = moment().format("YYYY-MM-DD HH:mm:ss");

  const { status, departmentId, departmentName, submitterName } = ideabox;

  if (status === "REJECTED") return;

  let sql = "";
  if (roleId === "SECTION_MANAGER") {
    sql = `UPDATE ideabox SET reviewed_by = ?, reviewed_at = ?, assigned_to = ?, status='REVIEWED' WHERE id = ?`;

    notifService.notifyDepartmentManager(
      departmentId,
      departmentName,
      submitterName
    );
  } else if (roleId === "DEPARTMENT_MANAGER") {
    sql = `UPDATE ideabox SET approved_by = ?, approved_at = ?, assigned_to = ?, status='APPROVED' WHERE id = ?`;

    notifService.notifyKomite(departmentId, departmentName, submitterName);
  } else if (roleId === "KOMITE_IDEABOX") {
    logger.info("approve : " + roleId + " id :" + ideaboxId);
    sql = `UPDATE ideabox SET accepted_by = ?, accepted_at = ?, assigned_to = ?, status = 'CLOSED' WHERE id = ?`;
    //logger.info("sql :" + sql);
    await writePdf({ ideabox });
  }

  await db.query(sql, [employeeId, now, assignedTo, ideaboxId]);
};

const reject = async (ideaboxId, employeeId) => {
  // const approvalRole = await repo.getApprovalRole(employeeId);
  // const { role_id: roleId, prev_role: assignedTo } = approvalRole;

  const sql = `UPDATE ideabox SET assigned_to = 'EMPLOYEE', status = 'REJECTED' WHERE id = ?`;
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

const deleteFile = (beforeImage, afterImage) => {
  const path = "./public/ideabox/";

  try {
    const beforeImagePath = path + beforeImage;
    const afterImagePath = path + afterImage;

    fs.unlinkSync(beforeImagePath);
    fs.unlinkSync(afterImagePath);
  } catch (error) {
    console.log("Failed to delete ideabox file, Error :", error);
  }
};

const deletePdf = (pdfFile) => {
  const path = "./public/report/";

  try {
    const pdfPath = path + pdfFile;

    fs.unlinkSync(pdfPath);
  } catch (error) {
    console.log("Failed to delete ideabox pdf file, Error :", error);
  }
};

const writePdf = async ({ ideabox }) => {
  try {
    const BASE_URL = appConfig.get("base_url");
    const APP_PATH = appRoot.path;
    const reportPath = path.join(APP_PATH, "public/report");
    const { ideaboxId, ideaNumber, ideaType, sheetDate, submittedBy } = ideabox;
    const pdfName = `${ideaNumber.replace(
      /-/g,
      ""
    )}_${submittedBy}_${ideaType}_${sheetDate}.pdf`;

    const pdfPath = path.join(reportPath, pdfName);
    const pdfUrl = `${BASE_URL}/public/report/${pdfName}`;
    const url =
      ideaType === "UMUM"
        ? `${BASE_URL}/api/report/umum/${ideaboxId}`
        : `${BASE_URL}/api/report/kyt/${ideaboxId}`;

    await generatePdf({ url, filepath: pdfPath });

    logger.info("Write pdf : " + pdfPath);

    //update ideabox
    const sql = "UPDATE ideabox SET pdf_url = ?, pdf_file = ? WHERE id = ?";
    await db.query(sql, [pdfUrl, pdfName, ideaboxId]);
  } catch (error) {
    logger.error(error);
  }
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
  deleteFile,
  deletePdf,
};
