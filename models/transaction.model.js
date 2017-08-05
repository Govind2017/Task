var mongoose = require('mongoose');
var userModel = require('../models/users.model');
var TransactionSchema = require('../schemas/transaction.schema.js');
var Transaction = mongoose.model('transaction', TransactionSchema);
var validator = require('../helpers/validators');
var errorCodes = require('../helpers/app.constants').errorCodes;
var uuid = require('node-uuid');

var  insertTransaction = function(params,callback){
    console.log(JSON.stringify(params));

    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }

    if (typeof callback != "function") {
        throw new TypeError({message: "inseartTransaction > callback must be a function"});
    }

    var data = new Transaction({
        _id : uuid.v1(),
        taskId : params._id,
        ownerId : params.ownerId,
        actionType : params.actionType
    });

    if(params.targetId){
        data.targetId = params.targetId;
    }

    if(params.lastStatus && params.updatedStatus){
        data.lastStatus = params.lastStatus;
        data.updatedStatus = params.updatedStatus;
    }

    data.save(function(error,result){
        return callback(error,result);
    });
}

module.exports = {
    insertTransaction : insertTransaction
};