const db = require("../config/database");

const getIdeaboxById = async (id) => {
  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaType, ibx.submitted_by AS submittedBy,
        ibx.submitted_at AS submittedAt, submitter.name AS submitterName, ibx.tema, ibx.kaizen_area AS kaizenArea,
        ibx.kaizen_amount AS kaizenAmount, ibx.department_id AS departmentId, ibx.reviewed_by AS reviewedBy,
        reviewer.name AS reviewerName, ibx.approved_by AS approvedBy, approver.name AS approverName, ibx.accepted_by AS acceptedBy, 
        receiver.name AS receiverName,
        ibx.status, ibx.pelaksanaan_ideasheet AS isIdeasheet, dept.department_name AS departmentName
        FROM ideabox ibx LEFT JOIN user submitter ON submitter.employee_id = ibx.submitted_by
        LEFT JOIN user reviewer ON reviewer.employee_id = ibx.reviewed_by
        LEFT JOIN user approver ON approver.employee_id = ibx.approved_by
        LEFT JOIN user receiver ON receiver.employee_id = ibx.accepted_by
        LEFT JOIN department dept ON dept.id = ibx.department_id
        WHERE ibx.id = ?`;

  const query = await db.query(sql, id);

  return query[0];
};

const getIdeaboxDetailByIdeaboxId = async (ideaboxId) => {
  const sql = `SELECT id, master_id AS ideaboxId, before_value_summary AS beforeSummary, before_image AS beforeImage, before_value_kapan AS beforeKapan,
            before_value_dimana AS beforeDimana, before_value_siapa AS beforeSiapa, before_value_apa AS beforeApa, 
            before_value_bagaimana AS beforeBagaimana, before_value_incident AS beforeIncident,
            before_value_situation AS beforeSituation, after_value_summary AS afterSummary, after_image AS afterImage,
            after_value_rank AS afterRank
        FROM ideabox_detail 
        WHERE master_id = ?;`;

  const query = await db.query(sql, ideaboxId);

  return query[0];
};

const getImpactsByIdeaboxId = async (ideaboxId) => {
  const sql = `SELECT impact_id FROM ideabox_impact WHERE ideabox_id = ?;`;
  const query = await db.query(sql, ideaboxId);

  return query;
};

const getCommentByEmployeeIdAndIdeaboxId = async (employeeId, ideaboxId) => {
  const sql =
    "SELECT id, comment, created_by AS createdBy FROM ideabox_comment WHERE master_id = ? AND created_by = ?";
  const query = await db.query(sql, [ideaboxId, employeeId]);

  return query[0];
};

const getCommentsByIdeaboxId = async (ideaboxId) => {
  const sql = `SELECT cmt.comment, cmt.created_at AS createdAt, usr.name AS createdBy
        FROM ideabox_comment cmt 
        LEFT JOIN user usr ON usr.employee_id = cmt.created_by
        WHERE master_id = ?
        ORDER BY created_at`;

  const query = await db.query(sql, ideaboxId);

  return query;
};

module.exports = {
  getIdeaboxById,
  getIdeaboxDetailByIdeaboxId,
  getImpactsByIdeaboxId,
  getCommentsByIdeaboxId,
  getCommentByEmployeeIdAndIdeaboxId,
};
