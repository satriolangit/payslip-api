const express = require('express');
const router = express.Router();
const config = require('config');
const multer = require('multer');
const service = require("../services/surveyService");


router.get("/report", async (req, res) => {
    try {
      
     const data = await service.getReport();   

      res.status(200).json({
        status: 200,
        message: "OK",
        data: data,
        errors: null,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        status: 500,
        message: "Failed to get survey report",
        data: req.body,
        errors: err,
      });
    }
  });

//upload photo config
const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const path = __dirname + "/../public/survey";
      cb(null, path);
    },
    filename: function (req, file, cb) {
        
      cb(null, file.originalname);
    },
  });
  
  var upload = multer({
    storage: photoStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('File type not accepted (.png, .jpg, .jpeg)'));
        }
    }
});

router.post('/submit', upload.array("images"), async (req, res) => {

    try {
        
        const request = JSON.parse(req.body.data);
        const {reason, result, submittedBy} = request;
        console.log(reason, result, submittedBy);
        let surveyId = await service.createSurvey(submittedBy, reason, result);

        if(req.files) {
            req.files.map(file => (
                service.createSurveyImage(surveyId, file.originalname)
            ));

            console.log(req.files);
        }

        res.status(200).json({
            result: "OK",
            message: "Successfully submit survey",
            data: req.body,
            errors: null,
          });
    } catch (error) {
        return res.status(500).json({
            result: "FAIL",
            message: "Internal server error, failed to submit survey",
            data: req.body,
            errors: error,
          });
    }
	
});



module.exports = router;
