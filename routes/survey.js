const express = require("express");
const router = express.Router();
const config = require("config");
const multer = require("multer");
const service = require("../services/surveyService");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

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

router.get("/department", async (req, res) => {
  try {
    const data = await service.getDepartment();

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
      message: "Failed to get department",
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
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("File type not accepted (.png, .jpg, .jpeg)"));
    }
  },
});

router.post("/report/filter", async (req, res) => {
  try {
    // const request = JSON.parse(req.body);
    const { startDate, endDate } = req.body;

    const data = await service.getReportByDate(startDate, endDate);

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
      message: "Failed to get survey report by date",
      data: req.body,
      errors: err,
    });
  }
});

router.post("/submit", upload.array("images"), async (req, res) => {
  try {
    const request = JSON.parse(req.body.data);
    const { reason, result, submittedBy, department } = request;

    let surveyId = await service.createSurvey(
      submittedBy,
      reason,
      result,
      department
    );

    if (req.files) {
      req.files.map((file) =>
        service.createSurveyImage(surveyId, file.originalname)
      );
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

router.post("/delete", [auth, adminOnly], async (req, res) => {
  const { surveyId } = req.body;

  try {
    await service.deleteSurvey(surveyId);

    return res.status(200).json({
      status: 200,
      message: "Delete survey success.",
      data: req.body,
      errors: null,
    });
  } catch (err) {
    console.log("Failed to delete survey, error : ", err.message);
    return res.status(500).json({
      status: 500,
      message: "Failed to delete survey",
      data: req.body,
      errors: err,
    });
  }
});

module.exports = router;
