var express = require('express');
var router = express.Router();
var Sync = require('sync');
var userModel = require('../models/users.model');
var authModel = require('../models/auth.model');
var errorHandler = require('../helpers/error_handler');
var successHandler = require('../helpers/success_handler');
var errorCodes = require('../helpers/app.constants').errorCodes;
var validator = require('../helpers/validators');
var uuid = require('node-uuid');
var Q = require('q');

// Updating User Profile Data
router.post('/updateUserProfile', function(req,res){
    var data = req.body;
    data.userId = req.currentUser._id;
    userModel.updateUserProfile(data,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});


// Get User Data By Id
router.get('/getUserById', function(req,res){
    var param = {
        userId : req.currentUser._id
    }
    userModel.getUserById(param,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

module.exports = router;