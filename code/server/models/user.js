const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

// Define our model
const userSchema = new Schema({
    email: { type: String, unique: true, lowercase: true }, // lowercase: true; otherwise A@EMAIL.COM is different from a@email.com
    password: String
});

// On Save Hook, encrypt password
// Before/pre-saving a model, run this function
userSchema.pre('save', function(next){
    // get access to the user model
    const user = this;

    // generate a salt, then run callback with the salt
    bcrypt.genSalt(10, function(err, salt){
        if(err) { return next(err); }

        // hash/encrypt the password using the salt
        bcrypt.hash(user.password, salt, null, function(err, hash){
            if(err) { return next(err); }

            // overwrite plain text password with encrypted (hashed) password + salt
            user.password = hash;

            // save the model
            next();
        });
    })
});

// add instance method comparePasswords to methods placeholder
userSchema.methods.comparePassword = function(candidatePassword, callback){
    // this.password is salted hashed password
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch){

        if(err) { return callback(err); }

        callback(null, isMatch)
    });
};

// Create the model class, which represents all users
// userSchema corresponds to a collection called 'user
const ModelClass = mongoose.model('user', userSchema);

// Export the model
module.exports = ModelClass;