const mongoose = require('mongoose');
const config = require("config");

const debug = require("debug")("production:mongoose"); // Set DEBUG=development:mongoose  in environment variables
mongoose
  .connect(`${config.get("MONGODB_URI")}/scatch`)
  .then(() => {
    debug('Connected to MongoDB');
  })
  .catch((err) => {
    debug('Error connecting to MongoDB:', err);
    process.exit(1); 
  });
module.exports = mongoose.connection;
