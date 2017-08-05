var mongoose = require('mongoose');
var UsersSchema = require('../schemas/user.schema.js');
var User = mongoose.model('users', UsersSchema);
var validator = require('../helpers/validators');
var errorCodes = require('../helpers/app.constants').errorCodes;
var uuid = require('node-uuid');

/*
UPDATE USER PROFILE
*/
var updateUserProfile = function(params,callback){

    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }

    if (typeof callback != "function") {
        throw new TypeError({message: "updateUserProfile > callback must be a function"});
    }

    if (!validator.isUuid(params.userId)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid user id",
            param : "userId"
        });
    }

    details = {};
    if(params.firstName && params.firstName!=""){
        details.firstName = params.firstName;
    }
    if(params.lastName && params.lastName!=""){
        details.lastName = params.lastName;
    }
    if(params.firstName && params.lastName){
        details.fullName = params.firstName+params.lastName;
    }
    

    User.findOneAndUpdate({_id:params.userId},{$set:details},{new:true}).exec(function(error,updatedResult){
        if(error){
            return callback(error);
        }else if(updatedResult){
            return callback(error,updatedResult);
        }else{
            return callback({
                error : errorCodes.DB_UPDATE_FAIL,
                message : "User does not exists.",
                param : "userId"
            });
        }
    });
}

/*
GET USER DETAILS BY ID
*/

var getUserById = function(params,callback){

    if (typeof callback != "function") {
        throw new TypeError({message: "getUserById > callback must be a function"});
    }

    if (!validator.isUuid(params.userId)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid user id",
            param : "userId"
        });
    }
    var query = {
        _id : params.userId
    }
    var exclude = '-password -__v';
    User.findOne(query,exclude).exec(function(error,userResult){
        if(error){
            return callback(error);
        }
       return callback(error,userResult);
    });

};

module.exports = {
    updateUserProfile : updateUserProfile,
    getUserById : getUserById
};