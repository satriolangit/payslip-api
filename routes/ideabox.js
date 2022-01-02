const express = require("express");
const router = express.Router();
const config = require("config");
const multer = require("multer");
const service = require("../services/ideaboxService");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const repo = require("../repositories/ideaboxRepository");

router.get("/number", async (req, res) => {
  try {
    const number = await service.generateNumber();
    return res.status(200).json({
      ideaboxNumber: number,
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

    res.status(500).json({
      result: "OK",
      message: "Success",
      data: total,
      errors: error,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to generate ideabox number",
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

router.post("/submit", async (req, res) => {
  try {
    const { master, detail, comment } = req.body;

    console.log("master", master);
    console.log("detail", detail);
    console.log("comment", comment);

    var ideaboxId = await service.submit(master);
    await service.submitComment(ideaboxId, comment);

    if (master.ideaType === "UMUM") {
      await service.submitDetailUmum(ideaboxId, detail);
    } else {
      await service.submitDetailKyt(ideaboxId, detail);
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
