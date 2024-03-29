const express = require("express");
const router = express.Router();

const service = require("../services/approvalRoleService");
const query = require("../queries/approvalRoleQuery");
const repo = require("../repositories/ideaboxRepository");

router.get("/", async (req, res) => {
  try {
    const result = await query.getApprovalRoleMapping();

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get approval mapping list",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/mapping", async (req, res) => {
  try {
    const result = await query.getUserThatNotMapped();

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get user mapping list",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/mapping/users", async (req, res) => {
  try {
    const result = await query.getActiveUsers();

    const users = result.map((user) => {
      return {
        employeeId: user.employeeId,
        name: user.name,
      };
    });

    res.status(200).json({
      result: users,
      message: "OK",
      data: users,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to get user list",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/search", async (req, res) => {
  try {
    const { keywords } = req.body;
    const result = await query.searchApprovalRoleMapping(keywords);

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to search approval mapping list",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/mapping/search", async (req, res) => {
  try {
    const { keywords } = req.body;
    const result = await query.searchUser(keywords);

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to search user mapping list",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/mapping/add", async (req, res) => {
  try {
    const { employeeId, approvalRole, departments } = req.body;

    await service.mapUserToRole(approvalRole, employeeId, departments);

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: null,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to mapp user",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/remove", async (req, res) => {
  try {
    const { ids } = req.body;

    ids.map(async (id) => {
      await service.removeMappingById(id);
    });

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: null,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to remove user from mapping",
      data: req.body,
      errors: error,
    });
  }
});

module.exports = router;
