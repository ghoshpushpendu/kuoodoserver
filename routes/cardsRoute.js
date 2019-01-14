/* importing modules
*/
const express = require('express');
const router = express.Router();
const user = require('../models/user');
const booking = require('../models/booking');
var fs = require('fs');
const number = require('../models/number');
const cards = require('../models/cards');
const ApiContracts = require('authorizenet').APIContracts;
const ApiControllers = require('authorizenet').APIControllers;
const SDKConstants = require('authorizenet').Constants;
var stripe = require('stripe')('sk_test_PZDfLl1ZQZroNYZUoR2t4NFS');



// create card

router.post('/create', (request, response) => {
    let card = {
        number: request.body.number,
        name: request.body.name,
        cvv: request.body.cvv,
        expmonth: request.body.expmonth,
        expyear: request.body.expyear,
        country: request.body.country,
        userId: request.body.userId,
        verified: "true",
        status: "active"
    }
    let userLoginResponse = {};
    cards.findOne({ userId: request.body.userId }, (error, result) => {

        console.log(error);
        console.log(result);

        if (error || result == null) {

            console.log("Here");

            let data = new cards(card);
            data.save((error, result) => {
                if (error) {
                    userLoginResponse.error = true;
                    userLoginResponse.message = "Can not link the card";
                    response.status(500).json(userLoginResponse);
                } else {
                    userLoginResponse.error = false;
                    userLoginResponse.message = "This card has been linked successfully";
                    response.status(200).json(userLoginResponse);
                }
            });

        }
        else {

            console.log("There");
            cards.remove({ userId: request.body.userId }, true).then(function (err, obj) {
                if (err) {
                    let data = new cards(card);
                    data.save((error, result) => {
                        if (error) {
                            userLoginResponse.error = true;
                            userLoginResponse.message = "Can not link the card";
                            response.status(500).json(userLoginResponse);
                        } else {
                            userLoginResponse.error = false;
                            userLoginResponse.message = "This card has been linked successfully";
                            response.status(200).json(userLoginResponse);
                        }
                    });
                } else {
                    let data = new cards(card);
                    data.save((error, result) => {
                        if (error) {
                            userLoginResponse.error = true;
                            userLoginResponse.message = "Can not link the card";
                            response.status(500).json(userLoginResponse);
                        } else {
                            userLoginResponse.error = false;
                            userLoginResponse.message = "This card has been linked successfully";
                            response.status(200).json(userLoginResponse);
                        }
                    });
                }
            })
        }
    });
});


router.post('/delete', (req, res) => {
    let number = req.body.number;
    let userLoginResponse = {};
    cards.remove({ number: number }).then(function (err, obj) {
        if (err) {
            console.log(err);
            userLoginResponse.error = true;
            userLoginResponse.message = "Can not delete card";
            res.status(200).json(userLoginResponse);
        } else {
            userLoginResponse.error = true;
            userLoginResponse.message = "This card has been deleted";
            res.status(200).json(userLoginResponse);
        }
    })
});

router.post('/list', (request, response) => {

    let userid = request.body.userId;

    let searchResponse = {};
    cards.find({ userId: userid }).exec(function (error, result) {
        if (error) {
            searchResponse.error = true;
            searchResponse.message = "No cards has been linked";
            response.status(500).json(searchResponse);
        } else if (result) {
            searchResponse.error = false;
            searchResponse.cards = result;
            searchResponse.message = "Got linked cards successfully";
            response.status(200).json(searchResponse);
        }
    });
});

router.post('/charge', (request, response) => {

    let chargeResponse = {};

    let userID = request.body.userId;

    booking.findOne({ userId: userID, payment: 'Pending' }, (error, result) => {
        console.log(error);
        console.log(result);
        if (error || result === null) {
            chargeResponse.error = true;
            chargeResponse.message = "You dont have outstanding payment";
            response.status(200).json(chargeResponse);
        }
        else {

            let amount = result.amount;
            let bookingID = result._id;

            console.log("Taka", amount);
            console.log("Gota taka", parseInt(amount));

            var stripetoken = request.body.token;
            var charge = stripe.charges.create({
                amount: parseInt(amount) * 100,
                currency: 'usd',
                description: 'Sample transaction',
                source: stripetoken
            }, function (err, charge) {
                if (err) {
                    console.log(err);
                    chargeResponse.error = true;
                    chargeResponse.message = `Error in payment`;
                    response.status(500).json(chargeResponse);
                }
                else {
                    booking.findOneAndUpdate({ _id: bookingID }, {
                        $set: {
                            payment: "Paid"
                        }
                    }, { new: true }, function (error, result) {
                        if (error || result === null) {
                            chargeResponse.error = true;
                            chargeResponse.message = `Error :` + error.message;
                            response.status(500).json(chargeResponse);
                        }
                        else {
                            chargeResponse.error = false;
                            chargeResponse.booking = result;
                            chargeResponse.message = `Payment success`;
                            response.status(200).json(chargeResponse);
                        }

                    });
                }

            })

        }

    });

})


module.exports = router;