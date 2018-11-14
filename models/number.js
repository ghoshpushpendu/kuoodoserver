const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const numberSchema = mongoose.Schema({

    phoneNumber: {
        type: String,
        unique: true,
        required: true
    },
    otp: {
        type: Number
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date,
        default: Date.now
    },
    otpExpiresIn: {
        type: Number
    },
    verified: {
        type: Number,
        default: 0
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date,
        default: Date.now
    },
    enabled: {
        type: Number,
        default: 1
    }
})

const number = module.exports = mongoose.model('number', numberSchema);  