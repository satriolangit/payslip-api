const mysql = require('mysql');
const config = require('config');
const db = config.get('mysql');

const pool = mysql.createPool({
	host: db.host,
	user: db.user,
	password: db.password,
	database: db.name,
});

module.exports = pool;
