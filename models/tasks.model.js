var mongoose = require('mongoose');
var userModel = require('../models/users.model');
var UsersSchema = require('../schemas/user.schema.js');
var User = mongoose.model('users', UsersSchema);
var activityModel = require('../models/transaction.model');
var TaskSchema = require('../schemas/task.schema.js');
var Task = mongoose.model('tasks', TaskSchema);
var validator = require('../helpers/validators');
var errorCodes = require('../helpers/app.constants').errorCodes;
var uuid = require('node-uuid');
var Q = require('q');

var  createTask = function(params,callback){
    
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }

    if (typeof callback != "function") {
        throw new TypeError({message: "createTask > callback must be a function"});
    }
    var data = new Task({
        _id : uuid.v1(),
        title : params.title,
        description : params.description,
        stage : 'IDEATION',
    });

    if(params.estimationDate){
        if(new Date(params.estimationDate).getTime() > new Date().getTime()){
            data.estimationDate = params.estimationDate;
        }else{
            return callback({
                error : errorCodes.DEF_VALIDATION_ERROR,
                message : "estimationDate should be greter then current date",
            });
        }
    }
    
    if(params.parentId){
        data.parentId = params.parentId;
        data.treeLevel = params.treeLevel;
    }
    if (params.role==="admin"){
        if (!validator.isUuid(params.ownerId)) {
            return callback({
                error : errorCodes.DEF_VALIDATION_ERROR,
                message : "Invalid user Id",
            });
        }
        var params = {
            userId : params.ownerId
        }
        userModel.getUserById(params,function(error,userResult){
            if(error){
                return callback(error);
            }else if(userResult){
                data.ownerId = userResult._id;
                if(data.parentId){
                    var query = {
                        taskId : data.parentId,
                        ownerId : data.ownerId
                    }
                    getTaskById(query,function(error,validParent){
                        if(error){
                            return callback(error);
                        }else if(validParent){
                            data.save(function(error,result){
                                if(error){
                                    return callback(error);
                                }else{
                                    var details = result.toObject();
                                    details.actionType = "TASK_CREATED"
                                    activityModel.insertTransaction(details,function(error,transactionUpdate){
                                        if(error){
                                            return callback(error);
                                        }else{
                                            Task.findOneAndUpdate({_id:result.parentId},{$push:{subTask:result._id}}).exec(function(error,resultParents){
                                                if(error){
                                                    return callback(error);
                                                }
                                                return callback(error,resultParents)
                                            });
                                        }
                                        return callback(error,result);
                                    });
                                }
                            });
                        }else{
                            return callback({
                                error : errorCodes.DEF_VALIDATION_ERROR,
                                message : "Invalid parent Id",
                                param : "parentId"
                            }); 
                        }
                    });
                }else{
                    data.save(function(error,result){
                        if(error){
                            return callback(error);
                        }else{
                            var details = result.toObject();
                            details.actionType = "TASK_CREATED"
                            activityModel.insertTransaction(details,function(error,transactionUpdate){
                                if(error){
                                    return callback(error);
                                }
                                return callback(error,result);
                            });
                        }
                    });
                }
            }else{
                return callback({
                    error : errorCodes.DB_NO_MATCHING_DATA,
                    message : "User does not exists.",
                    param : "userId"
                });
            }
        });
    }else{
        return callback({
            error : errorCodes.DEF_UNAUTHORIZED,
            message : "Unauthorized user.",
            param : "userId"
        });
    }
}   

var getTaskById = function(params,callback){
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }

    if (typeof callback != "function") {
        throw new TypeError({message: "getTaskById > callback must be a function"});
    }

    if (!validator.isUuid(params.ownerId)){
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid ownerId",
            param : "ownerId"
        });
    }
    var query = {
       $and:[{_id:params.taskId},{ownerId:params.ownerId},{parentId:{ $exists:false}}]
    }
    var exclude = '-__v'
    Task.findOne(query,exclude)
    .populate('parentId', '-__v')
    .exec(function(error,result){
        if(error){
            return callback(error);
        }
        return callback(error,result);
    });
};
 
