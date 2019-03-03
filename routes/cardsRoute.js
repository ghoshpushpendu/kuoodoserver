/* importing modules
*/
const express = require('express');
const router = express.Router();
const user = require('../models/user');
const booking = require('../models/booking');
var fs = require('fs');
const number = require('../models/number');
const cards = require('../models/cards');
var stripe = require('stripe')('sk_live_UA142Rbn7hi3tItP8zW41ZfO');
var ApiContracts = require('authorizenet').APIContracts;
var ApiControllers = require('authorizenet').APIControllers;
var SDKConstants = require('authorizenet').Constants;


// create card

var returnRouter = function (io) {

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


    /** charge using stripe **/
    // router.post('/charge', (request, response) => {

    //     let chargeResponse = {};

    //     let userID = request.body.userId;

    //     booking.findOne({ userId: userID, payment: 'Pending' }, (error, result) => {
    //         console.log(error);
    //         console.log(result);
    //         if (error || result === null) {
    //             chargeResponse.error = true;
    //             chargeResponse.message = "You dont have outstanding payment";
    //             response.status(200).json(chargeResponse);
    //         }
    //         else {

    //             let amount = result.amount;
    //             let bookingID = result._id;

    //             console.log("Taka", amount);
    //             console.log("Gota taka", parseInt(amount));

    //             var stripetoken = request.body.token;
    //             var charge = stripe.charges.create({
    //                 amount: parseInt(amount) * 100,
    //                 currency: 'usd',
    //                 description: 'Sample transaction',
    //                 source: stripetoken
    //             }, function (err, charge) {
    //                 if (err) {
    //                     console.log(err);
    //                     chargeResponse.error = true;
    //                     chargeResponse.message = `Error in payment`;
    //                     response.status(500).json(chargeResponse);
    //                 }
    //                 else {
    //                     booking.findOneAndUpdate({ _id: bookingID }, {
    //                         $set: {
    //                             payment: "Paid"
    //                         }
    //                     }, { new: true }, function (error, result) {
    //                         if (error || result === null) {
    //                             chargeResponse.error = true;
    //                             chargeResponse.message = `Error :` + error.message;
    //                             response.status(500).json(chargeResponse);
    //                         }
    //                         else {
    //                             chargeResponse.error = false;
    //                             chargeResponse.booking = result;
    //                             chargeResponse.message = `Payment success`;
    //                             response.status(200).json(chargeResponse);
    //                         }

    //                     });
    //                 }

    //             })

    //         }

    //     });

    // })


    /** charge using authorize.net **/
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
                let socketID = result.driverId.socketId;

                console.log("Taka", amount);
                console.log("Gota taka", parseInt(amount));


                cards.findOne({ userId: userID }, (error, result) => {
                    if (result) {
                        chargeResponse.error = true;
                        chargeResponse.message = 'Phone number already exist';
                        response.status(500).json(chargeResponse);

                        let card = {
                            number: result.number,
                            exp: result.expmonth + result.expyear,
                            code: result.cvv
                        };

                        chargeCreditCard(card, bookingID, amount)
                            .then(function (success) {

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

                                        io.to(socketID).emit('paid', result);

                                        chargeResponse.error = false;
                                        chargeResponse.booking = result;
                                        chargeResponse.message = `Payment success`;
                                        response.status(200).json(chargeResponse);
                                    }

                                });

                            }, function (error) {
                                chargeResponse.error = true;
                                chargeResponse.message = 'Transaction not successful';
                                chargeResponse.result = error;
                                response.status(500).json(chargeResponse);
                            });

                    }
                    else {
                        chargeResponse.error = true;
                        chargeResponse.message = 'no such user exists';
                        response.status(500).json(chargeResponse);
                    }

                });


            }

        });

    })

    return router;

}

module.exports = returnRouter;

