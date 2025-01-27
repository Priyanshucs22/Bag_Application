const mongoose = require('mongoose');

const ownerSchema =new mongoose.Schema({
    fullname:{
        type:String,
        trim:true,
        minLength:4,
    },
    email:String,
    password:String,
    isAdmin: {
        type: Boolean,
        default: false 
    },
    picture:String,
    gstin:String,
});

const Owner = mongoose.model('Owner', ownerSchema);
module.exports = Owner;