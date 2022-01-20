const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const auth = require("../middleware/auth");
const db = require("../config/database");

const router = express.Router();

// @route   GET api/auth
// @desc    Get logged in user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const sql = `SELECT usr.user_id, usr.email, usr.name, usr.employee_id, usr.photo, usr.role, IFNULL(apr.role_id, 'EMPLOYEE') AS approval_role 
        FROM user usr LEFT JOIN approval_role_mapping apr ON apr.employee_id = usr.employee_id
        WHERE usr.user_id = ? LIMIT 1`;

    const user = await db.query(sql, [req.user.id]);

    res.status(200).json({
      status: 200,
      message: "OK",
      data: user,
      errors: null,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({
      status: 500,
      message: "Get logged user fail",
      data: req.body,
      errors: err,
    });
  }
});

// @route   POST api/auth
// @desc    Auth user & get token
// @access  Public
router.post(
  "/",
  [
    [
      check("nik", "NIK is required"),
      check("password", "Password is required").exists(),
    ],
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);

      return res.status(400).json({
        status: 400,
        message: "bad request",
        data: req.body,
        errors: errors.array(),
      });
    }

    const { nik, password, siteName } = req.body;
    console.log(req.body);

    try {
      let sql = "";
      let user = null;

      if (siteName !== "ALL") {
        sql =
          "SELECT user_id, role, password, is_active FROM user WHERE employee_id = ? AND (site_name = ? OR site_name = 'ALL') LIMIT 1";
        //console.log(sql);
        user = await db.query(sql, [nik, siteName]);
      } else {
        sql =
          "SELECT user_id, role, password, is_active FROM user WHERE employee_id = ? LIMIT 1";
        //console.log(sql);
        user = await db.query(sql, nik);
      }

      if (user.length === 0) {
        console.log("user:", user);
        return res.status(400).json({
          status: 400,
          message: "Invalid credentials",
          data: req.body,
          errors: null,
        });
      }

      user = user[0];

      if (user.is_active === 0) {
        //console.log('user not active');
        return res.status(400).json({
          status: 400,
          message: "User not active",
          data: req.body,
          errors: null,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        //console.log('invalid credentials');
        return res.status(400).json({
          status: 400,
          message: "Invalid credentials",
          data: req.body,
          errors: null,
        });
      }

      //add approval information to payload
      const query = await db.query(
        "SELECT id FROM approval_role_mapping WHERE employee_id = ? LIMIT 1",
        nik
      );
      const approvalRole = query.length > 0 ? query[0].id : "NONE";

      const payload = {
        user: {
          id: user.user_id,
          role: user.role,
          approvalRole: approvalRole,
          employeeId: nik,
        },
      };

      const secretKey = config.get("jwtSecretKey");
      const tokenExpiryTime = config.get("tokenExpiryTime");

      jwt.sign(
        payload,
        secretKey,
        { expiresIn: tokenExpiryTime },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).json({
        status: 500,
        message: "Failed to get token",
        data: req.body,
        errors: err,
      });
    }
  }
);

module.exports = router;
