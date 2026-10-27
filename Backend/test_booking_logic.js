const mongoose = require('mongoose');
const Booking = require('./models/bookingSchema');
const { connectDB } = require('./config/db.config');

// Mock Data
const mockSpaceId = new mongoose.Types.ObjectId();
const mockUserId = new mongoose.Types.ObjectId();

async function runTest() {
    try {
        await connectDB();
        console.log("Connected to DB");

        // Cleanup previous tests
        await Booking.deleteMany({ space_id: mockSpaceId });

        console.log("--> Test 1: Create First Booking (10:00 - 12:00)");
        const startTime1 = new Date("2023-10-25T10:00:00Z");
        const endTime1 = new Date("2023-10-25T12:00:00Z");

        await Booking.create({
            vehicle_company: "TestCar",
            vehicle_model: "ModelX",
            plate_number: "TEST-01",
            car_color: "Red",
            space_id: mockSpaceId,
            user_id: mockUserId,
            startTime: startTime1,
            endTime: endTime1,
            confirm_booking: "pending"
        });
        console.log("    PASS: First booking created.");

        console.log("--> Test 2: Create Overlapping Booking (11:00 - 13:00)");
        const startTime2 = new Date("2023-10-25T11:00:00Z");
        const endTime2 = new Date("2023-10-25T13:00:00Z");

        // Direct DB call to simulate Controller Logic (since we are testing logic not HTTP)
        // Copying the logic from Controller:
        const overlap = await Booking.findOne({
            space_id: mockSpaceId,
            confirm_booking: { $ne: 'rejected' },
            $or: [
                { startTime: { $lt: endTime2 }, endTime: { $gt: startTime2 } }
            ]
        });

        if (overlap) {
            console.log("    PASS: Overlap detected correctly.");
        } else {
            console.error("    FAIL: Overlap NOT detected!");
            process.exit(1);
        }

        console.log("--> Test 3: Create Non-Overlapping Booking (12:00 - 14:00)");
        const startTime3 = new Date("2023-10-25T12:00:00Z");
        const endTime3 = new Date("2023-10-25T14:00:00Z");

        const overlap2 = await Booking.findOne({
            space_id: mockSpaceId,
            confirm_booking: { $ne: 'rejected' },
            $or: [
                { startTime: { $lt: endTime3 }, endTime: { $gt: startTime3 } }
            ]
        });

        if (!overlap2) {
            await Booking.create({
                vehicle_company: "TestCar",
                vehicle_model: "ModelX",
                plate_number: "TEST-03",
                car_color: "Blue",
                space_id: mockSpaceId,
                user_id: mockUserId,
                startTime: startTime3,
                endTime: endTime3,
                confirm_booking: "pending"
            });
            console.log("    PASS: Non-overlapping booking allowed.");
        } else {
            console.error("    FAIL: False positive on overlap!");
            process.exit(1);
        }

        console.log("\nALL TESTS PASSED.");
        process.exit(0);

    } catch (error) {
        console.error("Test Error:", error);
        process.exit(1);
    }
}

runTest();
