const express = require('express');
const router = express.Router();
const bank = require('../models/bank');

router.post('/addAccount', (request, response) => {
    console.log(request.body);


    let userId = request.body.userId;

    let bankData = {
        bankName: request.body.bankName,
        accountNumber: request.body.accountNumber,
        ifscCode: request.body.ifscCode,
        branch: request.body.branch,
        accountHolder: request.body.accountHolder,
        status: "Active"
    }

    let bankResponse = {};

    //check if user already has bank details

    bank.find({ userId: userId }, function (error, success) {
        if (error) {
            // create bank data
            bankData.userId = userId;
            let tbank = new bank(bankData);
            tbank.save((error, result) => {
                if (error) {
                    bankResponse.error = true;
                    bankResponse.message = `Error :` + error.message;
                    response.status(500).json(bankResponse);
                } else {
                    bankResponse.error = false;
                    bankResponse.bank = result;
                    bankResponse.message = `Banking details created successfully.`;
                    response.status(200).json(bankResponse);
                }
            });
        } else {
            // update bank data
            bank.findOneAndUpdate({ userId: userId }, { $set: bankData }, { new: true }, function (error, result) {
                if (error || result === null) {
                    bankResponse.error = true;
                    bankResponse.message = `Error :` + error.message;
                    response.status(500).json(bankResponse);
                }
                else {
                    bankResponse.error = false;
                    bankResponse.bank = result;
                    bankResponse.message = `Banking details updated successfully.`;
                    response.status(200).json(bankResponse);
                }
            });
        }
    })

});

module.exports = router;

