const express = require("express");
const router = express.Router();
const config = require("config");
const IncomingForm = require("formidable").IncomingForm;
const { check, validationResult } = require("express-validator");
const fs = require("fs");


//local lib
const auth = require("../middleware/auth");

router.post("/submit", (req, res) => {
  console.log(req.body);
});

router.post("/survey", (req, res) => {
    try {
      console.log("enter submit survey");
      var form = new IncomingForm();
  
      let imageUrl = config.get("upload_url");
      form.parse(req);

      console.log(req.body);
         
  
      form.on("fileBegin", function (name, file) {
        // const filename = file.name.replace(/\s+/g, "_").toLowerCase();
        // file.path = __dirname + "/../public/uploads/" + filename;
        // imageUrl += filename;

        console.log(file);

      });
  
      form.on("file", function (name, file) {
        console.log("Uploaded " + file.name);
      });
  
      form.on("end", () => {
        res.json({ result: "OK", imageUrl: imageUrl });
      });
    
    } catch (error) {
      console.log(error);
    }
  });
    
  module.exports = router;