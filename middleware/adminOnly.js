const jwt = require("jsonwebtoken");
const config = require("config");
const db = require("../config/database");

module.exports = async function (req, res, next) {
  //Get token from header
  const token = req.header("x-auth-token");

  // if (!token) {
  // 	res.status(401).json({
  // 		status: 401,
  // 		message: 'No token, authorization denied',
  // 		data: req.body,
  // 		errors: null,
  // 	});
  // }

  try {
    const decoded = jwt.verify(token, config.get("jwtSecretKey"));
    req.user = decoded.user;
    const userId = decoded.user.id;

    //check user
    const sql = "SELECT user_id FROM user WHERE user_id = ? AND role= 'admin' ";
    let user = await db.query(sql, userId);

    if (user.length === 0) {
      return res.status(401).json({
        status: 401,
        message: "Authorization denied",
        data: req.body,
        errors: null,
      });
    } else {
      next();
    }
  } catch (err) {
    res.status(401).json({
      status: 0,
      message: "Token not valid, authorization denied",
      data: req.body,
      errors: null,
    });
  }

  next();
};
