const express = require("express");
const router = express.Router();
const config = require("config");
const multer = require("multer");
const service = require("../services/ideaboxService");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const repo = require("../repositories/ideaboxRepository");

router.get("/ideaboxtype", async (req, res) => {
  try {
    const data = await repo.getIdeaTypes();

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: data,
      errors: error,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed toget ideabox types",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/ideaboximpact", async (req, res) => {
  try {
    const data = await repo.getIdeaImpacts();

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: data,
      errors: error,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed toget ideabox impacts",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/ideaboxrank", async (req, res) => {
  try {
    const data = await repo.getIdeaRanks();

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: data,
      errors: error,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed toget ideabox ranks",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/department", async (req, res) => {
  try {
    const data = await repo.getDepartments();

    const result = data.map((d) => {
      return {
        id: d.id,
        departmentName: d.departmentName,
      };
    });

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed toget departments",
      data: req.body,
      errors: error,
    });
  }
});

module.exports = router;
