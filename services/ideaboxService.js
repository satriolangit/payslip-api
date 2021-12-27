const db = require('../config/database');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const generateNumber = async () => {
    
	const sql = "SELECT idea_number as number FROM ideabox ORDER BY submitted_at DESC LIMIT 1";
    let query = await db.query(sql);	
	const oldNumber = query[0].number;	
    
	let number = `${moment.utc().format('YYYY-MM')}-0001`;

    if(query.length > 0 ) {        
	
		let arrDate = oldNumber.split('-');
		
        const currYear = arrDate[0];
        const currMonth = arrDate[1];
        const currNumber = arrDate[2];

        const oldDate = moment.utc(`${currYear}-${currMonth}`);
		var now = moment.utc();
		const diff = now.diff(oldDate, 'months');

        if(diff <= 0) {
            var temp = parseInt(currNumber) + 1;
            var newNumber = currNumber.substring(0, currNumber.length - temp.toString().length) + temp;
            number = `${currYear}-${currMonth}-${newNumber}`;            
        }
          
    }

    return number;    
}

const getNextAssignee = async (employeeId) => {

}

const submit = async (master) => {
	
	var date = moment.utc().format('YYYY-MM-DD HH:mm:ss'); 
	console.log(date); // 2015-09-13 03:39:27
	var stillUtc = moment.utc(date).toDate();
	var timestamp = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');

	const sql =
		'INSERT INTO ideabox (idea_number, idea_type, submitted_by, submitted_at, tema, kaizen_area, pelaksanaan_ideasheet, impact_type, kaizen_amount, department_id, assigned_to) ' +
		'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
		
	const number = await generateNumber();
	console.log('number: ', number);
	const {ideaType, submittedBy, tema, kaizenArea, isIdeaSheet, impactType, kaizenAmount, departmentId} = master;
	
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
		submittedBy
	]);

	console.log("submit ideabox, insertId :", result.insertId);

	return result.insertId;
};

const submitDetailUmum = async (ideaboxId, detail) => {
	const {beforeValueSummary, beforeValueImage, afterValueSummary, afterValueImage} = detail;

	const sql = `INSERT INTO ideabox_detail (master_id, before_value_summary, before_image, after_value_summary, after_image)
		VALUES (?, ?, ?, ?, ?)`;

	await db.query(sql, [ideaboxId, beforeValueSummary, beforeValueImage, afterValueSummary, afterValueImage]);
}

const submitDetailKyt = async (ideaboxId, detail) => {
	const sql = `INSERT INTO ideabox_detail (master_id, before_value_summary, before_image, before_value_kapan, before_value_dimana,
		before_value_siapa, before_value_bagaimana, before_value_incident, before_value_situation, before_value_situation_image,
		after_value_summary, after_image, after_value_rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

	console.log(sql);

	const { beforeValueSummary, beforeValueImage, beforeValueKapan, beforeValueDimana, beforeValueSiapa, beforeValueBagaimana,
	beforeValueIncident, beforeValueSituation, beforeValueSituationImage, afterValueSummary, afterValueImage, afterValueRank } = detail;

	await db.query(sql, [ideaboxId, beforeValueSummary, beforeValueImage, beforeValueKapan, beforeValueDimana, beforeValueSiapa,
		beforeValueBagaimana, beforeValueIncident, beforeValueSituation, beforeValueSituationImage, afterValueSummary, afterValueImage,
		afterValueRank]);
}

const submitComment = async (ideaboxId, comment) => {
	const sql = `INSERT ideabox_comment (master_id, created_by, created_at, comment) VALUES (?,?,?,?)`;

	const { value, createdBy } = comment;

	var date = moment.utc().format('YYYY-MM-DD HH:mm:ss'); 
	var stillUtc = moment.utc(date).toDate();
	var timestamp = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');

	await db.query(sql, [ideaboxId, createdBy, timestamp, value]);
}

module.exports = {
	submit, submitDetailUmum, submitDetailKyt, submitComment, generateNumber
}