const db = require('../config/database');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const generateNumber = () => {
    
    const prefix = "0000";    
    const now = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    
    const sql = "SELECT idea_number FROM ideabox ORDER BY submitted_at DESC LIMIT 1";
    const oldNumber = db.query(sql);

    let number = `${year}-${month}-0001`;

    if(oldNumber.length > 0 ) {
        let arrDate = oldNumber.split('-');
        const oldYear = arrDate[0];
        const oldMonth = arrDate[1];
        const oldNumber = arrDate[2];

        const oldDate = moment.utc(`${oldYear}-${oldMonth}`);
        const diff = now.diff(oldDate, 'months');

        if(diff <= 0) {
            var temp = parseInt(oldNumber) + 1;
            var newNumber = currNumber.substring(0, oldNumber.length - temp.toString().length);
            number = newNumber + temp;            
        }
        
    }    

    return number;
    
}

const submitIdea = async (master, detail) => {
	
	var date = moment.utc().format('YYYY-MM-DD HH:mm:ss'); 
	console.log(date); // 2015-09-13 03:39:27
	var stillUtc = moment.utc(date).toDate();
	var timestamp = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');

	const sql =
		'INSERT INTO ideabox (id, submittedBy, submittedAt, result, reason, department) ' +
		'VALUES (?, ?, ?, ?, ?, ?)';

	const id = uuidv4();

	console.log(timestamp);

	var date = moment.utc().format('YYYY-MM-DD HH:mm:ss');

	console.log(date); // 2015-09-13 03:39:27

	var stillUtc = moment.utc(date).toDate();
	var local = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');

	console.log(local); // 2015-09-13 09:39:27

	db.query(sql, [
		id,
		submittedBy,
		local,
		result,
		reason,
		department
	]);

	return id;
};