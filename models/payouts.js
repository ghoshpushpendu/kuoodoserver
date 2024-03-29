const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const payouts = mongoose.Schema({
    userId: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    bankId: {
        type: Schema.ObjectId,
        ref: 'bank'
    },
    amount: {
        type: String
    },
    currency: {
        type: String,
        default: 'usd'
    },
    status: {
        type: String,
        default: 'success'
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
payouts.pre('findOne', function (next) {
    this.populate('userId');
    next();
});
payouts.pre('find', function (next) {
    this.populate('userId');
    next();
});

const cardModule = module.exports = mongoose.model('payout', payouts);