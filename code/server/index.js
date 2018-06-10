// Main starting point of the application
const express = require('express');
const http = require('http'); // native node library
const bodyParser = require('body-parser'); // middleware for express
const morgan = require('morgan'); // middleware for express
const app = express();
const router = require('./router');
const mongoose = require('mongoose');
// to make cross domain calls work
const cors = require('cors');

// DB Setup

// IMPORTANT:
// Comment-in what you need, comment-out what you don't need:
// LOCAL SETUP:
mongoose.connect('mongodb://localhost:27017/auth1');
// DOCKER SETUP:
// mongoose.connect('mongodb://db:27017/auth1');
// KUBERNETES SETUP:
// mongoose.connect('mongodb://auth1_readWrite:12345@mongodb-service:27017/auth1?replicaSet=MainRepSet');

// App Setup
app.use(morgan('combined')); // register logging middleware
// ::1 - - [18/Mar/2018:15:15:31 +0000] "GET / HTTP/1.1" 404 139 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36"
// ::1 - - [18/Mar/2018:15:15:33 +0000] "GET / HTTP/1.1" 404 139 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36"
// ::1 - - [18/Mar/2018:15:15:46 +0000] "GET / HTTP/1.1" 404 139 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36"

// cors: middleware for express
app.use(cors());

app.use(bodyParser.json({ type: '*/*' })); // parse incoming requests as if they were json

router(app);

// Server Setup
const port = process.env.PORT || 3090;

const server = http.createServer(app); // any requests that come, forward them to express
server.listen(port);
console.log('Server listening on port:', port);

