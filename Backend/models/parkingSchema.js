const mongoose = require('mongoose')

const parkingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    lat: {
        type: String,
        required: false
    },
    long: {
        type: String,
        required: false
    },
    maps_link: {
        type: String,
        required: false
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model("Parking", parkingSchema)