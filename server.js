const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const cron = require("node-cron");
const notif = require("./services/approvalNotificationService");

var bodyParser = require("body-parser");

const app = express();

//init middleware
app.use(express.json({ extended: false }));

/* Use cors and fileUpload*/
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "DELETE, PUT, POST, GET");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, sessionId, x-auth-token"
  );
  if ("OPTIONS" == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

//routes
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/announcement", require("./routes/announcement"));
app.use("/api/payslip", require("./routes/payslip"));
app.use("/api/information", require("./routes/information"));
app.use("/api/todo", require("./routes/todo"));
app.use("/api/role", require("./routes/role"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/connect", require("./routes/connect"));
app.use("/api/catering", require("./routes/catering"));
app.use("/api/survey", require("./routes/survey"));
app.use("/api/ideabox", require("./routes/ideabox"));
app.use("/api/master", require("./routes/master"));
app.use("/api/approval", require("./routes/approval"));
app.use("/api/ideabox/notification", require("./routes/approvalNotification"));

//test
app.get("/xyz", (req, res) => res.send("Hello World!"));

app.use(fileUpload());
app.use("/public", express.static(__dirname + "/public"));
app.use("/payslip", express.static(__dirname + "/public/payslip"));
app.use("/files", express.static(__dirname + "/public/uploads"));
app.use("/photos", express.static(__dirname + "/public/photos"));
app.use("/survey", express.static(__dirname + "/public/survey"));
app.use("/ideabox", express.static(__dirname + "/public/ideabox"));

//port
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

//scheduler
cron.schedule("0 0 7 * * *", async () => {
  console.log("mail scheduler run");

  await notif.dailyNotification();
});
