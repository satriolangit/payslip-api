const mysql = require('mysql');
const config = require('config');
const db = config.get('mysql');

const conn = mysql.createConnection({
	host: db.host,
	user: db.user,
	password: db.password,
	database: db.name,
});

module.exports = conn;
