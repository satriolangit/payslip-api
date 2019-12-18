const express = require('express');
const router = express.Router();
const config = require('config');
const multer = require('multer');
const validateCreateUser = require('../filters/validateCreateUser');

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

router.get('/', (req, res) => {
	const uploadUrl = config.get('upload_url');

	const rawText =
		'<p>Daftar hari libur tahun <strong>2020 :</strong></p> <ol> <li>1 Januari</li> <li>23 <em>Januari</em></li> <li><em>4 Maret </em></li> </ol>';
	const cleanedText = rawText.replace(/(<([^>]+)>)/gi, '');

	res.json({ result: 'OK', url: uploadUrl, cleanedText: cleanedText });
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
