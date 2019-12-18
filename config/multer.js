const multer = require('multer');

const photoStorage = multer.diskStorage({
	destination: function(req, file, cb) {
		const path = __dirname + '/../public/photos';
		cb(null, path);
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname);
	},
});

var uploadPhoto = multer({ storage: photoStorage });

module.export = { uploadPhoto };
