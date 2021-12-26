const express = require('express');
const router = express.Router();
const config = require('config');
const multer = require('multer');
const service = require("../services/ideaboxService");
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/number', async (req, res) => {
    try {

        const number = await service.generateNumber();
        return res.status(200).json({
            ideaboxNumber : number
        });
        
    } catch (error) {
        return res.status(500).json({
            result: "FAIL",
            message: "Internal server error, failed to generate ideabox number",
            data: req.body,
            errors: error,
          });
    }
});

router.post('/submit', async (req, res) => {
    try {
      
        const {master, detail, comment} = req.body;
        
        console.log("master", master);
        console.log("detail", detail);
        console.log("comment", comment);

        var ideaboxId = await service.submit(master);
        await service.submitComment(ideaboxId, comment);

        if(master.ideaType === 'UMUM') {
            await service.submitDetailUmum(ideaboxId, detail);
        } else {
            await service.submitDetailKyt(ideaboxId, detail);
        }        

        res.status(200).json({
            result: "OK",
            message: "Successfully submit ideabox",
            data: req.body,
            errors: null,
          });
        
    } catch (error) {
        return res.status(500).json({
            result: "FAIL",
            message: "Internal server error, failed to submit ideabox",
            data: req.body,
            errors: error,
          });
    }
});

router.post('/submit/kyt', async (req, res) => {
    try {
        console.log(req.body.data);
        const {master, detail, comment} = req.body;
        
        console.log("master", master);
        console.log("detail", detail);
        console.log("comment", comment);

        var result = await service.submit(master, detail, comment);

        res.status(200).json({
            result: "OK",
            message: "Successfully submit ideabox",
            data: req.body,
            errors: null,
          });
        
    } catch (error) {
        return res.status(500).json({
            result: "FAIL",
            message: "Internal server error, failed to submit ideabox",
            data: req.body,
            errors: error,
          });
    }
});

module.exports = router;

