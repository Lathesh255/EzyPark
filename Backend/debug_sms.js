const mongoose = require('mongoose');
const Booking = require('./models/bookingSchema');
const dotenv = require('dotenv');
dotenv.config();

const checkLatestBooking = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const booking = await Booking.findOne().sort({ createdAt: -1 });
        if (booking) {
            console.log("Latest Booking:");
            console.log("ID:", booking._id);
            console.log("Vehicle:", booking.vehicle_model);
            console.log("Mobile Number:", booking.mobile_number);
        } else {
            console.log("No bookings found.");
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkLatestBooking();
