const express = require('express');
const router = express.Router();
const config = require('config');
const IncomingForm = require('formidable').IncomingForm;
const { check, validationResult } = require('express-validator');
const fs = require('fs');

//local lib
const auth = require('../middleware/auth');
const service = require('../services/uploadService');

router.get('/', auth, async (req, res) => {
	try {
		const data = await service.getUploadData();

		res.status(200).json({
			status: 200,
			message: 'OK',
			data: data,
			errors: null,
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({
			status: 500,
			message: 'Failed to get files',
			data: req.body,
			errors: err,
		});
	}
});

router.post('/', (req, res) => {
	try {
		var form = new IncomingForm();

		let imageUrl = config.get('upload_url');
		form.parse(req);

		form.on('fileBegin', function(name, file) {
			const filename = file.name.replace(/\s+/g, '_').toLowerCase();
			file.path = __dirname + '/../public/uploads/' + filename;
			imageUrl += filename;
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

router.post('/files', async (req, res) => {
	try {
		var form = new IncomingForm();

		let baseUrl = config.get('upload_url');
		let fileUrl = '';
		let filename = '';
		let isFileExist = null;

		form.parse(req);

		form.on('fileBegin', async (name, file) => {
			filename = file.name.replace(/\s+/g, '_').toLowerCase();
			file.path = __dirname + '/../public/uploads/' + filename;

			fileUrl = baseUrl + filename;
		});

		form.on('file', function(name, file) {
			console.log('Uploaded ' + file.name);
		});

		form.on('end', async () => {
			isFileExist = await service.isFileExist(filename);
			// console.log('on end fileExists: ', isFileExist);
			if (!isFileExist) service.createUpload(filename, fileUrl, 'system');
			res.json({ result: 'OK', fileUrl });
		});
	} catch (error) {
		console.log(error);
	}
});

router.post(
	'/delete',
	[
		auth,
		[
			check('id')
				.not()
				.isEmpty(),
			check('filename')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					message: 'Failed to delete file',
					data: req.body,
					errors: errors.array(),
				});
			}

			const { id, filename } = req.body;

			await service.removeUpload(id);

			//delete file
			const path = './public/uploads/' + filename;
			console.log('path:', path);
			fs.unlinkSync(path);

			return res.status(200).json({
				message: 'Successfully delete file',
				data: req.body,
				errors: null,
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				message: 'Failed to delete file',
				data: req.body,
				errors: error,
			});
		}
	}
);

router.post(
	'/bulkdelete',
	[
		auth,
		[
			check('ids')
				.not()
				.isEmpty(),
		],
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					message: 'Failed to delete file',
					data: req.body,
					errors: errors.array(),
				});
			}

			const { ids } = req.body;

			for (i = 0; i < ids.length; i++) {
				const id = ids[i].split(';')[0];
				const filename = ids[i].split(';')[1];

				await service.removeUpload(id);

				//delete file
				const path = './public/uploads/' + filename;
				console.log('path:', path);
				fs.unlinkSync(path);
			}

			return res.status(200).json({
				message: 'Successfully delete files',
				data: req.body,
				errors: null,
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				message: 'Failed to delete files',
				data: req.body,
				errors: error,
			});
		}
	}
);

router.post('/search', auth, async (req, res) => {
	try {
		console.log(req.body);
		const { keywords } = req.body;

		const data = await service.searchFiles(keywords);
		console.log(data);
		res.status(200).json({
			status: 200,
			message: 'OK',
			data: data,
			errors: null,
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({
			status: 500,
			message: 'Failed to get files',
			data: req.body,
			errors: err,
		});
	}
});

module.exports = router;
