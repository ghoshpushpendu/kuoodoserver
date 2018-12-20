const express = require('express');
const router = express.Router();
const docs = require('../models/driverDocument');
const user = require('../models/user');

router.post('/updateDriverDocs', (request, response) => {
    console.log(request.body);


    let userId = request.body.userId;
    let data = ({
        drivingLicense: request.body.drivingLicense,
        vehicleInsurance: request.body.vehicleInsurance,
        vechileRegistration: request.body.vechileRegistration,
        vehiclePermit: request.body.vehiclePermit,
        carName: request.body.carName,
        carNumber: request.body.carNumber,
        carType: request.body.carType
    });

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

