const Authentication = require('./controllers/authentication');
require('./services/passport');
const passport = require('passport');

// jwt strategy middleware requireAuth between incoming request and route handler
// don't give user a session with a cookie, so set true to false
const requireAuth = passport.authenticate('jwt', { session: false });

// local strategy signin middleware requireSignin between incoming request and route handler
// don't give user a session with a cookie, so set true to false
const requireSignin = passport.authenticate('local', { session: false });

module.exports = function(app){
    // req is the incoming http req object
    // res is the response to send back
    // next is for error handling
    // test route
    // app.get('/', function(req, res, next){
    //     res.send(['waterbottle', 'phone', 'paper'])
    // });
    // every get request to the root route must pass the requireAuth handler,
    // and only then we go on to the request handler
    app.get('/', requireAuth, function(req, res){
        // test without auth:
        // app.get('/', function(req, res){
        //  res.send({ message: 'The super secret code is 432423254'
        // });
        res.send({ message: 'https://www.youtube.com/watch?v=jQONlTY81-g' });
    });
    app.post('/signin', requireSignin, Authentication.signin);
    app.post('/signup', Authentication.signup);
};