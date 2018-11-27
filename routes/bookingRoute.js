const express = require('express');
const router = express.Router();
const booking = require('../models/booking');
const user = require('../models/user');
const docs = require('../models/driverDocument');
var OneSignal = require('onesignal-node');
var helper = require('./helper');

var myClient = new OneSignal.Client({
    userAuthKey: 'MjEwYWUzMjItOTc4NS00YjZjLThhOTktMGFlOGQ3ZjU0MmQy',
    app: { appAuthKey: 'ZWNkNjI2YjktMTZkZi00YmJmLWExMDctMjA1ZGE5NjQxY2M1', appId: '9a76c3d4-db28-4b1a-b887-aea2f292bfa2' }
});
// var FCM = require('fcm-push');
// var serverKey = 'AAAAIgIu9uQ:APA91bGGoDMLmQtp9_AOCB9f400FL-RN6WT6sjToU0Mi8oJ9Ld5UPh_MjtCSKzveSn3vt27ZuhMg_1kWCaL-Mz8BxUapM5KgfHqov8trdSpkFxUdoiV7NnQkNxrUq5nbUPhdNWvLzlfm';
// var senderId = '146065520356';
// var fcm = new FCM(serverKey);


var returnRouter = function (io) {


    /* 
       API to save the Booking  details of the User
    */
    router.post('/create', (request, response) => {
        console.log(request.body);

        let data = new booking({
            userId: request.body.userId,
            pickUpLocation: {
                longitude: request.body.pickUpLocation.longitude,
                latitude: request.body.pickUpLocation.latitude
            },
            destination: {
                longitude: request.body.destination.longitude,
                latitude: request.body.destination.latitude
            },
            startLocation: request.body.startLocation,
            endLocation: request.body.startLocation,
            distance: request.body.distance,
            code: parseInt(Math.random() * 100000),
            status: "request",
        });

        var maxDistance = request.query.distance || 8;
        maxDistance = maxDistance / 6371;
        var coords = [];
        coords[0] = request.body.pickUpLocation.longitude;
        coords[1] = request.body.pickUpLocation.latitude;
        console.log(coords);
        let searchResponse = {};
        user.find(
            {
                location: {
                    $nearSphere: coords,
                    $maxDistance: 3000
                },
                status: "Activated",
                availability: "Online"
            }
        ).limit(1).exec(function (error, driver) {
            if (error) {
                searchResponse.error = true;
                searchResponse.message = `Error :` + error.message;
                response.status(500).json(searchResponse);
            } else if (driver) {
                if (driver.length < 1) {
                    searchResponse.error = true;
                    searchResponse.message = `No driver in your area`
                    response.status(200).json(searchResponse);
                    return;
                }
                console.log(driver[0]);

                data.driverId = driver[0]._id
                let socketID = driver[0].socketId;
                docs.findOne({ userId: driver[0]._id }, (error, result) => {
                    if (error) {
                        console.log(error);
                        searchResponse.error = true;
                        searchResponse.message = `Error :` + error.message;
                        response.status(500).json(searchResponse);
                    } else if (result || result == null) {
                        data.driverDetails = result ? result._id : result;
                        data.save((error, result) => {
                            if (error) {
                                console.log(error);
                                searchResponse.error = true;
                                searchResponse.message = `Error :` + error.message;
                                response.status(500).json(searchResponse);
                            }
                            else {
                                console.log(result);
                                booking.findOne({ _id: result._id }, function (err, booking) {
                                    if (err) {
                                        console.log(err);
                                        searchResponse.error = true;
                                        searchResponse.message = `Error :` + err.message;
                                        response.status(500).json(searchResponse);
                                    }
                                    else {
                                        if (booking) {
                                            console.log("booking create socket message");
                                            io.emit('booking', booking);
                                        }
                                        searchResponse.error = false;
                                        searchResponse.result = booking;
                                        searchResponse.message = `Book successfully.`;
                                        response.status(200).json(searchResponse);
                                    }
                                })
                            }
                        });
                    }

                });
            }
        });
    });


    /* 
       Api to Accept the ride by Driver by booking id
    */
    router.put('/accept', (request, response) => {
        let _id = request.body.bookingId;
        let userDetailsResponse = {};

        booking.findOne({ _id: _id }, (error, result) => {
            console.log(error);
            console.log(result);
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else {
                console.log(result.userId);
                let userID = result.userId._id;
                let driverID = result.driverId._id;

                result.status = "booked";
                result.userId.availability = "Busy";
                result.driverId.availability = "Busy";

                let socketID = result.userId.socketId;

                result.save((error, result) => {
                    console.log(error);
                    console.log(result);
                    if (error) {
                        userDetailsResponse.error = false;
                        userDetailsResponse.message = `Error:` + error.messsage;
                        response.status(400).json(userDetailsResponse);
                    }
                    else {
                        console.log("result", result)
                        if (result) {

                            console.log("bookingStatus socket message");
                            io.emit('accepted', result);

                        }
                        userDetailsResponse.error = false;
                        userDetailsResponse.result = result;
                        userDetailsResponse.message = `Accept booking .`;
                        response.status(200).json(userDetailsResponse);
                    }
                });
            }

        });
    });


    /*
       Api to Cancel the booking request
    */
    router.put('/cancel', (request, response) => {
        let _id = request.body.bookingId;
        let userDetailsResponse = {};

        booking.findOne({ _id: _id }, (error, result) => {
            console.log(error);
            console.log(result);
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else {

                console.log(result.userId);
                result.status = "cancelled";
                result.driverId.availability = "Online";
                let socketID = result.userId.socketId;

                result.save((error, result) => {
                    console.log(error);
                    console.log(result);
                    if (error) {

                        userDetailsResponse.error = false;
                        userDetailsResponse.message = `Error:` + error.messsage;
                        response.status(400).json(userDetailsResponse);
                    }
                    else {
                        if (result) {
                            console.log("Ride cancelled socket message")
                            io.to(socketID).emit('rejected', result);
                        }
                        userDetailsResponse.error = false;
                        userDetailsResponse.result = result;
                        userDetailsResponse.message = `Cancel booking .`;
                        response.status(200).json(userDetailsResponse);
                    }
                });
            }

        });
    });


    /*
   Api to Cancel the booking request
*/
    router.put('/arrive', (request, response) => {
        let _id = request.body.bookingId;
        let userDetailsResponse = {};

        booking.findOne({ _id: _id }, (error, result) => {
            console.log(error);
            console.log(result);
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else {

                let socketID = result.userId.socketId;

                console.log("Ride cancelled socket message")
                io.to(socketID).emit('arrived', result);

                userDetailsResponse.error = false;
                userDetailsResponse.user = result;
                userDetailsResponse.message = `Users details.`;
                response.status(200).json(userDetailsResponse);

            }

        });
    });


    /* 
       API to get all the booking details
    */
    router.get('/details', (request, response) => {
        console.log("Getting details");
        console.log(request.query);
        let _id = request.query._id;
        let userDetailsResponse = {};
        booking.find({ _id: _id }, (error, result) => {
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else if (result) {
                userDetailsResponse.error = false;
                userDetailsResponse.user = result;
                userDetailsResponse.message = `Users details.`;
                response.status(200).json(userDetailsResponse);
            }
        });
    });

    /*
       Api to update the booking status (start ride)
     */
    router.put('/startRide', (request, response) => {
        let _id = request.body.bookingId;
        let code = request.body.code;
        let userDetailsResponse = {};

        booking.findOne({ _id: _id }, (error, result) => {
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else {
                console.log(result.userId);
                let socketID = result.userId.socketId;
                if (result.code == code) {
                    // code matches    
                    result.status = "commute";
                    result.startTime = new Date();
                    result.save((error, result) => {
                        console.log(error);
                        console.log(result);
                        if (error) {
                            userDetailsResponse.error = false;
                            userDetailsResponse.message = `Error:` + error.messsage;
                            response.status(400).json(userDetailsResponse);
                        }
                        else {
                            if (result) {
                                console.log("Ride started socket message");
                                io.to(socketID).emit('start', result);
                            }
                            userDetailsResponse.error = false;
                            userDetailsResponse.result = result;
                            userDetailsResponse.message = `booking details.`;
                            response.status(200).json(userDetailsResponse);
                        }
                    });
                } else {
                    // code not matches
                    userDetailsResponse.error = true;
                    userDetailsResponse.message = `Incorrect Code`;
                    response.status(200).json(userDetailsResponse);
                }
            }
        });
    });

    /*
       Api to update the booking status(end ride)
     */
    router.put('/endRide', (request, response) => {
        let _id = request.body.bookingId;

        let userDetailsResponse = {};

        booking.findOne({ _id: _id }, (error, result) => {
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else {
                console.log(result.userId);
                let socketID = result.userId.socketId;
                result.status = "complete";
                result.payment = "pending";
                result.driverId.availability = "Online";
                result.userId.availability = "Online";
                result.endTime = new Date();

                if (request.body.amount) {
                    result.amount = request.body.amount
                }
                result.save((error, result) => {
                    console.log(error);
                    console.log(result);
                    if (error) {
                        userDetailsResponse.error = false;
                        userDetailsResponse.message = `Error:` + error.messsage;
                        response.status(400).json(userDetailsResponse);
                    }
                    else {
                        if (result) {
                            console.log("End ride socket message");
                            io.emit('end', result);

                        }
                        userDetailsResponse.error = false;
                        userDetailsResponse.result = result;
                        userDetailsResponse.message = `booking details.`;
                        response.status(200).json(userDetailsResponse);
                    }
                });
            }

        });
    });

    /* Api to get the booking list of user
    */
    router.get('/userHistory', (request, response) => {

        let userId = request.query.userId;
        let userDetailsResponse = {};
        booking.find({ userId: userId }, (error, result) => {
            console.log(error);
            console.log(result);
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else if (result) {
                userDetailsResponse.error = false;
                userDetailsResponse.result = result;
                userDetailsResponse.message = `User booking list.`;
                response.status(200).json(userDetailsResponse);
            }
        });
    });
    /* Api to get the booking list of Driver 
    */
    router.get('/driverHistory', (request, response) => {
        let driverId = request.query.driverId;
        let userDetailsResponse = {};
        booking.find({ driverId: driverId }, (error, result) => {
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else if (result) {
                userDetailsResponse.error = false;
                userDetailsResponse.result = result;
                userDetailsResponse.message = `Driver booking list.`;
                response.status(200).json(userDetailsResponse);
            }
        });

    });

    router.get('/getpending', (request, response) => {
        let userID = request.query.userId;
        let userDetailsResponse = {};
        booking.find({ userId: userID, payment: 'pending' }, (error, result) => {
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else if (result) {
                userDetailsResponse.error = false;
                userDetailsResponse.result = result;
                userDetailsResponse.message = `Pending payments `;
                response.status(200).json(userDetailsResponse);
            }
        });

    });


    // returns all cab types
    router.get('/getcabtypes', (request, response) => {

        let cabTypes = {
            message: "All available cab types",
            error: false,
            results: [
                {
                    "name": "Economy",
                    "initialCost": "2.2",
                    "serviceFee": "2.2",
                    "perMinutes": "0.24",
                    "perMile": "1.33",
                    "minimum": "5",
                    "maximum": "400",
                    "cancellation": "5"
                },
                {
                    "name": "Xtra",
                    "initialCost": "2.45",
                    "serviceFee": "2.45",
                    "perMinutes": "0.3",
                    "perMile": "2.06",
                    "minimum": "7",
                    "maximum": "400",
                    "cancellation": "5"
                },
                {
                    "name": "Luxury",
                    "initialCost": "8",
                    "serviceFee": "1.75",
                    "perMinutes": "0.65",
                    "perMile": "3.81",
                    "minimum": "15",
                    "maximum": "400",
                    "cancellation": "5"
                },
                {
                    "name": "SUV Luxury",
                    "initialCost": "15",
                    "serviceFee": "1.75",
                    "perMinutes": "0.9",
                    "perMile": "3.81",
                    "minimum": "25",
                    "maximum": "400",
                    "cancellation": "5"
                },
                {
                    "name": "Supreme",
                    "initialCost": "5",
                    "serviceFee": "2.45",
                    "perMinutes": "0.5",
                    "perMile": "2.81",
                    "minimum": "9",
                    "maximum": "400",
                    "cancellation": "5"
                }
            ]
        }

        response.status(200).json(cabTypes);
    });



    return router;
}

module.exports = returnRouter;