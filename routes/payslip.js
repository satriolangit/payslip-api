const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const uuidv4 = require("uuid/v4");
const moment = require("moment");
const IncomingForm = require("formidable").IncomingForm;
const fs = require("fs");
const pdf2base64 = require("pdf-to-base64");

//local lib
const auth = require("../middleware/auth");
const db = require("../config/database");
const adminOnly = require("../middleware/adminOnly");
const service = require("../services/payslipService");

//utils
const secretKey = config.get("jwtSecretKey");

router.post("/upload", (req, res) => {
  try {
    console.log("enter upload payslip");
    var form = new IncomingForm();
    let logs = "";

    form.on("fileBegin", async (name, file) => {
      file.path = __dirname + "/../public/payslip/" + file.name;

      console.log(file);
    });

    form.on("file", async (field, file) => {
      // Do something with the file
      // e.g. save it to the database
      // you can access it using file.path

      console.log("ener on file");

      var pdf = file.name;
      var filenames = pdf.split(".");
      var year = filenames[0].split("_")[0].substring(0, 4);
      var month = filenames[0].split("_")[0].substring(4);
      var employeeId = filenames[0].split("_")[1];
      var employeeName = filenames[0]
        .replace(year, "")
        .replace(month, "")
        .replace(employeeId, "")
        .replace(/_/g, " ")
        .trim();

      //save to db
      // const token = req.header('x-auth-token');
      // const decoded = jwt.verify(token, secretKey);
      const createdBy = "0"; //decoded.user.id;

      const isEmployeeFound = await service.isEmployeeFound(employeeId);
      const isPayslipAlreadyExist = await service.isFileExist(pdf);
      console.log(
        "isEmployeeFound: ",
        isEmployeeFound,
        " isFileAlreadyExist:",
        isPayslipAlreadyExist
      );
      if (isEmployeeFound && !isPayslipAlreadyExist) {
        await service.createPayslip(
          employeeId,
          employeeName,
          year,
          month,
          pdf,
          createdBy
        );
        await service.addUploadLog(pdf, "OK", "", employeeId);
        logs = pdf + " : OK";
      } else {
        //delete file
        if (!isEmployeeFound) {
          const path = "./public/payslip/" + pdf;
          console.log("path:", path);
          fs.unlinkSync(path);
        }

        let logMessage = "NIK : " + { employeeId } + " NOT FOUND";
        if (isPayslipAlreadyExist) logMessage = "DOUBLE UPLOAD";

        await service.addUploadLog(pdf, "NOT OK", logMessage, employeeId);

        logs = pdf + " : FAIL";
      }
    });

    form.on("end", () => {
      res.json({ message: logs });
    });
    form.parse(req);
  } catch (error) {
    console.log(error);
  }
});

router.get("/download/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const path = "./public/payslip/" + filename;
    console.log(path);
    res.download(path);

    console.log("filename: ", filename, "path:", path);

    //set lastdownload & downloadcount
    let downloadCount = 0;
    let sql =
      "SELECT IFNULL(download_count, 0) AS download_count FROM payslip WHERE filename = ? LIMIT 1";
    let result = await db.query(sql, filename);
    const now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

    if (result.length > 0) {
      downloadCount = result[0].download_count;
      const count = downloadCount + 1;
      console.log("count :", count);
      sql =
        "UPDATE payslip SET download_count = ?, last_download_on = ? WHERE filename = ?";
      await db.query(sql, [count, now, filename]);
    }
  } catch (error) {
    console.log("error download payslip:", error);
  }
});

router.get("/download2/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const path = "./public/payslip/" + filename;

    console.log(path);
    //set lastdownload & downloadcount
    let downloadCount = 0;
    let sql =
      "SELECT IFNULL(download_count, 0) AS download_count FROM payslip WHERE filename = ? LIMIT 1";
    let result = await db.query(sql, filename);
    const now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

    if (result.length > 0) {
      downloadCount = result[0].download_count;
      const count = downloadCount + 1;
      console.log("count :", count);
      sql =
        "UPDATE payslip SET download_count = ?, last_download_on = ? WHERE filename = ?";
      await db.query(sql, [count, now, filename]);
    }

    const url = config.get("payslip_url") + filename;
    res.json({ url });
  } catch (error) {
    console.log("error download payslip:", error);
  }
});

// @route   GET api/payslip
// @desc    Get all payslip
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    let sql = `SELECT p.id, p.employee_id, p.filename, p.download_count, p.last_download_on, p.created_on, p.created_by, 
						p.year, p.month, u.name as employee_name, CONCAT(p.id, ';', p.filename) as idx 
					FROM payslip p INNER JOIN user u ON u.employee_id = p.employee_id
					ORDER BY year, month DESC`;

    const data = await db.query(sql);

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data,
      errors: null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: 500,
      message: "Failed to get payslip",
      data: req.body,
      errors: err
    });
  }
});

// @route   GET api/payslip/:employeeId
// @desc    Get employee payslip
// @access  Private
router.get("/:employeeId", auth, async (req, res) => {
  try {
    const sql =
      "SELECT *, concat(id, ';', filename) as idx FROM payslip WHERE employee_id = ? ORDER BY year, month DESC";
    const data = await db.query(sql, req.params.employeeId);

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data,
      errors: null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: 500,
      message: "Failed to get payslip",
      data: req.body,
      errors: err
    });
  }
});

