var express = require('express');
var router = express.Router();
var errorCodes = require('../helpers/app.constants').errorCodes;
var authModel = require('../models/auth.model');
var errorHandler = require('../helpers/error_handler');
var successHandler = require('../helpers/success_handler');
var validator = require('../helpers/validators');
var uuid = require('node-uuid');

// Welcome Note
router.get('/', function(req, res) {
    res.json({ message: 'Welcome to the Task Manager API center!!!'});
});

// Admin Registration
router.post('/registerAdmin',function(req,res){
    //validate input fields
    req.checkBody('firstName','firstName is mandatory').isNotEmpty();
    req.checkBody('lastName','lastName is mandatory').isNotEmpty();
    req.checkBody('email','email is mandatory').isNotEmpty();
    req.checkBody('password','password field is mandatory').isNotEmpty();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var inputData = {
        firstName : req.param('firstName'),
        lastName : req.param('lastName'),
        email : req.param('email'),
        password : req.param('password'),
        role : "admin"
    };
    authModel.registerUser(inputData,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

// User Registration
router.post('/registerUser',function(req,res){
    //validate input fields
    req.checkBody('firstName','firstName is mandatory').isNotEmpty();
    req.checkBody('lastName','lastName is mandatory').isNotEmpty();
    req.checkBody('email','email is mandatory').isNotEmpty();
    req.checkBody('password','password field is mandatory').isNotEmpty();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var inputData = {
        firstName : req.param('firstName'),
        lastName : req.param('lastName'),
        email : req.param('email'),
        password : req.param('password'),
        role : "user"
    };
    authModel.registerUser(inputData,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

// Admin/User Login
router.post('/login', function(req,res){
    req.checkBody('email', 'email field is mandatory').isNotEmpty();
    req.checkBody('password','password field is mandatory').isNotEmpty();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var inputdata = {
        email : req.param('email'),
        password : req.param('password')
    };
    
    authModel.verifyUser(inputdata,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

module.exports = router;