var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema;
var validator = require('../helpers/validators');

var userSchema = new Schema({
    "_id": String,
    "email": {type: String, required: true},
    "firstName": {type: String, required:true},
    "lastName": {type: String, required:true},
    "fullName": {type: String, required:false},
    "role" : {type: String,required:true},
    "lastLogin": { type: Date, required:false},
    "password":{type: String,required:true},
    "createdTs": { type: Date, required: false, "default": Date.now },
    "modifiedTs": { type: Date, required: false, "default": Date.now }
});

userSchema.index({ "fullName":"text"});
userSchema.pre('save', function(next) {
    this.modifiedTs = new Date();
    if(!(validator.isEmpty( this.firstName) && validator.isEmpty( this.lastName))) {
        //full name is for search, so save with lowercase and without space
        this.fullName = this.firstName.toLocaleLowerCase()+this.lastName.toLocaleLowerCase()
    }
    next();
});
module.exports = userSchema;