// @route   GET api/payslip/open/:filename
// @desc    Get pdf base46
// @access  Private
router.get("/open/:filename", async (req, res) => {
  const filename = req.params.filename;
  const path = "./public/payslip/" + filename;
  console.log(filename, path);
  pdf2base64(path)
    .then(response => {
      console.log(response); //cGF0aC90by9maWxlLmpwZw==
      res.json({ response });
    })
    .catch(error => {
      console.log(error); //Exepection error....
      res.status(500).json({ error });
    });
});

// @route   GET api/payslip/page/:page
// @desc    Get payslip per pages
// @access  Private
router.get("/page/:page", auth, async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const numPerPage = 30;
    const query = await db.query("SELECT COUNT(*) AS total FROM payslip");
    const totalRows = query[0].total;

    let sql = "";
    let data = null;
    if (page * numPerPage < totalRows) {
      sql = `SELECT p.id, p.employee_id, p.filename, IFNULL(p.download_count, 0) AS download_count, p.last_download_on, p.created_on, p.created_by, 
              p.year, p.month, u.name as employee_name, CONCAT(p.id, ';', p.filename) as idx 
            FROM payslip p INNER JOIN user u ON u.employee_id = p.employee_id			
            ORDER BY year, month DESC LIMIT ? OFFSET ?`;
      data = await db.query(sql, [numPerPage, page]);
    } else if (numPerPage > totalRows) {
      sql = `SELECT p.id, p.employee_id, p.filename, IFNULL(p.download_count, 0) AS download_count, p.last_download_on, p.created_on, p.created_by, 
          p.year, p.month, u.name as employee_name, CONCAT(p.id, ';', p.filename) as idx 
        FROM payslip p INNER JOIN user u ON u.employee_id = p.employee_id			
        ORDER BY year, month DESC`;
      data = await db.query(sql);
    }

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data,
      errors: null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: 500,
      message: "Failed to get payslip",
      data: req.body,
      errors: err
    });
  }
});

// @route   GET api/payslip/:employeeId/:limit
// @desc    Get employee payslip top limit
// @access  Private
router.get("/:employeeId/:limit", auth, async (req, res) => {
  try {
    const sql =
      "SELECT *, concat(id, ';', filename) as idx FROM payslip WHERE employee_id = ? ORDER BY year, month DESC LIMIT " +
      req.params.limit;
    const data = await db.query(sql, req.params.employeeId);

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data,
      errors: null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: 500,
      message: "Failed to get payslip",
      data: req.body,
      errors: err
    });
  }
});

// @route   POST api/payslip/delete
// @desc    Delete a payslip
// @access  private
router.post(
  "/delete",
  [
    auth,
    adminOnly,
    [
      check("id")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 400,
        message: "Error",
        data: req.body,
        errors: errors.array()
      });
    }

    const { id, filename } = req.body;

    try {
      const sql = "DELETE FROM payslip WHERE id = ?";
      await db.query(sql, id);

      //delete file
      const path = "./public/payslip/" + filename;
      console.log("path:", path);
      fs.unlinkSync(path);

      return res.status(200).json({
        status: 200,
        message: "Successfully delete payslip",
        data: req.body,
        errors: null
      });
    } catch (err) {
      console.log("Failed to delete payslip, error : ", err.message);
      return res.status(500).json({
        status: 500,
        message: "Failed to delete user",
        data: req.body,
        errors: err
      });
    }
  }
);

// @route   POST api/payslip/deletes
// @desc    Delete a payslip
// @access  private
router.post(
  "/deletes",
  [
    auth,
    adminOnly,
    [
      check("ids")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 400,
        message: "Error",
        data: req.body,
        errors: errors.array()
      });
    }

    const { ids } = req.body;
    console.log(req.body);
    try {
      for (i = 0; i < ids.length; i++) {
        const id = ids[i].split(";")[0];
        const filename = ids[i].split(";")[1];

        let sql = "DELETE FROM payslip WHERE id = ?";
        await db.query(sql, id);

        //delete file
        const path = "./public/payslip/" + filename;
        console.log("path:", path);
        fs.unlinkSync(path);

        console.log("id:", id, "filename:", filename);
      }

      return res.status(200).json({
        status: 200,
        message: "Successfully delete payslip",
        data: req.body,
        errors: null
      });
    } catch (err) {
      console.log("Failed to delete payslip, error : ", err.message);
      return res.status(500).json({
        status: 500,
        message: "Failed to delete user",
        data: req.body,
        errors: err
      });
    }
  }
);

// @route   POST api/payslip/search
// @desc    POST search
// @access  Private
router.post("/search", auth, async (req, res) => {
  try {
    const { keywords } = req.body;

    const sql = `SELECT p.id, p.employee_id, p.filename, IFNULL(p.download_count,0) AS download_count, p.last_download_on, p.created_on, p.created_by, 
						p.year, p.month, u.name as employee_name, CONCAT(p.id, ';', p.filename) as idx 
					FROM payslip p INNER JOIN user u ON u.employee_id = p.employee_id
					WHERE u.name LIKE ? OR p.employee_id LIKE ? OR p.filename LIKE ?
					ORDER BY year, month DESC`;

    const data = await db.query(sql, [
      "%" + keywords + "%",
      "%" + keywords + "%",
      "%" + keywords + "%"
    ]);

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data,
      errors: null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: 500,
      message: "Failed to get users",
      data: req.body,
      errors: err
    });
  }
});

module.exports = router;
