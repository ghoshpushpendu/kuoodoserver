const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const uploadSchema = mongoose.Schema({

    file: {
        type: Object
    },
    thumbnail: {
        type: Object
    },
    type: {

        type: String
    },

})

const fileUpload = module.exports = mongoose.model('fileUpload', uploadSchema);