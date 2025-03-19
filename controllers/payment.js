const Razorpay = require("razorpay");
const crypto = require("crypto");
const orderModel=require("../models/orders-model")
const userModel=require("../models/user-model")
require("dotenv").config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});



exports.createOrder = async (req, res) => {
    try {
        const { user_email, amount } = req.body;
        if (!user_email || !amount) {
            return res.status(400).json({ success: false, message: "User email and amount are required" });
        }

        // Fetch user and cart details
        const user = await userModel.findOne({ email: user_email }).populate("cart.product");

        if (!user || user.cart.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty." });
        }

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Convert to paisa
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Create order in DB
        const newOrder = new orderModel({
            userId: user._id,
            products: user.cart.map(item => ({
                productId: item.product._id,
                quantity: item.quantity,
                totalPrice: (item.product.price - item.product.discount) * item.quantity
            })),
            totalAmount: amount,
            status: "pending",
            paymentId: null // Will be updated after payment
        });

        await newOrder.save();

        // Clear cart after order creation
        await user.save();

        res.status(200).json({
            success: true,
            message: "Order created successfully",
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: process.env.RAZORPAY_ID_KEY
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


exports.verifyPayment = async (req, res) => {
    try {
        const { order_id, payment_id, signature } = req.body;
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
        hmac.update(order_id + "|" + payment_id);
        const generatedSignature = hmac.digest("hex");
        if (generatedSignature === signature) {
            return res.status(200).json({
                success: true,
                message: "Payment verified"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};