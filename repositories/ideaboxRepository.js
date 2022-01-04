const db = require("../config/database");
const moment = require("moment");

const getIdeaboxList = async (role, employeeId) => {
  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaboxType, submitter.name AS submitterName, 
            ibx.submitted_by AS submittedBy, dept.department_name as departmentName,
            CASE WHEN ibx.pelaksanaan_ideasheet = 0 THEN 'BELUM DILAKSANAKAN' ELSE 'SUDAH DILAKSANAKAN' END AS isIdeasheet,
            ibx.kaizen_amount AS amount, ibx.submitted_at AS submitDate, ibx.reviewed_at AS reviewDate, reviewer.name AS reviewerName,
            ibx.approved_at AS approvalDate, approver.name AS approverName, 
            ibx.accepted_at AS acceptedDate, receiver.name AS receiverName, ibx.status
        FROM ideabox ibx 
            LEFT JOIN user submitter ON submitter.employee_id = ibx.submitted_by
            LEFT JOIN user reviewer ON reviewer.employee_id = ibx.reviewed_by
            LEFT JOIN user approver ON approver.employee_id = ibx.approved_by
            LEFT JOIN user receiver ON receiver.employee_id = ibx.accepted_by
            LEFT JOIN department dept ON dept.id = ibx.department_id
            WHERE ibx.assigned_to = ? OR ibx.submitted_by = ?;
		`;

  return await db.query(sql, [role, employeeId]);
};

const getIdeaboxListPerPages = async (role, employeeId, limit, offset) => {
  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaboxType, submitter.name AS submitterName, ibx.submitted_by AS submittedBy, 
			CASE WHEN ibx.pelaksanaan_ideasheet = 0 THEN 'BELUM DILAKSANAKAN' ELSE 'SUDAH DILAKSANAKAN' END AS isIdeasheet,
			ibx.kaizen_amount AS amount, ibx.submitted_at AS submitDate, ibx.reviewed_at AS reviewDate, reviewer.name AS reviewerName,
			ibx.approved_at AS approvalDate, approver.name AS approverName, 
			ibx.accepted_at AS acceptedDate, receiver.name AS receiverName, ibx.status
		FROM ideabox ibx 
            LEFT JOIN user submitter ON submitter.employee_id = ibx.submitted_by
            LEFT JOIN user reviewer ON reviewer.employee_id = ibx.reviewed_by
            LEFT JOIN user approver ON approver.employee_id = ibx.approved_by
            LEFT JOIN user receiver ON receiver.employee_id = ibx.accepted_by
		WHERE ibx.assigned_to = ? OR ibx.submitted_by = ?
        LIMIT ? OFFSET ?
		`;

  return await db.query(sql, [role, employeeId, limit, offset]);
};

const getIdeaboxCount = async (role, employeeId) => {
  const sql =
    "SELECT COUNT(id) FROM ideabox WHERE assigned_to = ? OR submitted_by = ?";
  const query = await db.query(sql, [role, employeeId]);

  return query[0].total;
};

const getDepartments = async () => {
  const sql =
    "SELECT id, department_name as departmentName FROM department ORDER by department_name";

  return await db.query(sql);
};

const getIdeaTypes = async () => {
  const sql = "SELECT id, description FROM ideabox_type";

  return await db.query(sql);
};

const getIdeaRanks = async () => {
  const sql = "SELECT id, description FROM ms_ideabox_rank";

  return await db.query(sql);
};

const getIdeaImpacts = async () => {
  const sql = "SELECT id, description FROM ms_ideabox_impact";

  return await db.query(sql);
};

const getIdeaCommentsById = async (ideaboxId) => {
  const sql = `SELECT comm.id, comm.created_at AS commentDate, usr.name AS commentBy, comm.comment
        FROM ideabox_comment comm LEFT JOIN user usr ON usr.employee_id = comm.created_by
        WHERE comm.master_id = ?`;

  return await db.query(sql, ideaboxId);
};

const getTotalClosedIdeaboxByYear = async (year) => {
  const startDate = moment.utc(`${year.toString()}-01-01`).format("YYYY-MM-DD");
  const endDate = moment.utc(`${year.toString()}-12-31`).format("YYYY-MM-DD");

  const sql = `SELECT COUNT(id) AS Total FROM ideabox 
        WHERE submitted_at BETWEEN ? AND ? AND status = 'CLOSED'`;

  return await db.query(sql, [startDate, endDate]);
};

module.exports = {
  getDepartments,
  getIdeaboxList,
  getIdeaTypes,
  getIdeaRanks,
  getIdeaImpacts,
  getIdeaCommentsById,
  getIdeaboxListPerPages,
  getIdeaboxCount,
  getTotalClosedIdeaboxByYear,
};
