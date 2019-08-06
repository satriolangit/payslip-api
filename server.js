const express = require('express');
const db = require('./config/database');
const app = express();

//init middleware
app.use(express.json({ extended: false }));

const getInfo = async () => {
	var data = await db.query('SELECT * FROM role where role_name = ?', 'admin');
	console.log(data);

	console.log('role_name: ', data[0].role_name);
};

//routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/announcement', require('./routes/announcement'));
// app.use('/api/payslip', require('./routes/payslip'));
// app.use('/api/information', require('./routes/information'));
// app.use('/api/todo', require('./routes/todo'));

//port
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
