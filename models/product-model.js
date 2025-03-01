const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    image:Buffer,
    name:String,
    price:Number,
    isNewCollection: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    discount:{
        type:Number,
        default: 0
    },
    sales: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    bgcolor:String,
    panelcolor:String,
    textcolor:String,
});

module.exports = mongoose.model('product',productSchema);