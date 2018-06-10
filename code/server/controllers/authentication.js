const jwt = require('jwt-simple');
const config = require('../config');
const User = require('../models/user');

function tokenForUser(user){
    const timestamp = new Date().getTime();
    // sub(ject): who is this token about
    // iat: issued at time
    // sub + iat: payload to encode
    return jwt.encode({ sub: user.id, iat: timestamp }, config.secret);
}

exports.signin = function(req, res, next){
    // User has already had their email and password auth'd
    // We just need to give them a token for future requests
    res.send({ token: tokenForUser(req.user) });
};

exports.signup = function(req, res, next){

    console.log(req.body);
    // { email: 'hello@hello.com', password: '123' }
    const email = req.body.email;
    const password = req.body.password;

    if(!email || !password){
        return res.status(422).send({ error: 'You must provide email and password'});
    }

    // See if the user with a given email exists
    User.findOne({ email: email }, function(err, existingUser){

        // General error
        if(err){ return next(err); }

        // If a user does exist, return an error
        if(existingUser){
            return res.status(422).send({ error: 'Email is in use'});
        }
        /*
         {
         "error": "Email is in use"
         }
         */

        // If a user does NOT exist, create and save user record
        // Creating the user
        const user = new User({
            email: email,
            password: password
        });

        // Saving the user
        user.save(function(err){

            // General error
            if(err){ return next(err); }

            // Now respond with jwt
            // token for user: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1YWFmYjQ1ZTk0ZWVkMzA3MzYxMzQwY2UiLCJpYXQiOjE1MjE0NjQ0MTQ4MDh9.fGzY-jLaOQB5HA-QPopWz6nhYkei2AQbY3Y2JC_qWCo
            res.json({ token: tokenForUser(user) });

            // Respond to request that user was created
            // res.json({ success: 'true' });

            // res.json(user);
            /*
             {
             "_id": "5aaeb13ac48e4b02bb7f97e7",
             "email": "hello@hello.com",
             "password": "123",
             "__v": 0
             }
             */
            // Or:
            // res.send({ success: 'true' });
        });
    });
};