function chargeCreditCard(card, bookingID, amount) {

    let cardNumber = card.number;
    let cardExpDate = card.exp;
    let cardCode = card.code;

    return new Promise(function (resolve, reject) {
        var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
        merchantAuthenticationType.setName(constants.apiLoginKey);
        merchantAuthenticationType.setTransactionKey(constants.transactionKey);

        var creditCard = new ApiContracts.CreditCardType();
        creditCard.setCardNumber(cardNumber);
        creditCard.setExpirationDate(cardExpDate);
        creditCard.setCardCode(cardCode);

        var paymentType = new ApiContracts.PaymentType();
        paymentType.setCreditCard(creditCard);

        var orderDetails = new ApiContracts.OrderType();
        orderDetails.setInvoiceNumber(bookingID);
        orderDetails.setDescription('Cab booking on Kuoodo app');


        var transactionRequestType = new ApiContracts.TransactionRequestType();
        transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
        transactionRequestType.setPayment(paymentType);
        transactionRequestType.setAmount(amount);
        transactionRequestType.setOrder(orderDetails);

        var createRequest = new ApiContracts.CreateTransactionRequest();
        createRequest.setMerchantAuthentication(merchantAuthenticationType);
        createRequest.setTransactionRequest(transactionRequestType);

        //pretty print request
        console.log(JSON.stringify(createRequest.getJSON(), null, 2));

        var ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
        //Defaults to sandbox
        ctrl.setEnvironment(SDKConstants.endpoint.production);

        ctrl.execute(function () {

            var apiResponse = ctrl.getResponse();

            var response = new ApiContracts.CreateTransactionResponse(apiResponse);

            //pretty print response
            console.log(JSON.stringify(response, null, 2));

            if (response != null) {
                if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
                    if (response.getTransactionResponse().getMessages() != null) {
                        console.log('Successfully created transaction with Transaction ID: ' + response.getTransactionResponse().getTransId());
                        console.log('Response Code: ' + response.getTransactionResponse().getResponseCode());
                        console.log('Message Code: ' + response.getTransactionResponse().getMessages().getMessage()[0].getCode());
                        console.log('Description: ' + response.getTransactionResponse().getMessages().getMessage()[0].getDescription());
                        resolve({
                            error: false,
                            transactionId: response.getTransactionResponse().getTransId(),
                            responseCode: response.getTransactionResponse().getResponseCode(),
                            messageCode: response.getTransactionResponse().getMessages().getMessage()[0].getCode(),
                            message: response.getTransactionResponse().getMessages().getMessage()[0].getDescription()
                        });
                    }
                    else {
                        console.log('Failed Transaction.');
                        if (response.getTransactionResponse().getErrors() != null) {
                            console.log('Error Code: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                            console.log('Error message: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorText());
                            reject({
                                error: true,
                                code: response.getTransactionResponse().getErrors().getError()[0].getErrorCode(),
                                message: response.getTransactionResponse().getErrors().getError()[0].getErrorText()
                            });
                        }
                    }
                }
                else {
                    console.log('Failed Transaction. ');
                    if (response.getTransactionResponse() != null && response.getTransactionResponse().getErrors() != null) {

                        console.log('Error Code: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                        console.log('Error message: ' + response.getTransactionResponse().getErrors().getError()[0].getErrorText());
                        reject({
                            error: true,
                            code: response.getTransactionResponse().getErrors().getError()[0].getErrorCode(),
                            message: response.getTransactionResponse().getErrors().getError()[0].getErrorText()
                        });
                    }
                    else {
                        console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                        console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                        reject({
                            error: true,
                            code: response.getTransactionResponse().getErrors().getError()[0].getErrorCode(),
                            message: response.getTransactionResponse().getErrors().getError()[0].getErrorText()
                        });
                    }
                }
            }
            else {
                console.log('Null Response.');
                reject({
                    error: true,
                    code: 100,
                    message: 'Null response'
                });
            }

        });
    });
}

