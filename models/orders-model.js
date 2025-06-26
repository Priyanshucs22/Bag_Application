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
    paymentMethod: { type: String, enum: ["razorpay", "cod"], default: "razorpay" },
    paymentId: { type: String },
    razorpayOrderId: { type: String }, // Store Razorpay order ID for tracking
    trackingNumber: { type: String }, // Shipping tracking number
    shippingAddress: {
        fullName: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        phone: { type: String }
    },
    createdAt: { type: Date, default: Date.now },
    shippedAt: { type: Date },
    deliveredAt: { type: Date }
});
const Order = mongoose.model('order', orderSchema);
module.exports = Order;