const db = require("../config/database");

const getIdeaboxById = async (id) => {
  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaType, ibx.submitted_by AS submittedBy,
          DATE_FORMAT(submitted_at, '%d %M %Y') AS submittedAt, submitter.name AS submitterName, ibx.tema, ibx.kaizen_area AS kaizenArea,
          ibx.kaizen_amount AS kaizenAmount, ibx.department_id AS departmentId,
          reviewer.name AS reviewerName, approver.name AS approverName, receiver.name AS receiverName,
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

const getIdeaboxDetail = async (ideaboxId) => {
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

const getComments = async (ideaboxId) => {
  const sql = `SELECT cmt.comment AS value, cmt.created_at AS createdAt, usr.name AS createdBy
          FROM ideabox_comment cmt 
          LEFT JOIN user usr ON usr.employee_id = cmt.created_by
          WHERE master_id = ?
          ORDER BY created_at`;

  const query = await db.query(sql, ideaboxId);

  return query;
};

const getImpact = async (ideaboxId) => {
  const sql = `SELECT id, description AS text,
    (SELECT CASE WHEN COUNT(impact_id) > 0 THEN 1 ELSE 0 END FROM ideabox_impact WHERE ideabox_impact.impact_id = id AND ideabox_id = ?) AS checked
  FROM ms_ideabox_impact `;

  const impact = await db.query(sql, ideaboxId);

  //console.log(impact);
  return impact;
};

const getData = async (ideaboxId) => {
  const master = await getIdeaboxById(ideaboxId);
  const detail = await getIdeaboxDetail(ideaboxId);
  const comment = await getComments(ideaboxId);
  const impact = await getImpact(ideaboxId);

  const data = {
    master,
    detail,
    comment,
    impact,
  };

  return data;
};

module.exports = { getData };
