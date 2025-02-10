const mongoose = require("mongoose");
const debug = require("debug")("development:mongoose");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.NODE_ENV === "production"
        ? process.env.MONGODB_URI
        : "mongodb://127.0.0.1:27017/scatch";

    await mongoose.connect(mongoURI);

    debug("Connected to MongoDB");
  } catch (err) {
    debug("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

connectDB();

module.exports = mongoose.connection;