const express = require('express');
const router = express.Router();
const config = require('config');
const multer = require('multer');
const validateCreateUser = require('../filters/validateCreateUser');
const IncomingForm = require('formidable').IncomingForm;
const pdf2base64 = require('pdf-to-base64');

//upload photo config
const photoStorate = multer.diskStorage({
	destination: function(req, file, cb) {
		const path = __dirname + '/../public/photos';
		cb(null, path);
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname);
	},
});

var upload = multer({ storage: photoStorate });

router.post('/upload', (req, res) => {
	console.log('/upload route');

	var form = new IncomingForm();
	const baseUrl = __dirname + '/../public/photos/';

	form.on('fileBegin', async (name, file) => {
		console.log('file begin...');
	});

	form.on('file', async (field, file) => {
		file.path = baseUrl + 'avatar_' + file.name;
	});

	form.parse(req, async (err, fields, files) => {
		//console.log('file:', files, 'field: ', fields);
	});

	res.json(req.body);
});

router.get('/', (req, res) => {
	const uploadUrl = config.get('upload_url');

	const rawText =
		'<p>Daftar hari libur tahun <strong>2020 :</strong></p> <ol> <li>1 Januari</li> <li>23 <em>Januari</em></li> <li><em>4 Maret </em></li> </ol>';
	const cleanedText = rawText.replace(/(<([^>]+)>)/gi, '');

	res.json({ result: 'OK', url: uploadUrl, cleanedText: cleanedText });
});

router.get('/openPdf', (req, res) => {
	const filename = '201902_4632_RENDI_UNJIANTO.pdf';
	const path = './public/payslip/' + filename;

	pdf2base64(path)
		.then(response => {
			console.log(response); //cGF0aC90by9maWxlLmpwZw==
			res.json({ response });
		})
		.catch(error => {
			console.log(error); //Exepection error....
			res.status(500).json({ error });
		});
});

const schemas = require('./../filters/schemas');
const filter = require('./../filters/filter');

router.post('/filter', [filter(schemas.addUserPOST)], function(req, res) {
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any

	res.json({ message: 'enter filter route' });
});

router.post('/validate', [upload.single('photo'), validateCreateUser], function(req, res, next) {
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any

	res.json({ message: 'enter validate route' });
});

module.exports = router;
