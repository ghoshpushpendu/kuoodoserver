const express = require('express');
const router = express.Router();
const payout = require('../models/payouts');

router.post('/request', (request, response) => {
    console.log(request.body);


    let userId = request.body.userId;
    let bankId = request.body.bankId;
    
    let data = {
        drivingLicense: request.body.drivingLicense,
        vehicleInsurance: request.body.vehicleInsurance,
        vechileRegistration: request.body.vechileRegistration,
        vehiclePermit: request.body.vehiclePermit,
    };

    let documentResponse = {};

    user.findOneAndUpdate({ _id: userId }, { $set: data }, { new: true }, function (error, result) {
        if (error || result === null) {
            documentResponse.error = true;
            documentResponse.message = `Error :` + error.message;
            response.status(500).json(documentResponse);
        }
        else {
            documentResponse.error = false;
            documentResponse.docDetails = result;
            documentResponse.message = `Driver Document updated successfully.`;
            response.status(200).json(documentResponse);
        }

    });
});

module.exports = router;

