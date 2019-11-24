const express = require('express');
const router = express.Router();
const config = require('config');

router.get('/', (req, res) => {
	const uploadUrl = config.get('upload_url');

	const rawText =
		'<p>Daftar hari libur tahun <strong>2020 :</strong></p> <ol> <li>1 Januari</li> <li>23 <em>Januari</em></li> <li><em>4 Maret </em></li> </ol>';
	const cleanedText = rawText.replace(/(<([^>]+)>)/gi, '');

	res.json({ result: 'OK', url: uploadUrl, cleanedText: cleanedText });
});

module.exports = router;
