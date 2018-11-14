'use strict';

const user = require('../models/user');
const booking = require('../models/booking');
var ObjectId = require('mongodb').ObjectID;

class Helper {

    /* Function for user booking*/

    userBooking(data, callback) {
        console.log(data);
        user.findOne({ _id: data._id }, (err, result) => {
            callback(err, result);
        });
    }

    /* Function for Start ride*/

    startRide(id, callback) {
        user.findOne({ _id: id }, (err, result) => {
            // callback(err, result);
        });
    }

    /* Function for end ride*/

    endRide(id, callback) {
        user.findOne({ _id: id }, (err, result) => {
            // callback(err, result);
        });
    }

    getUserInfo(id, callback) {
        user.findOne({ _id: id }, (err, result) => {
            callback(err, result);
        })
    }
    /* Function for accept ride*/
    acceptRide(id, callback) {
        booking.findOne({ _id: id }, (err, result) => {
            callback(err, result);
        });
    }
    /* Function for cancel ride*/

    cancelRide(id, status, callback) {
        booking.findOne({ _id: id }, (err, result) => {
            callback(err, result);
        });
    }

    offlineUser(socketId, callbacl) {
        let data = {
            socketId: "",
            availability: "Offline"
        }

        user.findOneAndUpdate

        user.findOneAndUpdate({ socketId: socketId }, { $set: data }, { new: true }, function (error, res) {

            if (error) {
                console.log(error);
            }
            else {
                console.log("User updated");
            }

        });
    }

}
module.exports = new Helper();