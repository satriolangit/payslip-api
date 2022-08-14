const db = require("../config/database");
const moment = require("moment");

const getIdeaboxList = async (role) => {
  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaboxType, 
            submitter.name AS submitterName, 
            ibx.submitted_by AS submittedBy, dept.department_name as departmentName,
            CASE WHEN ibx.pelaksanaan_ideasheet = 0 THEN 'BELUM DILAKSANAKAN' ELSE 'SUDAH DILAKSANAKAN' END AS isIdeasheet,
            ibx.kaizen_amount AS amount, DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
            DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
            DATE_FORMAT(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
            DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, receiver.name AS receiverName, 
            ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
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
  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaboxType, 
            submitter.name AS submitterName, 
            ibx.submitted_by AS submittedBy, dept.department_name as departmentName,
            CASE WHEN ibx.pelaksanaan_ideasheet = 0 THEN 'BELUM DILAKSANAKAN' ELSE 'SUDAH DILAKSANAKAN' END AS isIdeasheet,
            ibx.kaizen_amount AS amount, 
            DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
            DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
            DATE_FORMAT(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
            DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, 
            receiver.name AS receiverName, ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
        FROM ideabox ibx 
            LEFT JOIN user submitter ON submitter.employee_id = ibx.submitted_by
            LEFT JOIN user reviewer ON reviewer.employee_id = ibx.reviewed_by
            LEFT JOIN user approver ON approver.employee_id = ibx.approved_by
            LEFT JOIN user receiver ON receiver.employee_id = ibx.accepted_by
            LEFT JOIN department dept ON dept.id = ibx.department_id
        WHERE ibx.assigned_to = ? AND (ibx.idea_number LIKE ? OR ibx.idea_type LIKE ? OR submitter.name LIKE ? OR dept.department_name LIKE ?
              OR ibx.status LIKE ? OR reviewer.name LIKE ? OR approver.name LIKE ? OR receiver.name LIKE ? OR ibx.tema LIKE ?);`;

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
    "%" + keywords + "%",
  ]);
};

const getIdeaboxListForEmployee = async (employeeId) => {
  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaboxType, submitter.name AS submitterName, 
      ibx.submitted_by AS submittedBy, dept.department_name as departmentName,
      CASE WHEN ibx.pelaksanaan_ideasheet = 0 THEN 'BELUM DILAKSANAKAN' ELSE 'SUDAH DILAKSANAKAN' END AS isIdeasheet,
      ibx.kaizen_amount AS amount, 
      DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
      DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
      DATE_FORMAT(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
      DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, receiver.name AS receiverName, ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
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
      ibx.kaizen_amount AS amount, 
      DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
      DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
      DATE_FORMAT(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
      DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, receiver.name AS receiverName, ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
    FROM ideabox ibx 
      LEFT JOIN user submitter ON submitter.employee_id = ibx.submitted_by
      LEFT JOIN user reviewer ON reviewer.employee_id = ibx.reviewed_by
      LEFT JOIN user approver ON approver.employee_id = ibx.approved_by
      LEFT JOIN user receiver ON receiver.employee_id = ibx.accepted_by
      LEFT JOIN department dept ON dept.id = ibx.department_id
    WHERE ibx.submitted_by = ? 
      AND (ibx.idea_number LIKE ? OR ibx.idea_type LIKE ? OR submitter.name LIKE ? OR dept.department_name LIKE ?
        OR ibx.status LIKE ? OR reviewer.name LIKE ? OR approver.name LIKE ? OR receiver.name LIKE ? OR ibx.tema LIKE ?);
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
    "%" + keywords + "%",
  ]);
};

const getIdeaboxListForAdmin = async () => {
  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaboxType, submitter.name AS submitterName, 
      ibx.submitted_by AS submittedBy, dept.department_name as departmentName,
      CASE WHEN ibx.pelaksanaan_ideasheet = 0 THEN 'BELUM DILAKSANAKAN' ELSE 'SUDAH DILAKSANAKAN' END AS isIdeasheet,
      ibx.kaizen_amount AS amount, 
      DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
      DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
      DATE_FORMAT(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
      DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, receiver.name AS receiverName, ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
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
      ibx.kaizen_amount AS amount, 
      DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
      DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
      DATE_FORMAT(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
      DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, receiver.name AS receiverName, ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
    FROM ideabox ibx 
      LEFT JOIN user submitter ON submitter.employee_id = ibx.submitted_by
      LEFT JOIN user reviewer ON reviewer.employee_id = ibx.reviewed_by
      LEFT JOIN user approver ON approver.employee_id = ibx.approved_by
      LEFT JOIN user receiver ON receiver.employee_id = ibx.accepted_by
      LEFT JOIN department dept ON dept.id = ibx.department_id 
    WHERE (ibx.idea_number LIKE ? OR ibx.idea_type LIKE ? OR submitter.name LIKE ? OR dept.department_name LIKE ?
      OR ibx.status LIKE ? OR reviewer.name LIKE ? OR approver.name LIKE ? OR receiver.name LIKE ? OR ibx.tema LIKE ?)
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
    "%" + keywords + "%",
  ]);
};

const getApprovalDepartments = async (employeeId) => {
  const sql = `SELECT department_id FROM approval_role_mapping WHERE employee_id = ?`;

  const query = await db.query(sql, employeeId);
  const result = query.map((x) => x.department_id);
  //console.log("department:", result);
  return result;
};

const getIdeaboxListForManager = async (role, employeeId) => {
  const departments = await getApprovalDepartments(employeeId);

  const departmentIds = departments.join(",").toString();

  const sql = `SELECT ibx.id AS ideaboxId, ibx.idea_number AS ideaNumber, ibx.idea_type AS ideaboxType, submitter.name AS submitterName, 
      ibx.submitted_by AS submittedBy, dept.department_name as departmentName,
      CASE WHEN ibx.pelaksanaan_ideasheet = 0 THEN 'BELUM DILAKSANAKAN' ELSE 'SUDAH DILAKSANAKAN' END AS isIdeasheet,
      ibx.kaizen_amount AS amount, 
      DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
      DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
      DATE_FORMAT(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
      DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, receiver.name AS receiverName, ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
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
      ibx.kaizen_amount AS amount, 
      DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
      DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
      DATE_FORMAT(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
      DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, receiver.name AS receiverName, ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
    FROM ideabox ibx 
      LEFT JOIN user submitter ON submitter.employee_id = ibx.submitted_by
      LEFT JOIN user reviewer ON reviewer.employee_id = ibx.reviewed_by
      LEFT JOIN user approver ON approver.employee_id = ibx.approved_by
      LEFT JOIN user receiver ON receiver.employee_id = ibx.accepted_by
      LEFT JOIN department dept ON dept.id = ibx.department_id
    WHERE ibx.department_id IN ( ${departmentIds} ) AND (ibx.idea_number LIKE ? OR ibx.idea_type LIKE ? OR submitter.name LIKE ? OR dept.department_name LIKE ?
      OR ibx.status LIKE ? OR reviewer.name LIKE ? OR approver.name LIKE ? OR receiver.name LIKE ? OR ibx.tema LIKE ?) AND ibx.assigned_to = ?;
    `;

  console.log("employee_id:", employeeId, departments);

  return await db.query(sql, [
    "%" + keywords + "%",
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
			ibx.kaizen_amount AS amount, 
      DATE_FORMAT(ibx.submitted_at, '%Y-%m-%d') AS submitDate, 
      DATE_FORMAT(ibx.reviewed_at, '%Y-%m-%d') AS reviewDate, reviewer.name AS reviewerName,
			DATE_FORMAR(ibx.approved_at, '%Y-%m-%d') AS approvalDate, approver.name AS approverName, 
			DATE_FORMAT(ibx.accepted_at, '%Y-%m-%d') AS acceptedDate, receiver.name AS receiverName, ibx.status, ibx.tema, ibx.pdf_file AS pdfFile
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
            ibx.status, ibx.pelaksanaan_ideasheet AS isIdeasheet, dept.department_name AS departmentName,
            date_format(ibx.submitted_at, '%d%M%y') AS sheetDate
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
  const sql = `SELECT master_id, before_image AS beforeImage, after_image AS afterImage, ibx.pdf_file AS pdfFile
    FROM ideabox_detail detail INNER JOIN ideabox ibx ON ibx.id = detail.master_id
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

const getDepartmentById = async (id) => {
  const sql =
    "SELECT id, department_code AS departmentCode, department_name AS departmentName FROM department WHERE id = ?";

  const query = await db.query(sql, id);
  return query[0] || { id: 0, departmentCode: "NA", departmentName: "NA" };
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

  console.log(startDate, endDate);

  const sql = `SELECT COUNT(id) AS Total FROM ideabox 
        WHERE submitted_at BETWEEN ? AND ? AND status = 'CLOSED' AND submitted_by = ?`;

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

const getAdminUsers = async () => {
  const sql =
    "SELECT * FROM user WHERE site_name = 'IDEABOX' AND role = 'admin' ORDER BY name";
  const data = await db.query(sql);

  return data;
};

const searchAdminUsers = async (keywords) => {
  const sql = `SELECT * FROM user 
    WHERE site_name = 'IDEABOX' AND role = 'admin' 
    AND (name LIKE ? OR email LIKE ? OR employee_id LIKE ? ) ORDER BY name`;

  const data = await db.query(sql, [
    "%" + keywords + "%",
    "%" + keywords + "%",
    "%" + keywords + "%",
  ]);

  return data;
};

const getIdeaboxReport = async (startDate, endDate, ideaType = "ALL") => {
  let sql = `SELECT id, idea_number as ideaNumber, idea_type as ideaType, 
      date_format(submitted_at, '%d%M%y') as submittedAt, submitted_by as submittedBy,
      pdf_file, pdf_url
    FROM ideabox 
    WHERE submitted_at BETWEEN ? AND ? AND status = 'CLOSED' AND pdf_file IS NOT NULL`;

  if (ideaType !== "ALL") {
    sql += ` AND idea_type = '${ideaType}'`;
  }

  console.log("sql:", sql);

  return await db.query(sql, [startDate, endDate]);
};

module.exports = {
  getDepartments,
  getDepartmentById,
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
  getAdminUsers,
  searchAdminUsers,
  getIdeaboxReport,
};
