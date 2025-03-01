const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid", "shipped", "delivered"], default: "pending" },
    paymentId: { type: String }, 
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("order", OrderSchema);
module.exports = Order;