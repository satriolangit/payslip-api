const jwt = require("jsonwebtoken");
const config = require("config");
const db = require("../config/database");

module.exports = async function (req, res, next) {
  //Get token from header
  const token = req.header("x-auth-token");

  if (!token) {
    res.status(401).json({
      status: 401,
      message: "No token, authorization denied",
      data: req.body,
      errors: null,
    });
  }

  try {
    const decoded = jwt.verify(token, config.get("jwtSecretKey"));
    //req.user = decoded.user;
    const userId = decoded.user.id;

    console.log(decoded);

    //check user
    const sql = "SELECT user_id FROM user WHERE user_id = ? AND role= 'admin' ";
    let user = await db.query(sql, userId);

    console.log("user:", user);

    if (user.length > 0) {
      next();
    } else {
      return res.status(401).json({
        status: 401,
        message: "Authorization denied",
        data: req.body,
        errors: null,
      });
    }
  } catch (err) {
    return res.status(401).json({
      status: 0,
      message: "Token not valid, authorization denied",
      data: req.body,
      errors: null,
    });
  }
};
