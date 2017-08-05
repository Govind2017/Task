var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema;

var TaskSchema = new Schema({
    "_id": String,
    "title": { type: String, required: true },
    "description": { type: String, required:false},
    "stage": { type: String, required:false},
    "ownerId": { type: String,ref: 'users', required: true },
    "targetId" : { type: String,ref: 'users', required: false },
    "subTask" : { type:Schema.Types.Mixed, ref: 'tasks', required:false},
    "parentId" :  { type: String,ref: 'tasks', required: false },
    "treelevel" : { type: Number, required:false},
    "estimationDate" : { type: Date, required: false},
    "createdTs": { type: Date, required: false, "default": Date.now },
    "modifiedTs": { type: Date, required: false, "default": Date.now }
});

TaskSchema.pre('save', function(next) {
    this.modifiedTs = new Date();
    next();
});

module.exports = TaskSchema;