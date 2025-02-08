const mongoose = require('mongoose');
const debug = require("debug")("development:mongoose");

if(process.env.NODE_ENV === 'production'){
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      debug('Connected to MongoDB');
    })
    .catch((err) => {
      debug('Error connecting to MongoDB:', err);
      process.exit(1); 
    });
}
else{
  mongoose
   .connect('mongodb://127.0.0.1:27017/scatch')
   .then(() => {
    debug('Connected to MongoDB');
  })
   .catch((err) => {
    debug('Error connecting to MongoDB:', err);
    process.exit(1); 
  });
}
module.exports = mongoose.connection;