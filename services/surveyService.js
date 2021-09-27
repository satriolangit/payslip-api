const db = require('../config/database');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const createSurvey = async (submittedBy, reason, result, department) => {
	//create new user
    
	const timestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
	const sql =
		'INSERT INTO survey (id, submittedBy, submittedAt, result, reason, department) ' +
		'VALUES (?, ?, ?, ?, ?, ?)';

	const id = uuidv4();

	db.query(sql, [
		id,
		submittedBy,
		timestamp,
		result,
		reason,
		department
	]);

	return id;
};

const createSurveyImage = (surveyId, imageName) => {
    const sql =
		'INSERT INTO survey_images (surveyId, imageName) ' +
		'VALUES (?, ?)';

	db.query(sql, [
		surveyId,
		imageName
	]);

}

const getReport = async () => {	

    // const sql = `SELECT ROW_NUMBER() OVER (ORDER BY s.id) AS no,
    //     MONTHNAME(s.submittedAt) AS bulan, YEAR(s.submittedAt) AS tahun, DATE_FORMAT(s.submittedAt, '%d/%m/%Y') AS submittedAt,
    //     s.submittedBy AS nik, usr.name AS nama, '-' AS department, s.result, s.reason,
    //     (SELECT GROUP_CONCAT(DISTINCT imageName SEPARATOR ';') FROM survey_images WHERE surveyId = s.id) AS photos
    //     FROM survey s INNER JOIN user usr ON usr.employee_id = s.submittedBy`;

	const sql = `SELECT MONTHNAME(s.submittedAt) AS bulan, YEAR(s.submittedAt) AS tahun, DATE_FORMAT(s.submittedAt, '%d/%m/%Y') AS submittedAt,s.submittedBy AS nik, usr.name AS nama, s.department, s.result, s.reason,(SELECT GROUP_CONCAT(DISTINCT imageName SEPARATOR ',') FROM survey_images WHERE surveyId = s.id) AS photos FROM survey s INNER JOIN user usr ON usr.employee_id = s.submittedBy ORDER BY s.SubmittedAt`;


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
}


module.exports = {
	createSurvey,
	createSurveyImage,
    getReport
};
