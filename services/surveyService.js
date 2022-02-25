const db = require("../config/database");
const uuidv4 = require("uuid/v4");
const moment = require("moment");

const createSurvey = async (submittedBy, reason, result, department) => {
  var date = moment.utc().format("YYYY-MM-DD HH:mm:ss");

  var stillUtc = moment.utc(date).toDate();
  var timestamp = moment(stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  //const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
  const sql =
    "INSERT INTO survey (id, submittedBy, submittedAt, result, reason, department) " +
    "VALUES (?, ?, ?, ?, ?, ?)";

  const id = uuidv4();

  var date = moment.utc().format("YYYY-MM-DD HH:mm:ss");

  var stillUtc = moment.utc(date).toDate();
  var local = moment(stillUtc).local().format("YYYY-MM-DD HH:mm:ss");

  db.query(sql, [id, submittedBy, local, result, reason, department]);

  return id;
};

const createSurveyImage = (surveyId, imageName) => {
  const sql =
    "INSERT INTO survey_images (surveyId, imageName) " + "VALUES (?, ?)";

  db.query(sql, [surveyId, imageName]);
};

const getReport = async () => {
  // const sql = `SELECT ROW_NUMBER() OVER (ORDER BY s.id) AS no,
  //     MONTHNAME(s.submittedAt) AS bulan, YEAR(s.submittedAt) AS tahun, DATE_FORMAT(s.submittedAt, '%d/%m/%Y') AS submittedAt,
  //     s.submittedBy AS nik, usr.name AS nama, '-' AS department, s.result, s.reason,
  //     (SELECT GROUP_CONCAT(DISTINCT imageName SEPARATOR ';') FROM survey_images WHERE surveyId = s.id) AS photos
  //     FROM survey s INNER JOIN user usr ON usr.employee_id = s.submittedBy`;

  const sql = `SELECT id, MONTHNAME(s.submittedAt) AS bulan, YEAR(s.submittedAt) AS tahun, DATE_FORMAT(s.submittedAt, '%d/%m/%Y %H:%i') AS submittedAt,s.submittedBy AS nik, usr.name AS nama, s.department, s.result, s.reason,(SELECT GROUP_CONCAT(DISTINCT imageName SEPARATOR ',') FROM survey_images WHERE surveyId = s.id) AS photos FROM survey s INNER JOIN user usr ON usr.employee_id = s.submittedBy ORDER BY s.SubmittedAt`;

  // sql = `SET @row_number = 0;
  // 	SELECT
  // 		(@row_number:=@row_number + 1) AS no,
  // 		MONTHNAME(s.submittedAt) AS bulan,
  // 		YEAR(s.submittedAt) AS tahun,
  // 		DATE_FORMAT(s.submittedAt, '%d/%m/%Y') AS submittedAt,
  // 		s.submittedBy AS nik,
  // 		usr.name AS nama,
  // 		'-' AS department,
  // 		s.result, s.reason,
  // 		(SELECT GROUP_CONCAT(DISTINCT imageName SEPARATOR ';') FROM survey_images WHERE surveyId = s.id) AS photos
  // 	FROM survey s INNER JOIN user usr ON usr.employee_id = s.submittedBy
  // 	ORDER BY s.submittedAt`;
  return db.query(sql);
};

const getReportByDate = async (startDate, endDate) => {
  const sql = `SELECT id, MONTHNAME(s.submittedAt) AS bulan, YEAR(s.submittedAt) AS tahun, 
			DATE_FORMAT(s.submittedAt, '%d/%m/%Y %H:%i') AS submittedAt,s.submittedBy AS nik, usr.name AS nama, 
			s.department, s.result, s.reason,(SELECT GROUP_CONCAT(DISTINCT imageName SEPARATOR ',') 
			FROM survey_images WHERE surveyId = s.id) AS photos 
		FROM survey s INNER JOIN user usr ON usr.employee_id = s.submittedBy 
		WHERE s.SubmittedAt >= ? AND s.SubmittedAt <= ?
		ORDER BY s.SubmittedAt`;

  return db.query(sql, [startDate, endDate]);
};

const getDepartment = async () => {
  const sql =
    "SELECT id, department_code, department_name FROM department ORDER BY department_code";
  const result = await db.query(sql);
  return result;
};

const deleteSurvey = async (id) => {
  const sql = `DELETE FROM survey WHERE id = ?`;
  const sqlImages = `DELETE FROM survey_images WHERE surveyId = ?`;

  db.query(sql, id);
  db.query(sqlImages, id);
};

module.exports = {
  createSurvey,
  createSurveyImage,
  getReport,
  getDepartment,
  deleteSurvey,
  getReportByDate,
};
