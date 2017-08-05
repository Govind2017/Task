var express = require('express');
var router = express.Router();
var Sync = require('sync');
var userModel = require('../models/users.model');
var taskModel = require('../models/tasks.model');
var errorHandler = require('../helpers/error_handler');
var successHandler = require('../helpers/success_handler');
var errorCodes = require('../helpers/app.constants').errorCodes;
var validator = require('../helpers/validators');
var uuid = require('node-uuid');

// CREATE TASK
router.post('/createTask', function(req,res){
    req.checkBody('title', 'title field is mandatory').isNotEmpty();
    req.checkBody('parentId','Invalid parentId').optional().isUuid();
    req.checkBody('description', 'description field is mandatory').optional().isNotEmpty();
    req.checkBody('estimationDate','Invalid estimationDate').optional().isDate();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }

    var params = {
        title : req.param('title'),
        description : req.param('description'),
        ownerId : req.currentUser._id,
        role : req.currentUser.role,
        estimationDate : req.param('estimationDate'),
    };
    if(req.param('parentId')){
        params.parentId = req.param('parentId');
        params.treeLevel =  1;
    }else{
        params.treeLevel =  0;
    }
    taskModel.createTask(params,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

// GET TASK BY ID
router.get('/getTaskById', function(req,res){
    req.checkQuery('taskId','Invalid taskId').isUuid();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var params = {
        taskId : req.param('taskId'),
        ownerId : req.currentUser._id
    };
    
    taskModel.getTaskById(params,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

// GET SUBTASK
router.get('/getAllSubTask', function(req,res){
    req.checkQuery('taskId','Invalid taskId').isUuid();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var params = {
        taskId : req.param('taskId'),
        ownerId : req.currentUser._id
    };
    
    taskModel.getAllSubTask(params,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

// UPDATE TASK
router.post('/updateTask', function(req,res){
    req.checkBody('taskId','Invalid taskId').isUuid();
    req.checkBody('title', 'title field is mandatory').optional().isNotEmpty();
    req.checkBody('description', 'description field is mandatory').optional().isNotEmpty();
    req.checkBody('estimationDate','Invalid estimationDate').optional().isDate();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var params = {
        taskId : req.param('taskId'),
        title : req.param('title'),
        description : req.param('description'),
        ownerId : req.currentUser._id,
        estimationDate : req.param('estimationDate')
    };
    
    taskModel.updateTask(params,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});


// ASSIGN TASK
router.post('/assignTask',function(req,res){
    req.checkBody('taskId','Invalid taskId').isUuid();
    req.checkBody('targetId','Invalid targetId').isUuid();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var params = {
        ownerId : req.currentUser._id,
        taskId : req.param('taskId'),
        targetId : req.param('targetId')
    };
    taskModel.assignTask(params,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

// UPDATE TASK STAGE
router.post('/updateTaskStage', function(req,res){
    req.checkBody('taskId','Invalid taskId').isUuid();
    req.checkBody('stage','Invalid stage').isValidStage();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var params = {
        ownerId : req.currentUser._id,
        taskId : req.param('taskId'),
        stage : req.param('stage')
    };
    
    taskModel.changeTaskStatus(params,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

// VIEW ALL TASK FOR USER
router.get('/viewAllTask', function(req,res){
    var params = {
        targetId : req.currentUser._id,
    };
    
    taskModel.viewAllTask(params,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

// VIEW TASK BY ID FOR USER
router.get('/viewMyTaskById', function(req,res){
    req.checkQuery('taskId','Invalid taskId').isUuid();
    var errors = req.validationErrors();
    if (errors) {
        return errorHandler.sendFormattedError(res,errors);
    }
    var params = {
        taskId : req.param('taskId'),
        targetId : req.currentUser._id
    };
    
    taskModel.viewMyTaskById(params,function(error,result){
        if (error) {
            return errorHandler.sendFormattedError(res,error);
        }
        return successHandler.sendFormattedSuccess(res,result);
    });
});

module.exports = router;