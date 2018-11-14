const express = require('express');
const router = express.Router();
const docs = require('../models/driverDocument');
const user = require('../models/user');

/* API to save the documents of the Driver
like Car registration details , Driver license etc.
*/
router.post('/driverDocs', (request, response) => {
    console.log(request.body);

    let data = new docs({
        userId: request.body.userId,
        drivingLicense: request.body.drivingLicense,
        vehicleInsurance: request.body.vehicleInsurance,
        vechileRegistration: request.body.vechileRegistration,
        vehiclePermit: request.body.vehiclePermit,
        carName: request.body.carName,
        carNumber: request.body.carNumber,
        carType: request.body.carType
    });

    let documentResponse = {};

    data.save((error, result) => {
        if (error) {
            documentResponse.error = true;
            documentResponse.message = `Error :` + error.message;
            response.status(500).json(documentResponse);
        } else if (result) {
            documentResponse.error = false;
            documentResponse.docDetails = result;
            documentResponse.message = `Documents are saved successfully.`;
            response.status(200).json(documentResponse);

        }

    });
});

/* API to update the documents of the Driver
like Car registration details , Driver license etc.
*/
router.put('/updateDriverDocs', (request, response) => {
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

    docs.findOneAndUpdate({userId : userId}, { $set: data }, { new: true }, function (error, result) {
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
/* Api to get the driver doc details
*/
router.get('/driverCarDetails', (request, response) => {
  
    console.log(request.query);

    let userDetailsResponse = {};

    docs.find({userId:request.query.driverId}, (error, result) => {
        console.log("result :"+ result);
        if (error) {
            userDetailsResponse.error = true;
            userDetailsResponse.message = `Error :` + error.message;
            response.status(500).json(userDetailsResponse);
        }
        else if (result) {
            userDetailsResponse.error = false;
            userDetailsResponse.result = result;
            userDetailsResponse.message = `Driver car details.`;
            response.status(200).json(userDetailsResponse);
        }
    });
});

module.exports = router;

