const express = require("express");
const router = express.Router();
const config = require("config");
const multer = require("multer");
const moment = require("moment");
const service = require("../services/ideaboxService");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const repo = require("../repositories/ideaboxRepository");
const query = require("../queries/ideaboxViewQuery");
const queryEdit = require("../queries/ideaboxEditQuery");
const notifService = require("../services/approvalNotificationService");
const queryPdf = require("../queries/ideaboxPdfQuery");
const logger = require("../utils/logger");

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

const uploadFilter = function (req, file, cb) {
  console.log(file.mimetype);

  const mimeType = file.mimetype;
  if (
    mimeType === "image/png" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/bmp" ||
    mimeType === "image/gif" ||
    mimeType === "image/tiff"
  ) {
    cb(null, true);
  } else {
    return cb(
      new Error(
        "File type not accepted, please reupload using (.png, .jpg, .jpeg, .bmp, .gif, .tiff)"
      )
    );
  }
};

var upload = multer({
  storage: storage,

  fileFilter: uploadFilter,
});

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
    logger.error(error);
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
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get total closed ideasheet",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/closedIdeaCount", async (req, res) => {
  try {
    const year = req.query.year;
    const employeeId = req.query.employeeId;

    const total = await repo.getTotalClosedIdeaboxByYearAndEmployee(
      year,
      employeeId
    );

    res.status(200).json({
      result: "OK",
      message: "Success",
      data: total,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get total closed ideasheet",
      data: req.body,
      errors: error,
    });
  }
});

/* route for view ideabox  */
router.get("/view/:id", async (req, res) => {
  try {
    const ideaboxId = req.params.id;
    const master = await query.getIdeaboxById(ideaboxId);
    const detail = await query.getIdeaboxDetailByIdeaboxId(ideaboxId);
    const comments = await query.getCommentsByIdeaboxId(ideaboxId);
    const impacts = await query.getImpactsByIdeaboxId(ideaboxId);

    let arrImpact = [];
    impacts.map((item) => {
      arrImpact = [...arrImpact, item.impact_id];
    });

    const result = {
      master,
      detail,
      comments,
      impacts: arrImpact,
    };

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get ideabox",
      data: req.body,
      errors: error,
    });
  }
});

/* routes for edit  */
router.get("/edit/:id", async (req, res) => {
  try {
    const ideaboxId = req.params.id;
    const employeeId = req.query.employee;

    const master = await queryEdit.getIdeaboxById(ideaboxId);
    const detail = await queryEdit.getIdeaboxDetailByIdeaboxId(ideaboxId);
    const comment = await queryEdit.getCommentByEmployeeIdAndIdeaboxId(
      employeeId,
      ideaboxId
    );
    const impacts = await queryEdit.getImpactsByIdeaboxId(ideaboxId);

    let arrImpact = [];
    impacts.map((item) => {
      arrImpact = [...arrImpact, item.impact_id];
    });

    const result = {
      master,
      detail,
      comment,
      impacts: arrImpact,
    };

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get ideabox",
      data: req.body,
      errors: error,
    });
  }
});

router.post(
  "/edit",
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const request = JSON.parse(req.body.data);
      const { master, detail, comment, impact } = request;
      const { beforeImageFile, afterImageFile } = detail;
      let { beforeImage, afterImage } = detail;

      console.log(comment);

      if (beforeImageFile !== null) {
        beforeImage = req.files.beforeImage[0].filename;
      }

      if (afterImageFile !== null) {
        afterImage = req.files.afterImage[0].filename;
      }

      const ideasheetDetail = {
        ...detail,
        beforeImage: beforeImage,
        afterImage: afterImage,
      };

      const { ideaboxId } = master;

      await service.update(master);
      await service.submitComment(ideaboxId, comment);
      await service.replaceImpacts(ideaboxId, impact);
      await service.updateDetail(ideasheetDetail);

      res.status(200).json({
        result: "OK",
        message: "OK",
        data: request,
        errors: null,
      });
    } catch (error) {
      logger.error(error);
      res.status(500).json({
        result: "FAIL",
        message: "Internal server error, failed to edit ideabox 123",
        data: req.body,
        errors: error,
      });
    }
  }
);

