const express = require("express");
const service = require("../services/approvalNotificationService");
const query = require("../queries/approvalNotificationQuery");

const router = express.Router();

router.get("/mapping", async (req, res) => {
  try {
    const employeeId = req.query.employeeId;
    const result = await query.getNotificationMappingsByEmployeeId(employeeId);

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message:
        "Internal server error, failed to get approval notification mapping list",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/mapping/department", async (req, res) => {
  try {
    const employeeId = req.query.employeeId;
    const result = await query.getDepartmentByApprovalRoleEmployee(employeeId);

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message:
        "Internal server error, failed to get approval notification mapping department list",
      data: req.body,
      errors: error,
    });
  }
});

router.get("/notiftype", async (req, res) => {
  try {
    const result = await query.getNotificationType();

    res.status(200).json({
      result: "OK",
      message: "OK",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message:
        "Internal server error, failed to get approval notification type list",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/mapping/add", async (req, res) => {
  try {
    const { notificationType, employeeId, departmentId } = req.body;
    const result = await service.createMapping(
      notificationType,
      employeeId,
      departmentId
    );

    res.status(200).json({
      result: "OK",
      message: "Successfully create notification mapping",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to create notification mapping",
      data: req.body,
      errors: error,
    });
  }
});

router.post("/mapping/remove", async (req, res) => {
  try {
    const { ids } = req.body;

    ids.map(async (id) => {
      await service.removeMappingById(id);
    });

    res.status(200).json({
      result: "OK",
      message: "Successfully create remove mapping",
      data: result,
      errors: null,
    });
  } catch (error) {
    res.status(500).json({
      result: "FAIL",
      message: "Internal server error, failed to remove notification mapping",
      data: req.body,
      errors: error,
    });
  }
});

module.exports = router;
