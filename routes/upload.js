const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const IncomingForm = require('formidable').IncomingForm;
const fs = require('fs');

//local lib
const auth = require('../middleware/auth');
const db = require('../config/database');
const adminOnly = require('../middleware/adminOnly');

router.post('/', (req, res) => {
	try {
		var form = new IncomingForm();

		let imageUrl = config.get('upload_url');
		form.parse(req);

		form.on('fileBegin', function(name, file) {
			file.path = __dirname + '/../public/uploads/' + file.name;
			imageUrl += file.name;
		});

		form.on('file', function(name, file) {
			console.log('Uploaded ' + file.name);
		});

		form.on('end', () => {
			res.json({ result: 'OK', imageUrl: imageUrl });
		});
	} catch (error) {
		console.log(error);
	}
});

module.exports = router;
