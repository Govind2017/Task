var mongoose = require('mongoose');
var UsersSchema = require('../schemas/user.schema.js');
var User = mongoose.model('user', UsersSchema);
var errorCodes = require('../helpers/app.constants').errorCodes;
var errorHandler = require('../helpers/error_handler');
var successHandler = require('../helpers/success_handler');
var validator = require('../helpers/validators');
var userModel = require('../models/users.model');
var jwt    = require('jsonwebtoken'); 
var bcrypt = require('bcrypt');
var uuid = require('node-uuid');


/*
USER/ADMIN REGISTRATION
*/
var registerUser = function(params,callback){
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }

    if (typeof callback != "function") {
        throw new TypeError({message: "registerUser > callback must be a function"});
    }
    
    if (!validator.isValidEmail(params.email)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid email Id",
            param : "email"
        });
    }

    var query  = {
        email : params.email
    };
    User.findOne(query,function(error,userResult){
        if(error){
            return callback(error);
        }else if(userResult){
            return callback({
                error : errorCodes.DB_DUPLICATE_RECORD,
                message : "User is already registered.",
                param : "email"
            });
        }else{
            //create new user
            var newUser = new User({
                _id : uuid.v1(),
                email : params.email,
                firstName : params.firstName,
                lastName : params.lastName,
                role : params.role,
                password : bcrypt.hashSync(params.password,10)
            });
            newUser.save(function(error,userData){
                return callback(error,{message:"Registered successfully."});
            });
        }
    });
}

/*
USER VERIFICATION
*/
var verifyUser = function(params,callback){
    if (!params || typeof params != "object") {
        throw new TypeError({message: "params must be a valid object"});
    }

    if (typeof callback != "function") {
        throw new TypeError({message: "verifyUser > callback must be a function"});
    }

    if (!validator.isValidEmail(params.email)) {
        return callback({
            error : errorCodes.DEF_VALIDATION_ERROR,
            message : "Invalid email Id",
            param : "email"
        });
    }

    var query = {
        email : params.email
    }

    User.findOne(query,function(error,userResult){
        if(error){
            return callback(error);
        }else if(userResult){
            if(bcrypt.compareSync(params.password,userResult.password)) {
                var user = userResult.toObject();
                delete user.__v;
                delete user.password;
                var result = {};
                result.user = user;
                result.token = __generateToken(result.user);
                result.isVerified = true;
                return callback(error,result);
            } else {
                return callback({
                    error : errorCodes.DB_NO_MATCHING_DATA,
                    message : "Invalid email/password.",
                    param : "email/password"
                });
            }
        }else{
            return callback({
                error : errorCodes.DB_NO_MATCHING_DATA,
                message : "User is not registered.",
                param : "email"
            });
        }
    });
} 

/*
GENERATING USER TOKEN
*/
function __generateToken (user){
    token = jwt.sign(user, process.env.SECRET_KEY, {
        expiresIn: 60480000 // expires in 700 days
    });
    return token;
};

module.exports = {
    registerUser : registerUser,
    verifyUser : verifyUser

};