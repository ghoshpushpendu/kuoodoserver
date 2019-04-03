const express = require('express');
const router = express.Router();
const payout = require('../models/payouts');

router.post('/request', (request, response) => {
    console.log(request.body);


    let userId = request.body.userId;
    let bankId = request.body.bankId;
    let amount = request.body.amount;

    let data = {
        userId: userId,
        bankId: bankId,
        amount: amount,
    };

    let data = new payout(data);

    let documentResponse = {};

    user.findOne({
        _id: userId
    }, function (error, result) {
        if (error || result === null) {
            documentResponse.error = true;
            documentResponse.message = `Error :` + error.message;
            response.status(200).json(documentResponse);
        } else {
            if (result) {
                let totalEarning = result.totalEarning;
                let totalPayout = result.totalPayout;
                let balance = parseFloat(totalEarning) - parseFloat(totalPayout);
                if (balance - parseFloat(amount) < 0) {
                    documentResponse.error = true;
                    documentResponse.message = `You don't have enough balance to payout.`;
                    response.status(200).json(documentResponse);
                } else {
                    // call payout pai here - bank api
                    data.save((error, result) => {
                        if (error) {
                            documentResponse.error = true;
                            documentResponse.message = "Can not link the card";
                            response.status(500).json(documentResponse);
                        } else {
                            documentResponse.error = false;
                            documentResponse.message = "This card has been linked successfully";
                            response.status(200).json(documentResponse);
                        }
                    });
                }
            }

        }

    });

    // user.findOneAndUpdate({
    //     _id: userId
    // }, {
    //     $set: data
    // }, {
    //     new: true
    // }, function (error, result) {
    //     if (error || result === null) {
    //         documentResponse.error = true;
    //         documentResponse.message = `Error :` + error.message;
    //         response.status(500).json(documentResponse);
    //     } else {
    //         documentResponse.error = false;
    //         documentResponse.docDetails = result;
    //         documentResponse.message = `Driver Document updated successfully.`;
    //         response.status(200).json(documentResponse);
    //     }

    // });
});

module.exports = router;