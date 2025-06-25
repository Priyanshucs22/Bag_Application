const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
            quantity: { type: Number, required: true },
            totalPrice: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true }, // Sum of all product totalPrice
    status: { type: String, enum: ["pending", "paid", "shipped", "delivered"], default: "pending" },
    paymentId: { type: String },
    razorpayOrderId: { type: String }, // Store Razorpay order ID for tracking
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('order', orderSchema);
module.exports = Order;