const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
	const url = process.env.MONGODB_URI;

	if (!url) {
		console.error("Error: MONGODB_URI is not defined in environment variables.");
		process.exit(1);
	}

	try {
		await mongoose.connect(url);
		console.log("Connected to database successfully");
	} catch (err) {
		console.error("Error connecting to database:", err.message);
		process.exit(1);
	}
};

module.exports = {
	connectDB,
};
