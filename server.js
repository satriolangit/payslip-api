const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
var bodyParser = require('body-parser');

const app = express();

//init middleware
app.use(express.json({ extended: false }));

// app.use(function(req, res, next) {
// 	res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
// 	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
// 	next();
// });

/* Use cors and fileUpload*/
app.use(
	cors({
		allowedHeaders: ['sessionId', 'Content-Type', 'x-auth-token'],
		exposedHeaders: ['sessionId'],
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		preflightContinue: false,
	})
);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

//routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/announcement', require('./routes/announcement'));
app.use('/api/payslip', require('./routes/payslip'));
app.use('/api/information', require('./routes/information'));
app.use('/api/todo', require('./routes/todo'));
app.use('/api/role', require('./routes/role'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/connect', require('./routes/connect'));

//test
app.get('/xyz', (req, res) => res.send('Hello World!'));

app.use(fileUpload());
app.use('/public', express.static(__dirname + '/public'));
app.use('/payslip', express.static(__dirname + '/public/payslip'));
app.use('/files', express.static(__dirname + '/public/uploads'));
app.use('/photos', express.static(__dirname + '/public/photos'));

//port
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
