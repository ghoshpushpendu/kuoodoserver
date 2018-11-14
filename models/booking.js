const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bookingSchema = mongoose.Schema({

    userId: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    driverId: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    driverDetails: {
        type: Schema.ObjectId,
        ref: 'document'
    },
    pickUpLocation: {
        longitude: String,
        latitude: String
    },
    destination: {
        longitude: String,
        latitude: String
    },
    startLocation: {
        type: String
    },
    endLocation: {
        type: String
    },
    distance: {
        type: String
    },
    amount: {
        type: String
    },
    payment: {
        type: String,
        default: 'null'
    },
    code: {
        type: String
    },
    startTime: {
        type: String
    },
    endTime: {
        type: String
    },
    status: {
        type: String,
        enum: ['booked', 'request', 'commute', 'complete', 'cancelled']
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
});
bookingSchema.pre('findOne', function (next) {
    this.populate('userId');
    next();
});
bookingSchema.pre('findOne', function (next) {
    this.populate('driverDetails');
    next();
});
bookingSchema.pre('findOne', function (next) {
    this.populate('driverId');
    next();
});
bookingSchema.pre('find', function (next) {
    this.populate('driverDetails');
    next();
});
bookingSchema.pre('find', function (next) {
    this.populate('userId');
    next();
});
bookingSchema.pre('find', function (next) {
    this.populate('driverId');
    next();
});
const booking = module.exports = mongoose.model('booking', bookingSchema);  