/* routes for dashboard */
router.post("/list", async (req, res) => {
  try {
    const { approvalRole, employeeId } = req.body;

    let data = [];
    if (approvalRole === "EMPLOYEE") {
      data = await repo.getIdeaboxListForEmployee(employeeId);
    } else if (approvalRole === "ADMIN") {
      data = await repo.getIdeaboxListForAdmin();
    } else if (
      approvalRole === "SECTION_MANAGER" ||
      approvalRole === "DEPARTMENT_MANAGER"
    ) {
      data = await repo.getIdeaboxListForManager(approvalRole, employeeId);
    } else {
      data = await repo.getIdeaboxList(approvalRole);
    }

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: data,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get ideabox list",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/list/search", auth, async (req, res) => {
  try {
    const { keywords, approvalRole, employeeId } = req.body;
    1;

    let data = [];

    console.log(approvalRole, employeeId, keywords);

    if (approvalRole === "ADMIN") {
      data = await repo.searchIdeaboxListForAdmin(keywords);
    } else if (approvalRole === "EMPLOYEE") {
      data = await repo.searchIdeaboxListForEmployee(employeeId, keywords);
    } else if (
      approvalRole === "SECTION_MANAGER" ||
      approvalRole === "DEPARTMENT_MANAGER"
    ) {
      data = await repo.searchIdeaboxListForManager(
        employeeId,
        approvalRole,
        keywords
      );
    } else {
      data = await repo.searchIdeaboxList(approvalRole, employeeId, keywords);
    }

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data,
      errors: null,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      status: 500,
      message: "Failed to search ideabox list",
      data: req.body,
      errors: err,
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
    logger.error(error);
    return res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get ideabox list",
      data: req.body,
      errors: error,
    });
  }
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

      // console.log("master", master);
      // console.log("detail", detail);
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

      const departmentName = await repo.getDepartmentNameById(
        master.departmentId
      );

      //console.log("master:", master);

      await notifService.notifySectionManager(
        master.departmentId,
        departmentName,
        master.submitterName
      );

      res.status(200).json({
        result: "OK",
        message: "Successfully submit ideabox",
        data: req.body,
        errors: null,
      });
    } catch (error) {
      logger.error(error);
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
    logger.error(error);
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
    const { master, detail, comment } = req.body;

    var result = await service.submit(master, detail, comment);

    res.status(200).json({
      result: "OK",
      message: "Successfully submit ideabox",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
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
    const { employeeId, ideaboxIds } = req.body;

    ideaboxIds.map(async (id) => {
      await service.approve(id, employeeId);
    });

    res.status(200).json({
      result: "OK",
      message: "Successfully approve ideabox",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to approve ideabox",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/posting", async (req, res) => {
  try {
    const { employeeId, ideaboxIds } = req.body;

    ideaboxIds.map(async (id) => {
      await service.posting(id, employeeId);
    });

    res.status(200).json({
      result: "OK",
      message: "Successfully posting ideabox",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to posting ideabox",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/reject", async (req, res) => {
  try {
    const { ideaboxIds, employeeId } = req.body;

    ideaboxIds.map(async (id) => {
      await service.reject(id, employeeId);
    });

    res.status(200).json({
      result: "OK",
      message: "Successfully reject ideabox",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to reject ideabox",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/delete", async (req, res) => {
  try {
    const { ideaboxIds } = req.body;

    ideaboxIds.map(async (id) => {
      const image = await repo.getIdeaboxImageById(id);

      service.deleteFile(image.beforeImage, image.afterImage);

      await service.remove(id);
    });

    res.status(200).json({
      result: "OK",
      message: "Successfully remove ideabox",
      data: req.body,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to remove ideabox",
      data: req.body,
      errors: error,
    });
  }
});

// route for users
router.get("/user", auth, async (req, res) => {
  try {
    const data = await repo.getAdminUsers();

    res.status(200).json({
      message: "OK",
      data: data,
      errors: null,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      message: "Failed to get users",
      data: req.body,
      errors: err,
    });
  }
});

router.post("/user/search", auth, async (req, res) => {
  try {
    const { keywords } = req.body;

    const data = await repo.searchAdminUsers(keywords);

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data,
      errors: null,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      status: 500,
      message: "Failed search users",
      data: req.body,
      errors: err,
    });
  }
});

router.post("/notify", async (req, res) => {
  try {
    //await notifService.notifySectionManager(3, "PC", "WAHYU TES");

    await notifService.dailyNotification();

    res.status(200).json({
      result: "OK",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "ERROR",
      message: error,
    });
  }
});

/* route for view pdf ideabox  */
router.get("/pdf/:id", async (req, res) => {
  try {
    const ideaboxId = req.params.id;
    const data = await queryPdf.getData(ideaboxId);

    //console.log(data);

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: data,
      errors: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get ideabox",
      data: req.body,
      errors: error,
    });
  }
});

module.exports = router;
