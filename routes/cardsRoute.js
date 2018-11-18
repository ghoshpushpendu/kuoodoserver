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
        if (error || result === null) {

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
            cards.remove({ userId: request.body.userId }).then(function (err, obj) {
                if (err) {
                    userLoginResponse.error = true;
                    userLoginResponse.message = "Can not delete the old card";
                    response.status(200).json(userLoginResponse);
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

    // let cardNumber = request.body.number;
    // let expDate = request.body.expDate.replace("/", "");
    // let cvv = request.body.cvv;
    // let amount = request.body.amount;
    // let bookingID = request.body.bookingID;

    let userID = request.body.userId;

    booking.findOne({ userId: userID, payment: 'pending' }, (error, result) => {
        console.log(error);
        console.log(result);
        if (error || result === null) {
            chargeResponse.error = true;
            chargeResponse.message = "no-pending";
            response.status(200).json(chargeResponse);
        }
        else {

            let amount = result.amount;
            let bookingID = result._id;

            cards.findOne({ userId: userID }, (error, result) => {
                if (error || result === null) {
                    chargeResponse.error = true;
                    chargeResponse.message = "no-card";
                    response.status(200).json(chargeResponse);
                }
                else {
                    let cardNumber = result.number;
                    let expDate = result.expmonth + result.expyear;
                    let cvv = result.cvv;

                    //charge the user

                    let apiLoginKey = "4bzR6TPQ4QFk";
                    let transactionKey = "2Z5f52Hph4fS9qUQ";


                    // authrize.net setup
                    var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
                    merchantAuthenticationType.setName(apiLoginKey);
                    merchantAuthenticationType.setTransactionKey(transactionKey);

                    //credit card setup
                    var creditCard = new ApiContracts.CreditCardType();
                    creditCard.setCardNumber(cardNumber);
                    creditCard.setExpirationDate(expDate);
                    creditCard.setCardCode(cvv);

                    //initialize payment
                    var paymentType = new ApiContracts.PaymentType();
                    paymentType.setCreditCard(creditCard);

                    var orderDetails = new ApiContracts.OrderType();
                    orderDetails.setInvoiceNumber(new Date());
                    orderDetails.setDescription('Cab ride with Kuoodo');

                    // var duty = new ApiContracts.ExtendedAmountType();
                    // duty.setAmount(amount);
                    // duty.setName('Cab ride');
                    // duty.setDescription('ride on kuoodo cab');

                    var transactionSetting = new ApiContracts.SettingType();
                    transactionSetting.setSettingName('recurringBilling');
                    transactionSetting.setSettingValue('false');

                    var transactionSettingList = [];
                    transactionSettingList.push(transactionSetting);

                    var transactionSettings = new ApiContracts.ArrayOfSetting();
                    transactionSettings.setSetting(transactionSettingList);

                    var transactionRequestType = new ApiContracts.TransactionRequestType();
                    transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
                    transactionRequestType.setPayment(paymentType);
                    transactionRequestType.setAmount(amount);
                    transactionRequestType.setOrder(orderDetails);
                    transactionRequestType.setTransactionSettings(transactionSettings);

                    var createRequest = new ApiContracts.CreateTransactionRequest();
                    createRequest.setMerchantAuthentication(merchantAuthenticationType);
                    createRequest.setTransactionRequest(transactionRequestType);

                    //pretty print request
                    console.log(JSON.stringify(createRequest.getJSON(), null, 2));

                    var ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());

                    ctrl.execute(function () {

                        var apiResponse = ctrl.getResponse();

                        var presponse = new ApiContracts.CreateTransactionResponse(apiResponse);

                        //pretty print response
                        console.log(JSON.stringify(response, null, 2));

                        if (presponse != null) {
                            if (presponse.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
                                if (presponse.getTransactionResponse().getMessages() != null) {
                                    console.log('Successfully created transaction with Transaction ID: ' + presponse.getTransactionResponse().getTransId());
                                    console.log('Response Code: ' + presponse.getTransactionResponse().getResponseCode());
                                    console.log('Message Code: ' + presponse.getTransactionResponse().getMessages().getMessage()[0].getCode());
                                    console.log('Description: ' + presponse.getTransactionResponse().getMessages().getMessage()[0].getDescription());

                                    //update payment in booking details

                                    let data = ({
                                        payment: 'paid',
                                    });

                                    booking.findOneAndUpdate({ _id: bookingID }, { $set: data }, { new: true }, function (error, result) {
                                        if (error || result === null) {
                                            chargeResponse.error = true;
                                            chargeResponse.message = `Error :` + error.message;
                                            response.status(500).json(chargeResponse);
                                        }
                                        else {
                                            chargeResponse.error = false;
                                            chargeResponse.transaction = {
                                                ID: presponse.getTransactionResponse().getTransId(),
                                                resCode: presponse.getTransactionResponse().getResponseCode(),
                                                msgCode: presponse.getTransactionResponse().getMessages().getMessage()[0].getCode(),
                                                description: presponse.getTransactionResponse().getMessages().getMessage()[0].getDescription()
                                            };
                                            chargeResponse.message = "Card has been charged successfully";
                                            response.status(200).json(chargeResponse);
                                        }
                                    });
                                }
                                else {
                                    console.log('Failed Transaction.');
                                    if (presponse.getTransactionResponse().getErrors() != null) {
                                        console.log('Error Code: ' + presponse.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                                        console.log('Error message: ' + presponse.getTransactionResponse().getErrors().getError()[0].getErrorText());

                                        chargeResponse.error = true;
                                        chargeResponse.transaction = {
                                            errCode: presponse.getTransactionResponse().getErrors().getError()[0].getErrorCode(),
                                            msg: presponse.getTransactionResponse().getErrors().getError()[0].getErrorText()
                                        };
                                        chargeResponse.message = "Card has not been charged successfully";
                                        response.status(200).json(chargeResponse);
                                    }
                                }
                            }
                            else {
                                console.log('Failed Transaction. ');
                                if (presponse.getTransactionResponse() != null && presponse.getTransactionResponse().getErrors() != null) {

                                    console.log('Error Code: ' + presponse.getTransactionResponse().getErrors().getError()[0].getErrorCode());
                                    console.log('Error message: ' + presponse.getTransactionResponse().getErrors().getError()[0].getErrorText());

                                    chargeResponse.error = true;
                                    chargeResponse.transaction = {
                                        errCode: presponse.getTransactionResponse().getErrors().getError()[0].getErrorCode(),
                                        msg: presponse.getTransactionResponse().getErrors().getError()[0].getErrorText()
                                    };
                                    chargeResponse.message = "Card has not been charged successfully";
                                    response.status(200).json(chargeResponse);
                                }
                                else {
                                    console.log('Error Code: ' + presponse.getMessages().getMessage()[0].getCode());
                                    console.log('Error message: ' + presponse.getMessages().getMessage()[0].getText());
                                    chargeResponse.error = true;
                                    chargeResponse.transaction = {
                                        errCode: presponse.getTransactionResponse().getErrors().getError()[0].getErrorCode(),
                                        msg: presponse.getTransactionResponse().getErrors().getError()[0].getErrorText()
                                    };
                                    chargeResponse.message = "Card has not been charged successfully";
                                    response.status(200).json(chargeResponse);
                                }
                            }
                        }
                        else {
                            console.log('Null Response.');
                            chargeResponse.error = true;
                            chargeResponse.transaction = {
                                errCode: 'null',
                                msg: 'No response from payment gateway'
                            };
                            chargeResponse.message = "Card has not been charged successfully";
                            response.status(200).json(chargeResponse);
                        }

                    });

                }
            });
        }

    });

})


module.exports = router;