const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const uuidv4 = require("uuid/v4");
const moment = require("moment");

const auth = require("../middleware/auth");
const db = require("../config/database");
const adminOnly = require("../middleware/adminOnly");

const timestamp = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
const secretKey = config.get("jwtSecretKey");

// @route   GET api/information
// @desc    Get all informations
// @access  Private
router.get("/item/:id", auth, async (req, res) => {
  try {
    const sql =
      "SELECT * FROM information WHERE id = ? ORDER BY created_on DESC";
    const data = await db.query(sql, req.params.id);

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
      message: "Failed to get informations",
      data: req.body,
      errors: err,
    });
  }
});

// @route   GET api/information/latest
// @desc    Get 5 latest informations
// @access  Private
router.get("/latest", auth, async (req, res) => {
  try {
    const sql = "SELECT * FROM information ORDER BY created_on DESC LIMIT 5";
    const data = await db.query(sql);

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
      message: "Failed to get informations",
      data: req.body,
      errors: err,
    });
  }
});

// @route   GET api/information/today
// @desc    Get today informations
// @access  Private
router.get("/today", auth, async (req, res) => {
  try {
    const sql =
      "SELECT * FROM information WHERE created_on BETWEEN ? AND ? ORDER BY created_on DESC LIMIT 5";
    const start = moment().format("YYYY-MM-DD 00:00:00");
    const end = moment().format("YYYY-MM-DD 23:59:59");

    const data = await db.query(sql, [start, end]);

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
      message: "Failed to get informations",
      data: req.body,
      errors: err,
    });
  }
});

router.get("/today/count", auth, async (req, res) => {
  try {
    const sql =
      "SELECT id FROM information WHERE created_on BETWEEN ? AND ? ORDER BY created_on DESC LIMIT 5";
    const start = moment().format("YYYY-MM-DD 00:00:00");
    const end = moment().format("YYYY-MM-DD 23:59:59");

    const data = await db.query(sql, [start, end]);

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data.length,
      errors: null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: 500,
      message: "Failed to get informations",
      data: req.body,
      errors: err,
    });
  }
});

// @route   GET api/information/limit/:limit
// @desc    Get 5 latest informations
// @access  Private
router.get("/limit/:limit", auth, async (req, res) => {
  try {
    const sql = "SELECT * FROM information ORDER BY created_on DESC LIMIT ?";
    const data = await db.query(sql, req.params.limit);

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
      message: "Failed to get informations",
      data: req.body,
      errors: err,
    });
  }
});

// @route   GET api/information/
// @desc    Get all
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const sql = "SELECT * FROM information ORDER BY created_on DESC";
    const data = await db.query(sql);

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
      message: "Failed to get informations",
      data: req.body,
      errors: err,
    });
  }
});

// @route   GET api/information/page/:page
// @desc    Get information per pages
// @access  Private
router.get("/page/:page/:size", auth, async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const numPerPage = parseInt(req.params.size) || 20;
    const query = await db.query("SELECT COUNT(*) AS total FROM information");
    const totalRows = query[0].total;

    let sql = "";
    let data = null;
    if (page * numPerPage < totalRows) {
      sql =
        "SELECT * FROM information ORDER BY created_on DESC LIMIT ? OFFSET ?";
      data = await db.query(sql, [numPerPage, page]);
    } else if (numPerPage > totalRows) {
      sql = "SELECT * FROM information ORDER BY created_on DESC";
      data = await db.query(sql);
    }

    res.status(200).json({
      status: 200,
      message: "OK",
      data: data,
      errors: null,
      totalData: totalRows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: 500,
      message: "Failed to get information",
      data: req.body,
      errors: err,
    });
  }
});

// @route   POST api/information
// @desc    Create new information
// @access  Private, AdminOnly
router.post(
  "/",
  [auth, adminOnly, [check("title", "Please enter title").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 400,
        message: "Bad request",
        data: null,
        errors: errors.array(),
      });
    }

    try {
      const token = req.header("x-auth-token");
      const decoded = jwt.verify(token, secretKey);
      const createdBy = decoded.user.id;
      const uid = uuidv4();
      const { title, text } = req.body;

      const sql =
        "INSERT INTO information (id, title, text, created_on, created_by) " +
        "VALUES (?, ?, ?, ?, ?)";

      const now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

      await db.query(sql, [uid, title, text, now, createdBy]);

      res.status(200).json({
        status: 200,
        message: "OK",
        data: null,
        errors: null,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        status: 500,
        message: "Create new information failed",
        data: null,
        errors: err,
      });
    }
  }
);

// @route   POST api/information/update
// @desc    Update existing information
// @access  Private, AdminOnly
router.post(
  "/update",
  [
    auth,
    adminOnly,
    [
      check("title", "Please enter title").not().isEmpty(),
      check("id", "Please provide information id").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 400,
        message: "Bad request",
        data: null,
        errors: errors.array(),
      });
    }

    try {
      const token = req.header("x-auth-token");
      const decoded = jwt.verify(token, secretKey);
      const createdBy = decoded.user.id;
      const { title, text, id } = req.body;

      const sql =
        "UPDATE information SET title=?, text=?, updated_on=?, updated_by=? WHERE id=?";

      const now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

      await db.query(sql, [title, text, now, createdBy, id]);

      res.status(200).json({
        status: 200,
        message: "OK",
        data: null,
        errors: null,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        status: 500,
        message: "Update information failed",
        data: null,
        errors: err,
      });
    }
  }
);

// @route   POST api/information/delete
// @desc    Delete a information
// @access  private, admin only
router.post(
  "/delete",
  [auth, adminOnly, [check("id").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 400,
        message: "Error",
        data: req.body,
        errors: errors.array(),
      });
    }

    const { id } = req.body;

    try {
      const sql = "DELETE FROM information WHERE id = ?";
      await db.query(sql, id);

      return res.status(200).json({
        status: 200,
        message: "Delete information success.",
        data: req.body,
        errors: null,
      });
    } catch (err) {
      console.log("Failed to delete information, error : ", err.message);
      return res.status(500).json({
        status: 500,
        message: "Failed to delete information",
        data: req.body,
        errors: err,
      });
    }
  }
);

// @route   POST api/information/search
// @desc    POST search
// @access  Private
router.post("/search", auth, async (req, res) => {
  try {
    const { keywords } = req.body;

    const sql =
      "SELECT * FROM information WHERE title LIKE ? OR text LIKE ? ORDER BY created_on DESC";
    const data = await db.query(sql, [
      "%" + keywords + "%",
      "%" + keywords + "%",
    ]);

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
      message: "Failed to get informations",
      data: req.body,
      errors: err,
    });
  }
});

// @route   POST api/information/multidelete
// @desc    Delete a information
// @access  private
router.post(
  "/multidelete",
  [auth, adminOnly, [check("ids").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Error",
        data: req.body,
        errors: errors.array(),
      });
    }

    const { ids } = req.body;

    try {
      for (i = 0; i < ids.length; i++) {
        let id = ids[i];

        let sql = "DELETE FROM information WHERE id = ?";
        await db.query(sql, id);
      }

      return res.status(200).json({
        message: "Successfully delete information",
        data: null,
        errors: null,
      });
    } catch (err) {
      console.log("Failed to delete user, error : ", err.message);
      return res.status(500).json({
        message: "Failed to delete user",
        data: req.body,
        errors: err,
      });
    }
  }
);

module.exports = router;
