const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);
