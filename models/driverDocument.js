const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const documentSchema = mongoose.Schema({
    userId: {
        type: Schema.ObjectId,
        ref: 'user'
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
    carImage: {
        type: String
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
documentSchema.pre('findOne', function (next) {
    this.populate('userId');
    next();
});
documentSchema.pre('find', function (next) {
    this.populate('userId');
    next();
});

const document = module.exports = mongoose.model('document', documentSchema);