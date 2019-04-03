const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const userSchema = mongoose.Schema({
    firstName: {
        type: String

    },
    lastName: {
        type: String
    },
    rating: {
        type: Number
    },
    review: [{
        content: String,
        name: String,
        date: String
    }],
    profileImage: {
        type: Schema.ObjectId,
        ref: 'fileUpload'
    },
    phoneNumber: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String
    },
    email: {
        type: String
    },
    address: {
        address: String,
        country: String,
        zipCode: Number
    },
    providers: {
        type: String
    },
    uId: {
        type: String,
        unique: true,
        sparse: true
    },
    deviceId: {
        type: String
    },
    socketId: {
        type: String
    },
    location: {
        type: [Number], //latitude and longitude
        index: '2d'
    },
    accuracy: {
        type: Number,
    },
    heading: {
        type: Number
    },
    speed: {
        type: Number
    },
    role: {
        type: String
    },
    status: {
        type: String,
        enum: ['Activated', 'Deactivated', 'Pending', 'Rejected']
    },
    availability: {
        type: String,
        enum: ['Online', 'Offline', 'Busy', ]
    },
    taxId: {
        type: String
    },
    drivingLicense: {
        type: String
    },
    vehicleInsurance: {
        type: String
    },
    vechileRegistration: {
        type: String
    },
    vehiclePermit: {
        type: String
    },
    carName: {
        type: String
    },
    carNumber: {
        type: String
    },
    carType: {
        type: String
    },
    totalEarning: {
        type: String,
        default: '0'
    },
    totalPayout: {
        type: String,
        default: '0'
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

const user = module.exports = mongoose.model('user', userSchema);