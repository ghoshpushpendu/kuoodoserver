const express = require('express');
const router = express.Router();
const bank = require('../models/bank');

router.post('/addaccount', (request, response) => {
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

    bank.find({
        userId: userId
    }, function (error, success) {
        console.log(error, success);
        if (success && success === null) {
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
            bank.findOneAndUpdate({
                userId: userId
            }, {
                    $set: bankData
                }, {
                    new: true
                }, function (error, result) {
                    console.log(error, result);
                    if (error || result === null) {
                        bankResponse.error = true;
                        bankResponse.message = `Error :` + error.message;
                        response.status(500).json(bankResponse);
                    } else {
                        bankResponse.error = false;
                        bankResponse.bank = result;
                        bankResponse.message = `Banking details updated successfully.`;
                        response.status(200).json(bankResponse);
                    }
                });
        }
    })

});

router.get('/getaccount', (request, response) => {
    console.log(request.body);


    let userId = request.query.userId;


    let bankResponse = {};

    //check if user already has bank details

    bank.find({
        userId: userId
    }, function (error, success) {
        if (error) {
            // create bank data
            bankResponse.error = true;
            bankResponse.message = `Error :` + error.message;
            response.status(200).json(bankResponse);
        } else if (success && success != null) {
            // create bank data
            bankResponse.error = false;
            bankResponse.bank = success;
            response.status(200).json(bankResponse);
        } else if (success && success == null) {
            bankResponse.error = true;
            bankResponse.message = "No bank account found for this user";
            response.status(200).json(bankResponse);
        }
    })

});

/* deleting user phone number
 send phone number in body
 */
router.post('/delete', (req, res) => {
    console.log("user delete", req.body);
    bank.remove({ userId: req.body.userId }).then(data => {
        if (data) {
            res.status(200).json({
                error: false,
                data: data,
                message: "Account deleted"
            });
        }
        else
            res.status(200).json({
                error: true,
                data: data,
                message: "Can not delete account"
            });
    })
})



module.exports = router;