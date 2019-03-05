const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bank = mongoose.Schema({
    userId: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    bankName: {
        type: String
    },
    accountNumber: {
        type: String
    },
    ifscCode: {
        type: String
    },
    branch: {
        type: String
    },
    accountHolder: {
        type: String
    },
    status: {
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
bank.pre('findOne', function (next) {
    this.populate('userId');
    next();
});
bank.pre('find', function (next) {
    this.populate('userId');
    next();
});

const cardModule = module.exports = mongoose.model('bank', bank);