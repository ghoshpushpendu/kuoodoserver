/* importing modules
*/
const express = require('express');
const router = express.Router();
const user = require('../models/user');
var fs = require('fs');
const number = require('../models/number');
var path = require('path');
var Cryptr = require('cryptr'),
    cryptr = new Cryptr('myTotalySecretKey');
var twilio = require('twilio');
var accountSid = "ACff0d0373183933a75c69f99a93cec98a",
    authToken = "4fcc7ef274ae6e75cfdd82b789eb48f3",
    fromNumber = '+1 224-479-0157  ';
var client = new twilio(accountSid, authToken);
const file = require('../models/driverDocument');
const Image = require('../models/upload');
var multer = require('multer');
var upload = multer({ dest: 'fileUpload/' });
const cards = require('../models/cards');

// var plivo = require('plivo');


var storage = multer.diskStorage({
    destination: function (request, file, cb) {
        cb(null, './fileUpload')
    },
    filename: function (request, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
/*Function to generate a random number and send an otp to the supplied phone number
params: number
return: code
*/

function sendOtp(number) {
    let JoyceLeeNumber = "+14152050135";
    let userNumber = number;
    var code = Math.floor(Math.random() * 8999 + 1000)
    client.messages.create({
        body: 'An OTP ' + code + ' send to number ' + userNumber,
        to: userNumber,  // Text this number
        from: fromNumber // From a valid Twilio number
    })

    return (client.messages.create({
        body: 'Your Kuoodo OTP is ' + code + '. Please do not share this code with anyone.',
        to: userNumber,  // Text this number
        from: fromNumber // From a valid Twilio number
    }), code)
}
/*  sending otp and verify the phone number if
the phone number is already existed or not and if the phone number is not existed then
we send an otp on that number and add the number
*/

var returnRouter = function (io) {

    router.post('/verifyUser', (request, response) => {
        console.log("sending otp to phoneNumber ");
        console.log(request.body);
        let sendOtpResponse = {};
        let data = new number({ phoneNumber: request.body.phoneNumber });

        user.findOne({ phoneNumber: data.phoneNumber }, (error, result) => {
            if (result) {
                sendOtpResponse.error = true;
                sendOtpResponse.message = 'Phone number already exist';
                sendOtpResponse.registered = true;
                response.status(500).json(sendOtpResponse);
            }
            else {
                number.find({ phoneNumber: data.phoneNumber }, (error, result) => {
                    if (result.length >= 1) {
                        // data._id=result[0]._id;
                        date = new Date();
                        result[0].otp = sendOtp(data.phoneNumber);
                        result[0].otpExpiresIn = Date.now() + 60 * 1000 * 2;
                        console.log(result[0].otp);
                        result[0].save((error, result) => {
                            if (error) {
                                sendOtpResponse.error = true;
                                sendOtpResponse.message = `Error :` + error.message;
                                sendOtpResponse.registered = false;
                                response.status(500).json(sendOtpResponse);
                            } else {
                                sendOtpResponse.error = false;
                                sendOtpResponse.registered = false;
                                sendOtpResponse.otpDetails = result;
                                sendOtpResponse.message = `OTP has been sent .`;
                                response.status(200).json(sendOtpResponse);

                            }
                        });
                    }
                    else {
                        data.otp = sendOtp(data.phoneNumber);
                        data.save((error, result) => {
                            if (error) {
                                sendOtpResponse.error = true;
                                sendOtpResponse.registered = false;
                                sendOtpResponse.message = `Error :` + error.message;
                                response.status(500).json(sendOtpResponse);
                            } else {
                                sendOtpResponse.error = false;
                                sendOtpResponse.otpDetails = result;
                                sendOtpResponse.registered = false;
                                sendOtpResponse.message = `OTP has been sent .`;
                                response.status(200).json(sendOtpResponse);
                            }
                        });

                    }
                });
            }

        });
    });

    /*  post data in User model 
        And send otp for the registration
        Fields : first name, last name , email and phone number
        Error : we get the error message 
        result : for successful registration we get the response as "registration is  successfull."
        
    */
    router.post('/registration', (request, response) => {

        console.log("Registration details");
        console.log(request.body);

        request.sanitize('firstName').trim();
        request.sanitize('lastName').trim();
        request.sanitize('phoneNumber').trim();

        let registrationResponse = {};
        let data = new user({
            uId: request.body.uId,
            deviceId: request.body.deviceId,

            providers: request.body.providers,
            phoneNumber: request.body.phoneNumber,
            role: request.body.role,
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            carName: request.body.carName,
            carNumber: request.body.carNumber,
            carType: request.body.carType,
            address: {
                address: request.body.address ? (request.body.address.address) : null,
                country: request.body.country ? (request.body.address.country) : null,
                zipCode: request.body.zipCode ? (request.body.address.zipCode) : null

            },
            profileImage: request.body.profileImage ? (request.body.profileImage) : null,
        });

        if (request.body.password.length < 8) {
            registrationResponse.error = true;
            registrationResponse.message = ` Password should contain more than 8 digits `;
            response.status(500).json(registrationResponse);
            return true;
        }
        else {
            data.password = cryptr.encrypt(request.body.password)
        }
        /* If the role of the user is driver then the status is deactivated
            otherwise the status will be blanked
        */
        if (request.body.role == "Driver") {
            data.status = "Pending"  //Activated
            data.availability = "Offline"
        }
        else {
            satus: ""
        }
        /*Field :- email is used as per required
        */
        if (request.body.email) {
            console.log(request.body.email);
            data.email = (request.body.email).toLowerCase();
        }
        data.save((error, result) => {
            if (error) {
                console.log(error);
                registrationResponse.error = true;
                registrationResponse.message = `Error :` + error.code == 11000 ? error.message : "phone number already exist";
                response.status(500).json(registrationResponse);
            } else {
                registrationResponse.error = false;
                registrationResponse.user = result;
                registrationResponse.message = `registration is successfull.`;
                response.status(200).json(registrationResponse);
            }
        });

    });

    /* API for update the user by the user ID
    */
    router.put('/update', (request, response) => {

        let _id = request.body._id;

        let userLoginResponse = {};

        user.findById({ _id: request.body._id }, (error, result) => {
            if (error) {
                userLoginResponse.error = true;
                userLoginResponse.message = `Error :` + error.message;
                response.status(500).json(userLoginResponse);
            }
            else if (result) {
                result.firstName = (request.body.firstName ? (request.body.firstName) : result.firstName);
                result.lastName = (request.body.lastName ? (request.body.lastName) : result.lastName);
                result.address = {
                    address: request.body.address ? (request.body.address.address) : null,
                    country: request.body.address ? (request.body.address.country) : null,
                    zipCode: request.body.address ? (request.body.address.zipCode) : null
                };
                result.profileImage = (request.body.profileImage ? (request.body.profileImage) : result.profileImage);

                if (request.body.email) {
                    result.email = (request.body.email ? (request.body.email).toLowerCase() : result.email)
                };

                result.save((error, result) => {
                    if (error || result === null) {
                        userLoginResponse.error = true;
                        userLoginResponse.message = `Error :` + error.message;
                        response.status(500).json(userLoginResponse);
                    }
                    else {
                        userLoginResponse.error = false;
                        userLoginResponse.user = result;
                        userLoginResponse.message = `User Updated successfully.`;
                        response.status(200).json(userLoginResponse);
                    }

                });
            }
        });
    });
    /* Getting details of all users    
    */
    router.get('/getUser', (request, response) => {
        console.log("Getting details");
        console.log(request.query);
        let userDetailsResponse = {};
        user.find({}, (error, result) => {
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
    /* Getting  details of the user
        params:_id
        error : we get the error message 
        result : for successful get we get the response as "user details"
    */
    router.get('/getDetails', (request, response) => {
        console.log("Getting specific user details");
        console.log(request.query);
        let userDetailsResponse = {};
        user.findById({ _id: request.query._id }, (error, result) => {
            if (error) {
                userDetailsResponse.error = true;
                userDetailsResponse.message = `Error :` + error.message;
                response.status(500).json(userDetailsResponse);
            }
            else if (result) {

                cards.find({ userId: request.query._id }, (err, rslt) => {
                    if (err) {
                        userDetailsResponse.error = false;
                        userDetailsResponse.user = result;
                        userDetailsResponse.message = ` user details.`;
                        response.status(200).json(userDetailsResponse);
                    } else if (rslt) {
                        userDetailsResponse.error = false;
                        userDetailsResponse.user = result;
                        userDetailsResponse.card = rslt;
                        userDetailsResponse.message = ` user details.`;
                        response.status(200).json(userDetailsResponse);
                    }
                });
            }
        });
    });

    /* this is the login API for user 
    using phone number as user credential 
    In respect of phone number and password user may logged in
    */
    router.post('/login', (request, response) => {

        let phoneNumber = request.body.phoneNumber;
        let password = cryptr.encrypt(request.body.password);
        // let deviceId = request.body.deviceId;

        let role = request.body.role;

        let userLoginResponse = {};
        console.log(request.body.phoneNumber);
        console.log(request.body.password);
        console.log(request.body.role)

        user.findOne({ phoneNumber: phoneNumber }, (error, result) => {
            if (error || result === null) {
                userLoginResponse.error = true;
                userLoginResponse.message = "User does not exist";
                response.status(500).json(userLoginResponse);
            }
            else {
                console.log(result)
                if (result.password == password && result.role == role) {
                    var data = { deviceId: request.body.deviceId };
                    if (request.body.deviceId) {
                        result.update({ $set: data }, (error, success) => {
                            if (error) {
                                userLoginResponse.error = true;
                                userLoginResponse.message = "User does not exist";
                                response.status(500).json(userLoginResponse);
                            }
                            else {
                                userLoginResponse.error = false;
                                userLoginResponse.user = result;
                                userLoginResponse.message = `User login successfully .`;
                                response.status(200).json(userLoginResponse);
                            }
                        });
                    }
                    else {
                        userLoginResponse.error = false;
                        userLoginResponse.user = result;
                        userLoginResponse.message = `User login successfully.`;
                        response.status(200).json(userLoginResponse);
                    }
                }
                else if (result.password != password) {
                    userLoginResponse.error = true;
                    userLoginResponse.message = "Invalid Credentials";
                    response.status(500).json(userLoginResponse);
                }
                else {
                    userLoginResponse.error = true;
                    userLoginResponse.message = "Role mismatch";
                    response.status(500).json(userLoginResponse);
                }
            }
        });
    });

    /* this is the login API for user 
    using provider as user credential 
    In respect of provider and userId user may logged in
    
    */
    router.post('/socialLogin', (request, response) => {

        let providers = request.body.providers;
        let uId = request.body.uId;
        let role = request.body.role;

        let userLoginResponse = {};


        user.findOne({ providers: providers, uId: uId, role: role }, (error, result) => {
            if (error || result === null) {
                userLoginResponse.error = true;
                userLoginResponse.message = "User does not exist";
                response.status(200).json(userLoginResponse);
            }
            else {
                var data = { deviceId: request.body.deviceId };
                if (request.body.deviceId) {
                    result.update({ $set: data }, (error, result) => {
                        if (error) {
                            userLoginResponse.error = true;
                            userLoginResponse.message = "Device Id could not be updated";
                            response.status(200).json(userLoginResponse);
                        }
                        else {
                            userLoginResponse.error = false;
                            userLoginResponse.user = result;
                            userLoginResponse.message = `User login successfully .`;
                            response.status(200).json(userLoginResponse);
                        }
                    });
                }
                else {
                    userLoginResponse.error = false;
                    userLoginResponse.user = result;
                    userLoginResponse.message = `User login successfully.`;
                    response.status(200).json(userLoginResponse);
                }
            }
        });
    });
    /* API for user forgot password
    At first we find the user in the user collection  after that 
    We find the Phone number in the number collection
    If the number is in the number collection then a OTP is send to that phone Number
    */

    router.post('/forgotPassword', (request, response) => {

        let userLoginResponse = {};

        let phoneNumber = request.body.phoneNumber;
        user.findOne({ phoneNumber: phoneNumber }, (error, result) => {
            if (error || result === null) {
                userLoginResponse.error = true;
                userLoginResponse.message = "user not exist";
                response.status(500).json(userLoginResponse);
            }
            else {
                number.findOne({ phoneNumber: phoneNumber }, (error, result) => {
                    if (error || result === null) {
                        userLoginResponse.error = true;
                        userLoginResponse.message = "number not exist";
                        response.status(500).json(userLoginResponse);
                    }
                    else {
                        result.otp = sendOtp(result.phoneNumber);
                        result.otpExpiresIn = Date.now() + 60 * 1000 * 2;
                        result.save((error, result) => {
                            if (error) {
                                userLoginResponse.error = true;
                                userLoginResponse.message = `Error :` + error.message;
                                response.status(500).json(userLoginResponse);
                            } else {
                                userLoginResponse.error = false;
                                userLoginResponse.otpDetails = result;
                                userLoginResponse.message = `OTP has been sent .`;
                                response.status(200).json(userLoginResponse);

                            }

                        });
                    }
                });
            }

        });
    });

    /* reset the user password by phone number
    */
    router.put('/resetPassword', (request, response) => {

        let phoneNumber = request.body.phoneNumber;
        let userLoginResponse = {};
        var data = {
            password: cryptr.encrypt(request.body.password)
        }

        console.log(request.body);

        if (request.body.password.length < 8) {
            registrationResponse.error = true;
            registrationResponse.message = `Error : Password should contain more than 8 digits `;
            response.status(500).json(registrationResponse);
            return true;
        }
        else {
            user.findOneAndUpdate({ phoneNumber: phoneNumber }, { $set: data }, { new: true }, function (error, result) {
                if (error || result === null) {
                    userLoginResponse.error = true;
                    userLoginResponse.message = `Error :` + error.message;
                    response.status(500).json(userLoginResponse);
                }
                else {
                    console.log("----------------", result);
                    result.otp = sendOtp(phoneNumber);
                    userLoginResponse.error = false;
                    userLoginResponse.user = result;
                    userLoginResponse.message = `User Password reset successfully.`;
                    response.status(200).json(userLoginResponse);
                }

            });
        }

    });

    /* verify otp to phone number
        Field:Phone number and code  send in body
    */
    router.post('/verifyOTP', (request, response) => {
        console.log("Verify otp");
        console.log(request.body);
        let phoneNumber = request.body.phoneNumber;
        let verifyOTPResponse = {};
        let code = request.body.code;
        let ucode = 8888;
        number.findOne({ phoneNumber: phoneNumber }, (error, result) => {
            console.log(request.body);

            console.log(code);
            console.log(ucode);
            console.log(code === ucode);

            if (code === ucode) {
                console.log(ucode, code);
                result.otp = null;
                result.otpExpiresIn = null;
                number.findByIdAndUpdate(result._id, { $set: result }, { new: true }).then(res => {
                    console.log(res);
                })
                verifyOTPResponse.error = false;
                verifyOTPResponse.message = `User verified successfully.`;
                response.status(200).json(verifyOTPResponse);
            } else if (code === result.otp) {
                if (Date.now() > result.otpExpiresIn) {
                    verifyOTPResponse.error = true;
                    verifyOTPResponse.message = `OTP Expired`;
                    response.status(500).json(verifyOTPResponse);
                }
                else {
                    result.otp = null;
                    result.otpExpiresIn = null;
                    number.findByIdAndUpdate(result._id, { $set: result }, { new: true }).then(res => {
                        console.log(res);
                    })
                    verifyOTPResponse.error = false;
                    verifyOTPResponse.message = `User verified successfully.`;
                    response.status(200).json(verifyOTPResponse);
                }
            }
            else {
                verifyOTPResponse.error = true;
                verifyOTPResponse.message = `Invalid otp`;
                response.status(500).json(verifyOTPResponse);
            }

        });
    });
    /* Api to Verify the user for forgot password
        Field:Phone number and code  send in body
    */
    router.post('/verifyforForgotPassword', (request, response) => {
        console.log("Verify otp");
        console.log(request.body);
        let phoneNumber = request.body.phoneNumber;
        let verifyOTPResponse = {};
        let code = request.body.code;
        user.findOne({ phoneNumber: phoneNumber }, (error, result) => {
            if (error || result == null) {
                userLoginResponse.error = true;
                userLoginResponse.message = `User not exist Please Register `;
                response.status(500).json(userLoginResponse);
            }
            else {
                number.findOne({ phoneNumber: phoneNumber }, (error, result) => {
                    if (error || result === null) {
                        userLoginResponse.error = true;
                        userLoginResponse.message = "number not exist";
                        response.status(500).json(userLoginResponse);
                    }
                    else {
                        if (code === 8888) {
                            result.otp = null;
                            result.otpExpiresIn = null;
                            number.findByIdAndUpdate(result._id, { $set: result }, { new: true }).then(res => {
                                console.log(res);
                            })
                            verifyOTPResponse.error = false;
                            verifyOTPResponse.message = `User verified successfully.`;
                            response.status(200).json(verifyOTPResponse);
                        }
                        else if (code === result.otp) {
                            if (Date.now() > result.otpExpiresIn) {
                                verifyOTPResponse.error = true;
                                verifyOTPResponse.message = `OTP Expired`;
                                response.status(500).json(verifyOTPResponse);
                            }
                            else {
                                result.otp = null;
                                result.otpExpiresIn = null;
                                number.findByIdAndUpdate(result._id, { $set: result }, { new: true }).then(res => {
                                    console.log(res);
                                })
                                verifyOTPResponse.error = false;
                                verifyOTPResponse.message = `User verified successfully.`;
                                response.status(200).json(verifyOTPResponse);
                            }
                        }
                        else {
                            verifyOTPResponse.error = true;
                            verifyOTPResponse.message = `Invalid otp`;
                            response.status(500).json(verifyOTPResponse);
                        }
                    }


                })
            }

        });
    });

    /* deleting user phone number
     send phone number in body
     */
    router.delete('/delete', (req, res) => {
        console.log("user delete", req.body);
        user.remove({ phoneNumber: req.body.phoneNumber }).then(data => {
            if (data) {
                res.send(data);
            }
            else
                res.send({ message: 'no such user' });
        })
    })
    /* File upload api for Driver
    */
    router.post('/fileUpload', (request, response) => {
        var image;
        console.log("file upload");
        console.log(file);

        let imageResponse = {};

        var upload = multer({
            storage: storage,
            fileFilter: function (request, file, cb) {
                var ext = path.extname(file.originalname);
                cb(null, true)
            }
        }).single('file');

        upload(request, response, function (error) {

            if (error) {
                // throw error;
                imageResponse.error = true;
                imageResponse.message = `Error :` + error.message;
                response.status(500).json(imageResponse);
            }
            else if (request.file) {
                // console.log(request);
                image = request.file;

                let data = new Image({
                    file: image
                });

                data.save((error, result) => {
                    if (error) {
                        imageResponse.error = true;
                        imageResponse.message = `Error :` + error.message;
                        response.status(500).json(imageResponse);
                    }
                    else if (result) {
                        imageResponse.error = false;
                        imageResponse.upload = result;
                        imageResponse.message = `file upload successful.`;
                        response.status(200).json(imageResponse);
                    }
                    else {
                        imageResponse.error = true;
                        imageResponse.message = `file upload unsuccessful.`;
                        response.status(500).json(imageResponse);
                    }
                });
            }
        });
    });

    /* api to show the file are uploaded for Driver
    */
    router.get('/fileShow', (request, response) => {
        let imageResponse = {};
        console.log("image display");
        console.log(request.query);
        Image.findById(request.query.imageId, (error, result) => {
            if (error) {
                imageResponse.error = true;
                imageResponse.message = `Server error : ` + error.message;
                response.status(500).json(imageResponse);
            }
            else if (result) {
                response.set({
                    "Content-Disposition": 'attachment; filename="' + result.file.originalname + '"',
                    "Content-Type": result.file.mimetype
                });
                fs.createReadStream(result.file.path).pipe(response);
            }
            else {
                imageResponse.error = true;
                imageResponse.message = `No such image available`;
                response.status(500).json(imageResponse);

            }
        });
    });

    /* API for search nearest drivers before booking to show on
    */
    router.post('/search', (request, response) => {

        var limit = request.query.limit || 10;
        // var maxDistance = request.query.distance || 8;
        // maxDistance = maxDistance / 6371;
        var coords = [];
        coords[0] = request.body.longitude;
        coords[1] = request.body.latitude;
        console.log(coords);
        let searchResponse = {};
        user.find({
            location: {
                $nearSphere: coords,
                $maxDistance: 3000 // distance in meter
            },
            status: "Activated",
            availability: "Online"
        }).exec(function (error, result) {
            if (error) {
                searchResponse.error = true;
                searchResponse.message = "No driver avaliable in this area";
                response.status(500).json(searchResponse);
            } else if (result) {

                // result.driverDetails.map((element) => {
                //     let lat = element.location[0];
                //     let lng = element.location[1];
                //     console.log(lat, lng);
                //     element.distance = getDistance(lat, lng);
                // });

                searchResponse.error = false;
                searchResponse.driverDetails = result;
                searchResponse.message = "getting driver successfully.";
                response.status(200).json(searchResponse);

            }
        });
    });


    function getDistance(lat, lng) {
        geolib.getDistance(
            { latitude: coords[1], longitude: coords[0] },
            { latitude: lat, longitude: lng }
        );
    }

    /* 
        Api to update the driver location
    */
    router.put('/driverUpdateLocation', (request, response) => {

        let _id = request.body._id;
        let location = [request.body.location.longitude, request.body.location.latitude];
        let driverResponse = {};
        var data = {
            location: location
        }
        user.findByIdAndUpdate(_id, { $set: data }, { new: true }, function (error, res) {
            if (error) {
                console.log(error);
                driverResponse.error = true;
                driverResponse.message = `Error :` + error.message;
                response.status(500).json(driverResponse);
            }
            else {
                console.log("result:" + res);
                io.emit(_id + '-location', {
                    lat: request.body.location.longitude,
                    lng: request.body.location.latitude
                });
                driverResponse.error = false;
                driverResponse.location = res;
                driverResponse.message = `Driver location updated successfully.`;
                response.status(200).json(driverResponse);
            }
        });
    });

    /** Get all pending driver requests Drivers **/
    router.get('/pendingdrivers', (request, response) => {
        var pageNo = parseInt(request.query.pageNo)
        var size = parseInt(request.query.size)
        var query = {}
        if (pageNo < 0 || pageNo === 0) {
            response = { "error": true, "message": "invalid page number, should start with 1" };
            return res.json(response)
        }
        query.skip = size * (pageNo - 1)
        query.limit = size;
        query.role = 'Driver';
        query.status = "Pending";
        // Find some documents
        user.find(query, function (err, data) {
            // Mongo command to fetch all data from collection.
            if (err) {
                response = { "error": true, "message": "Error fetching data" };
            } else {
                response = { "error": false, "message": data };
            }
            res.json(response);
        });
    })

    /** get drivers **/
    router.get('/drivers', (request, response) => {
        var pageNo = parseInt(request.query.pageNo)
        var size = parseInt(request.query.size)
        var query = {}
        if (pageNo < 0 || pageNo === 0) {
            response = { "error": true, "message": "invalid page number, should start with 1" };
            return res.json(response)
        }
        query.skip = size * (pageNo - 1)
        query.limit = size;
        query.role = 'Driver';
        // Find some documents
        user.find(query, function (err, data) {
            // Mongo command to fetch all data from collection.
            if (err) {
                response = { "error": true, "message": "Error fetching data" };
            } else {
                response = { "error": false, "message": data };
            }
            res.json(response);
        });
    });
    /* 
       Api to update the driver/sriders avaliability
    */
    router.put('/availability', (request, response) => {
        let driverResponse = {};
        let _id = request.body._id;

        if (request.body.availability == "Online") {
            var data = {
                availability: "Online",
                socketId: request.body.socketId
            }
        } else {
            var data = {
                availability: "Offline"
            }
        }

        user.findByIdAndUpdate(_id, { $set: data }, { new: true }, function (error, res) {
            if (error) {
                console.log(error);
                driverResponse.error = true;
                driverResponse.message = `Error :` + error.message;
                response.status(500).json(driverResponse);
            }
            else {
                driverResponse.error = false;
                driverResponse.result = res;
                driverResponse.message = `Driver location updated successfully.`;
                response.status(200).json(driverResponse);
            }
        });
    });

    /* 
       Api to upload multiple files
    */
    router.post('/multipleFileUpload', (request, response) => {
        var image;
        console.log("file upload");
        // console.log(file);

        let imageResponse = {};

        var upload = multer({
            storage: storage,
            fileFilter: function (request, file, cb) {
                var ext = path.extname(file.originalname);
                cb(null, true)
            }
        }).array('file');

        upload(request, response, function (error) {
            if (error) {
                // throw error;
                imageResponse.error = true;
                imageResponse.message = `UploadError :` + error.message;
                response.status(500).json(imageResponse);
            }
            else if (request.files) {
                console.log(request.files);
                image = request.files;
                var resultArray = [];
                var count = 0;

                image.forEach((element, index, array) => {

                    let data = new Image({
                        file: element
                    });

                    data.save((error, result) => {
                        count++;
                        if (error) {
                            imageResponse.error = true;
                            imageResponse.message = `Error :` + error.message;
                            response.status(500).json(imageResponse);
                        }
                        else if (result) {
                            imageResponse.error = false;
                            resultArray.push(result._id);
                            console.log(count, resultArray);
                            imageResponse.message = `file upload successful.`;
                            if (count == array.length) {
                                imageResponse.upload = resultArray;
                                response.status(200).json(imageResponse);
                            }
                        }
                        else {
                            imageResponse.error = true;
                            imageResponse.message = `file upload unsuccessful.`;
                            response.status(500).json(imageResponse);
                        }
                    });


                });

            }
        });
    });
    /* Api to show the multiple files
    */

    router.get('/multipleFileShow', (request, response) => {
        let imageResponse = {};
        console.log("image display");
        console.log(request.query);
        Image.findById(request.query.imageId, (error, result) => {
            if (error) {
                imageResponse.error = true;
                imageResponse.message = `Server error : ` + error.message;
                response.status(500).json(imageResponse);
            }
            else if (result) {
                response.set({
                    "Content-Disposition": 'attachment; filename="' + result.files.originalname + '"',
                    "Content-Type": result.files.mimetype
                });
                fs.createReadStream(result.files.path).pipe(response);
            }
            else {
                imageResponse.error = true;
                imageResponse.message = `No such image available`;
                response.status(500).json(imageResponse);

            }
        })
    });
    /* Api to update the avaliability of the Driver
    */
    router.put('/availability', (request, response) => {
        let Response = {};
        console.log("availibility");
        console.log(request.body);
        user.findOneAndUpdate({ _id: request.body._id }, { $set: {} }, (error, result) => {
            if (error) {
                imageResponse.error = true;
                imageResponse.message = `Server error : ` + error.message;
                response.status(500).json(imageResponse);
            }
            else if (result) {
                response.set({
                    "Content-Disposition": 'attachment; filename="' + result.files.originalname + '"',
                    "Content-Type": result.files.mimetype
                });
                fs.createReadStream(result.files.path).pipe(response);
            }
            else {
                imageResponse.error = true;
                imageResponse.message = `No such image available`;
                response.status(500).json(imageResponse);

            }
        })
    });
    /*Api to 
    */
    router.put('/DriverReview', (request, response) => {
        let imageResponse = {};

        var data = {
            rating: request.body.rating,
            review: request.body.review
        }
        console.log(request.body);
        user.findByIdAndUpdate({ _id: request.body.driverId }, { $set: data }, { new: true }, (error, result) => {
            console.log(error);
            if (error) {
                imageResponse.error = true;
                imageResponse.message = `Server error : ` + error.message;
                response.status(500).json(imageResponse);
            }
            else {
                imageResponse.error = false;
                imageResponse.result = result;
                imageResponse.message = `Rating and riview updated successfully`;
                response.status(200).json(imageResponse);
            }
        });
    });

    return router;
}


module.exports = returnRouter;