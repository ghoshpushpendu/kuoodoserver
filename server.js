//importing modules
var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var cors = require('cors');
var http = require('http');
var app = express();
var server = http.createServer(app);



/* Socket is imported in io variable*/
var io = require('socket.io')(server, { origins: '*:*' });


// put const here
const userRoute = require('./routes/userRoute')(io);
const docsRoute = require('./routes/driverDocRoute');
const bookingRoute = require('./routes/bookingRoute')(io);
const cardsRoute = require('./routes/cardsRoute')(io);
const bankRoute = require('./routes/bankRoute');

const helper = require('./routes/helper');
//connect to mongodb
mongoose.connect('mongodb://127.0.0.1:27017/kuoodo');

//on successful connection
mongoose.connection.on('connected', () => {
    console.log('Connected to mongodb!!');
});

//on error
mongoose.connection.on('error', (err) => {
    if (err) {
        console.log('Error in db is :' + err);
    }
});

/* Socket connection */
io.on('connection', function (socket) {
    console.log('user Connected' + socket.id);


    socket.on('userBooking', (data) => {
        console.log('connected');
        helper.userBooking(socket.id);
        io.to(socket.id).emit('connected');
    });

    socket.on('startRide', (data) => {
        console.log('ride started');
        helper.startRide(socket.id);
        io.to(socket.id).emit('connected');
    });

    socket.on('endRide', (data) => {
        console.log('ride ended');
        helper.endRide(socket.id);
        io.to(socket.id).emit('connected');
    });

    socket.on('acceptRide', (data) => {
        console.log('accept ride ');
        helper.acceptRide(socket.id);
        io.to(socket.id).emit('connected');
    });

    socket.on('cancelRide', (data) => {
        console.log('cancel ride ');
        helper.cancelRide(socket.id);
        io.to(socket.id).emit('connected');
    });

    // on socket disconnect
    socket.on('disconnect', function () {
        console.log('Got disconnect!', socket);
        console.log("Disconnected socket ID is ", socket.id);
        helper.offlineUser(socket.id);
    });

});


//port no
const port = 5040;

//middleware
app.use(cors());
app.use(expressValidator());
// app.use (multer());
//body-parser
app.use(bodyParser.json());

//routes
app.use('/user', userRoute);
app.use('/driver', docsRoute);
app.use('/booking', bookingRoute);
app.use('/cards', cardsRoute);
app.user('/bank', bankRoute);  // adding bank route to the app

// port listen at
server.listen(port, () => {
    console.log('server started at port number :' + port);
});