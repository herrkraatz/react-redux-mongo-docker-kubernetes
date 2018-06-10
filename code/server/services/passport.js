// Is our user logged in with a jwt or email/password ?

const passport = require('passport');
const User = require('../models/user');
const config = require('../config');
// passport is not only a library, but also an eco-system (e.g. also facebook, etc)
// strategy needed to either verify user with jwt verified by secret (user request that needs authorization) ...
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
// or with username/password verified by database (signin)
const LocalStrategy = require('passport-local');


// Setup options for local strategy
// LocalStrategy usually takes username and password, not email and password, so we have to set usernameField: email
const localOptions = { usernameField: 'email' };

// Create local strategy: Pulls out email + password from post-body
const localLogin = new LocalStrategy(localOptions, function(email, password, done){
    // Verify this email and password, call 'done' with the user object if it is the right email and password,
    // otherwise call 'done' with false
    User.findOne({ email: email }, function(err, user){
        if(err) { return done(err); }

        if(!user) { return done(null, false); }

        // compare passwords: is plain text password equal to encrypted password in database?
        // we encrypt the plain text password (again) and compare to the saved encrypted password in database
        // so we NEVER decrypt our saved encrypted password
        user.comparePassword(password, function(err, isMatch){
            if(err) { done(err); }

            // password does NOT match, same callback as above when user was not found in database
            if(!isMatch){ return done(null, false); }

            // passport's 'done' callback adds the user to the http req object so we can later grab it:
            // req.user = user
            return done(null, user);
        })

    });
});

// Setup options for JWT Strategy
// token can sit on the header, the body, the url
// here we take it from the header
// in Postman, select Get Request and add token to Header:
// authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1YWFmYjQ1ZTk0ZWVkMzA3MzYxMzQwY2UiLCJpYXQiOjE1MjE0NjQ0MTQ4MDh9.fGzY-jLaOQB5HA-QPopWz6nhYkei2AQbY3Y2JC_qWCo
// we also need to tell it the secret
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: config.secret

};

// Create JWT Strategy: Pulls out payload from post-body
// payload: decoded jwt token
const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done){
    // See if the user ID in the payload exists in our database
    // If yes, call 'done' with that user
    // If not, call 'done' without user object
    User.findById(payload.sub, function(err, user){

        // General Error
        // second object (false here) would be the user object if we found one
        if(err) { return done(err, false); }

        // user found
        if(user) {
            done(null, user);
        }
        // user not found
        else{
            done(null, false);
        }
    });
});

// Tell passport to use Strategies
passport.use(jwtLogin);
passport.use(localLogin);