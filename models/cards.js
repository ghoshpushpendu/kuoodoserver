const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const cards = mongoose.Schema({
    userId: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    number: {
        type: String
    },
    cvv: {
        type: String
    },
    expmonth: {
        type: String
    },
    expyear: {
        type: String
    },
    country: {
        type: String
    },
    name: {
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
cards.pre('findOne', function (next) {
    this.populate('userId');
    next();
});
cards.pre('find', function (next) {
    this.populate('userId');
    next();
});

const cardModule = module.exports = mongoose.model('cards', cards);