var getAllSubTask = function(params,callback){

    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }

    if (typeof callback != "function") {
        throw new TypeError({message: "getAllSubTask > callback must be a function"});
    }

    if (!validator.isUuid(params.ownerId)){
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid ownerId",
            param : "ownerId"
        });
    }
    var query = {
        ownerId : params.ownerId,
        parentId : params.taskId

    }
    var exclude = '-__v'
    Task.find(query,exclude)
    .populate('parentId', '-__v')
    .exec(function(error,result){
        if(error){
            return callback(error);
        }
        return callback(error,result);
    });
}

var  updateTask = function(params,callback){
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }
    if (typeof callback != "function") {
        throw new TypeError({message: "updateTask > callback must be a function"});
    }
    if(!validator.isUuid(params.ownerId)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid user Id",
        });
    }
    var details = {};
    if(params.title){
        details.title = params.title;
    }
    if(params.description){
        details.description = params.description;
    }
    if(params.estimationDate){
        if(new Date(params.estimationDate).getTime() > new Date().getTime()){
            details.estimationDate = params.estimationDate;
        }else{
            return callback({
                error : errorCodes.DEF_VALIDATION_ERROR,
                message : "estimationDate should be greter then current date",
                param : "estimationDate"
            });
        }
    }

    Task.findOneAndUpdate({_id:params.taskId,ownerId:params.ownerId},{$set:details},{new:true})
        .populate('parentId', '-__v')
        .exec(function(error,result){
            if(error){
                return callback(error);
            }else if(result){
                var details = result.toObject();
                details.actionType = "TASK_UPDATED"
                activityModel.insertTransaction(details,function(error,transactionUpdate){
                    if(error){
                        return callback(error);
                    }
                    return callback(error,result);
                });
            }else{
                return callback({
                    error:errorCodes.DB_UPDATE_FAIL,
                    message:"Invalid details",
                    param : "ownerId/taskId"
                })
            }
    });
}

var  assignTask = function(params,callback){
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }
    if (typeof callback != "function") {
        throw new TypeError({message: "assignTask > callback must be a function"});
    }
    if(!validator.isUuid(params.ownerId)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid user Id",
        });
    }
    var query = {
        _id : params.targetId,
        role : "user"
    }
    var exclude = '-__v -password';
    User.findOne(query,exclude).exec(function(error,result){
        if(error){
            return callback(error);
        }else if(result){
            
            Task.findOneAndUpdate({ $and:[{_id:params.taskId},{ownerId:params.ownerId},{subTask:{$exists:false}}]},{$set:{targetId:params.targetId}},{new:true})
                .populate('parentId targetId','-__v -password')
                .exec(function(error,updateResult){
                    if(error){
                        return callback(error);
                    }else if(updateResult){
                        var details = updateResult.toObject();
                        details.actionType = "TASK_ASSIGNED"
                        activityModel.insertTransaction(details,function(error,transactionUpdate){
                            if(error){
                                return callback(error);
                            }
                            return callback(error,updateResult);
                        });
                    }else{
                         return callback({
                            error : errorCodes.DB_UPDATE_FAIL,
                            message : "Invalid Details",
                            param : "taskId/ownerId"
                        });
                    }
                })
        }else{
            return callback({
                error : errorCodes.DB_NO_MATCHING_DATA,
                message : "No User found",
                param : "targetId"
            })
        }
    })
}

