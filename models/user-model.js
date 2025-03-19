const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
    quantity: { type: Number, default: 1 }
});

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cart: [CartItemSchema],
    contact: Number,
    picture: String
});

const User = mongoose.model('user', userSchema);
module.exports = User;