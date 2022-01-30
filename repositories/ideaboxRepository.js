const db = require("../config/database");
const moment = require("moment");

const getIdeaboxList = async (role) => {
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
            WHERE ibx.assigned_to = ?;
		`;

  return await db.query(sql, [role]);
};

const searchIdeaboxList = async (role, employeeId, keywords) => {
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
        WHERE ibx.assigned_to = ? AND (ibx.idea_number LIKE ? OR ibx.idea_type LIKE ? OR submitter.name LIKE ? OR dept.department_name LIKE ?
              OR ibx.status LIKE ? OR reviewer.name LIKE ? OR approver.name LIKE ? OR receiver.name LIKE ?);`;

  return await db.query(sql, [
    role,
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
  ]);
};

const getIdeaboxListForEmployee = async (employeeId) => {
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
      WHERE ibx.submitted_by = ?;
    `;

  return await db.query(sql, [employeeId]);
};

const searchIdeaboxListForEmployee = async (employeeId, keywords) => {
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
    WHERE ibx.submitted_by = ? 
      AND (ibx.idea_number LIKE ? OR ibx.idea_type LIKE ? OR submitter.name LIKE ? OR dept.department_name LIKE ?
        OR ibx.status LIKE ? OR reviewer.name LIKE ? OR approver.name LIKE ? OR receiver.name LIKE ?);
    `;

  return await db.query(sql, [
    employeeId,
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
  ]);
};

const getIdeaboxListForAdmin = async () => {
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
    ORDER BY ibx.idea_number`;

  return await db.query(sql);
};

const searchIdeaboxListForAdmin = async (keywords) => {
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
    WHERE (ibx.idea_number LIKE ? OR ibx.idea_type LIKE ? OR submitter.name LIKE ? OR dept.department_name LIKE ?
      OR ibx.status LIKE ? OR reviewer.name LIKE ? OR approver.name LIKE ? OR receiver.name LIKE ?)
    ORDER BY ibx.idea_number`;

  return await db.query(sql, [
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
  ]);
};

const getApprovalDepartments = async (employeeId) => {
  const sql = `SELECT department_id FROM approval_role_mapping WHERE employee_id = ?`;

  const query = await db.query(sql, employeeId);
  const result = query.map((x) => x.department_id);
  console.log("department:", result);
  return result;
};

const getIdeaboxListForManager = async (role, employeeId) => {
  const departments = await getApprovalDepartments(employeeId);

  const departmentIds = departments.join(",").toString();

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
      WHERE ibx.department_id IN ( ${departmentIds} ) AND ibx.assigned_to = ? ;
    `;

  //console.log(sql, departmentIds, role);

  return await db.query(sql, [role]);
};

const searchIdeaboxListForManager = async (employeeId, role, keywords) => {
  const departments = await getApprovalDepartments(employeeId);
  const departmentIds = departments.join(",").toString();

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
    WHERE ibx.department_id IN ( ${departmentIds} ) AND (ibx.idea_number LIKE ? OR ibx.idea_type LIKE ? OR submitter.name LIKE ? OR dept.department_name LIKE ?
      OR ibx.status LIKE ? OR reviewer.name LIKE ? OR approver.name LIKE ? OR receiver.name LIKE ?) AND ibx.assigned_to = ?;
    `;

  return await db.query(sql, [
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
    role,
  ]);
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

const geetIdeaboxByid = async (id) => {
  const sql = `
    SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaType, ibx.submitted_by AS submittedBy,
            DATE_FORMAT(submitted_at, '%Y-%m-%d') AS submittedAt, submitter.name AS submitterName, ibx.tema, ibx.kaizen_area AS kaizenArea,
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

const getIdeaboxImageById = async (ideaboxId) => {
  const sql = ` SELECT before_image AS beforeImage, after_image AS afterImage
    FROM ideabox_detail
    WHERE master_id = ?`;

  const result = await db.query(sql, ideaboxId);
  return result[0];
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

const getDepartmentNameById = async (id) => {
  const sql =
    "SELECT department_name AS departmentName FROM department WHERE id = ?";

  const query = await db.query(sql, id);
  return query[0].departmentName;
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

  const query = await db.query(sql, [startDate, endDate]);
  const result = query[0].Total;

  return result;
};

const getTotalClosedIdeaboxByYearAndEmployee = async (year, employeeId) => {
  const startDate = moment.utc(`${year.toString()}-01-01`).format("YYYY-MM-DD");
  const endDate = moment.utc(`${year.toString()}-12-31`).format("YYYY-MM-DD");

  const sql = `SELECT COUNT(id) AS Total FROM ideabox 
        WHERE submitted_at BETWEEN ? AND ? AND status = 'CLOSED' AND submitteed_by = ?`;

  const query = await db.query(sql, [startDate, endDate, employeeId]);
  const result = query[0].Total;

  return result;
};

const getNextAssignee = async (employeeId) => {
  const sql = `SELECT map.employee_id, apr.id as role_id, apr.next_role, apr.prev_role
		FROM approval_role_mapping map 
			INNER JOIN approval_role apr ON apr.id = map.role_id
		WHERE map.employee_id = ?`;

  const query = await db.query(sql, employeeId);

  let result = "EMPLOYEE";

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
  getNextAssignee,
  getPrevAssignee,
  getApprovalRole,
  getIdeaboxListForAdmin,
  getIdeaboxListForEmployee,
  searchIdeaboxList,
  searchIdeaboxListForEmployee,
  searchIdeaboxListForAdmin,
  getIdeaboxListForManager,
  searchIdeaboxListForManager,
  getTotalClosedIdeaboxByYearAndEmployee,
  getDepartmentNameById,
  geetIdeaboxByid,
  getIdeaboxImageById,
};
