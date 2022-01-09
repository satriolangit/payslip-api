const express = require("express");
const router = express.Router();
const config = require("config");
const multer = require("multer");
const moment = require("moment");
const service = require("../services/ideaboxService");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const repo = require("../repositories/ideaboxRepository");

router.get("/number", async (req, res) => {
  try {
    const number = await service.generateNumber();
    return res.status(200).json({
      result: "OK",
      message: "OK",
      data: number,
      errors: null,
    });
  } catch (error) {
    return res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to generate ideabox number",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/closedIdeaCount/:year", async (req, res) => {
  try {
    const year = req.params.year;
    const total = await repo.getTotalClosedIdeaboxByYear(year);

    res.status(200).json({
      result: "OK",
      message: "Success",
      data: total,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get total closed ideasheet",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/list", async (req, res) => {
  try {
    const { approvalRole, employeeId } = req.body;
    const data = await repo.getIdeaboxList(approvalRole, employeeId);

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: data,
      errors: null,
    });
  } catch (error) {
    return res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get ideabox list",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/listpage", async (req, res) => {
  try {
    const { page, numPerPage, role, employeeId } = req.body;

    const totalRows = await repo.getIdeaboxCount(role, employeeId);

    let data = null;
    if (page * numPerPage < totalRows) {
      data = await repo.getIdeaboxListPerPages(
        role,
        employeeId,
        numPerPage,
        page
      );
    } else if (numPerPage > totalRows) {
      data = await repo.getIdeaboxList(role, employeeId);
    }

    res.status(200).json({
      message: "OK",
      data: data,
      errors: null,
      totalData: totalRows,
    });
  } catch (error) {
    return res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get ideabox list",
      data: req.body,
      errors: error,
    });
  }
});

//upload photo config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = __dirname + "/../public/ideabox";
    cb(null, path);
  },
  filename: function (req, file, cb) {
    var filename = `${file.fieldname}_${moment().format("YYYYMMDDhhmmss")}_${
      file.originalname
    }`;
    cb(null, filename);
  },
});

var upload = multer({
  storage: storage,
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

router.post(
  "/submit",
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const request = JSON.parse(req.body.data);
      const { master, detail, comment } = request;

      console.log("master", master);
      console.log("detail", detail);
      console.log("comment", comment);

      const beforeImage = req.files.beforeImage[0];
      const afterImage = req.files.afterImage[0];

      const ideasheetDetail = {
        ...detail,
        beforeImage: beforeImage.filename,
        afterImage: afterImage.filename,
      };

      var ideaboxId = await service.submit(master);

      await service.submitComment(ideaboxId, comment);

      const { impact, ideaType } = master;
      impact.map(async (item) => {
        await service.submitImpact(ideaboxId, item);
      });

      if (ideaType === "UMUM") {
        await service.submitDetailUmum(ideaboxId, ideasheetDetail);
      } else {
        await service.submitDetailKyt(ideaboxId, ideasheetDetail);
      }

      res.status(200).json({
        result: "OK",
        message: "Successfully submit ideabox",
        data: req.body,
        errors: null,
      });
    } catch (error) {
      return res.status(500).json({
        result: "FAIL",
        message: "Internal server error, failed to submit ideabox",
        data: req.body,
        errors: error,
      });
    }
  }
);

router.post("/submit/impact", async (req, res) => {
  try {
    const { ideaboxId, impactId } = req.body;
    var result = await service.submitImpact(ideaboxId, impactId);

    res.status(200).json({
      result: "OK",
      message: "Successfully submit ideabox impact",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    return res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to submit ideabox impact",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/submit/kyt", async (req, res) => {
  try {
    console.log(req.body.data);
    const { master, detail, comment } = req.body;

    console.log("master", master);
    console.log("detail", detail);
    console.log("comment", comment);

    var result = await service.submit(master, detail, comment);

    res.status(200).json({
      result: "OK",
      message: "Successfully submit ideabox",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    return res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to submit ideabox",
      data: req.body,
      errors: error,
    });
  }
});

//approve
router.post("/approve", async (req, res) => {
  try {
    const { employeeId, ideaboxId } = req.body;
    var result = await service.approve(ideaboxId, employeeId);

    res.status(200).json({
      result: "OK",
      message: "Successfully approve ideabox",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to approve ideabox",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/reject", async (req, res) => {
  try {
    const { ideaboxId, employeeId } = req.body;
    var result = await service.reject(ideaboxId, employeeId);

    res.status(200).json({
      result: "OK",
      message: "Successfully reject ideabox",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to reject ideabox",
      data: req.body,
      errors: error,
    });
  }
});

module.exports = router;