var changeTaskStatus = function(params,callback){
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }
    if (typeof callback != "function") {
        throw new TypeError({message: "assignTask > callback must be a function"});
    }
    if(!validator.isUuid(params.ownerId)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid user Id",
        });
    }
    
    if(!validator.isValidStage(params.stage)) {
        return callback( {
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid stage type",
            param : "stage"
        });
    }
    var query = {
       $and:[{_id:params.taskId},{$or:[{ownerId:params.ownerId},{targetId:params.ownerId}]},{subTask:{$exists:false}}]
    }
    var exclude = '-__v';
    Task.findOne(query,exclude).exec(function(error,taskResult){
        if(error){
            return callback(error);
        }else if(taskResult){
            Task.findOneAndUpdate({_id:taskResult._id},{$set:{stage:params.stage}},{new:true}).exec(function(error,result){
                if(error){
                    return callback(error);
                }else if(result){
                    if(result.parentId){
                        _checkParentStatus({parentId:result.parentId}).then(function(updateResult){
                            console.log(result.parentId);
                            Task.findOneAndUpdate({_id:result.parentId},{$set:{stage:updateResult}}).exec(function(error,updateParent){
                                return callback(error,result);
                            })
                        })
                        .fail(function(err){
                            return callback(err);
                        });
                    }else{
                        var details = result.toObject();
                        details.actionType = "TASK_STATUS_UPDATED";
                        activityModel.insertTransaction(details,function(error,transactionUpdate){
                            if(error){
                                return callback(error);
                            }
                            return callback(error,result);
                        });
                    }
                }else{
                    return callback({
                        error : errorCodes.DB_UPDATE_FAIL,
                        message : "Invalid Details",
                    });
                }
            });
        }else{
            return callback({
                error : errorCodes.DB_NO_MATCHING_DATA,
                message : "Invalid details",
                param : "taskId/userId"
            });
        }
    });
}
var _checkParentStatus = function(params){
    var deferred = Q.defer();

    if (!params || typeof params != "object") {
        deferred.reject( new TypeError({message: "params must be a valid object"}));
    }

    var  stageArray = ["IDEATION","REQUIREMENT_GATHERING","IN_PROGRESS","IN_TESTING","COMPLETED"];
    var  relativeArray = [];
    var func1 =  function(){
        var q = Q.defer();
        Task.findOne({_id:params.parentId}).populate('subTask','-__v').exec(function(error,parentData){
            if(error){
                q.reject(error);
            }
            for(var i=0;i<parentData.subTask.length;i++){
                relativeArray.push(parentData.subTask[i].stage);
            }
            q.resolve();    
        });
        return q.promise;
    };

    Q.all([func1()])
    .then(function(result){
        var leastStage = stageArray.filter((el)=>(relativeArray.indexOf(el) > -1));
        deferred.resolve(leastStage[0]);
    })
    .fail(function(err){
        deferred.resolve(err);
    });
    return deferred.promise;
}; 

var viewMyTaskById = function(params,callback){
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }
    if (typeof callback != "function") {
        throw new TypeError({message: "viewMyTaskById > callback must be a function"});
    }
    if(!validator.isUuid(params.targetId)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid user Id",
        });
    }
    console.log(JSON.stringify(params));
    Task.findOne({_id:params.taskId,targetId:params.targetId})
        .populate('ownerId','-__v')
        .exec(function(error,result){
        if(error){
            return callback(error);
        }
        return callback(error,callback);
    });
}

var viewAllTask = function(params,callback){
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }
    if (typeof callback != "function") {
        throw new TypeError({message: "viewAllTask > callback must be a function"});
    }
    if(!validator.isUuid(params.targetId)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid user Id",
        });
    }
    Task.find({targetId:params.targetId})
        .populate('ownerId','-__v')
        .exec(function(error,result){
        if(error){
            return callback(error);
        }
        return callback(error,callback);
    });
}


module.exports = {
    createTask : createTask,
    getTaskById : getTaskById,
    _checkParentStatus : _checkParentStatus,
    getAllSubTask : getAllSubTask,
    updateTask : updateTask,
    assignTask : assignTask,
    changeTaskStatus : changeTaskStatus,
    viewMyTaskById : viewMyTaskById,
    viewAllTask : viewAllTask
};