var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema;

var transactionSchema = new Schema({
    "_id": String,
    "taskId": {type: String, required: false},
    "ownerId": { type: String,ref: 'users', required: true },
    "targetId" : { type: String,ref: 'users', required: false },
    "actionType": {type: String, required:false},
    "lastStatus": {type: String, required:false},
    "updateStatus": {type: String, required:false},
    "createdTs": { type: Date, required: false, "default": Date.now },
    "modifiedTs": { type: Date, required: false, "default": Date.now }
});

transactionSchema.pre('save', function(next) {
    this.modifiedTs = new Date();
    next();
});

module.exports = transactionSchema;