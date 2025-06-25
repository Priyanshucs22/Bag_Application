const Razorpay = require("razorpay");
const crypto = require("crypto");
const orderModel=require("../models/orders-model")
const userModel=require("../models/user-model")
require("dotenv").config();


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

console.log('✅ Razorpay initialized successfully');



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
            paymentId: null, // Will be updated after payment
            razorpayOrderId: razorpayOrder.id // Store Razorpay order ID for tracking
        });

        await newOrder.save();

        // Don't clear cart here - clear it only after successful payment

        res.status(200).json({
            success: true,
            message: "Order created successfully",
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID
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
            // Find the order by Razorpay order ID and update it
            const order = await orderModel.findOne({
                razorpayOrderId: order_id,
                status: "pending"
            }).populate("userId");

            if (order) {
                // Update order status and payment ID
                order.status = "paid";
                order.paymentId = payment_id;
                await order.save();

                // Clear user's cart after successful payment
                const user = await userModel.findById(order.userId._id);
                if (user) {
                    user.cart = [];
                    await user.save();
                }

                console.log(`Order ${order._id} marked as paid with payment ID: ${payment_id}`);
            } else {
                console.log(`Order not found for Razorpay order ID: ${order_id}`);
            }

            return res.status(200).json({
                success: true,
                message: "Payment verified and order updated"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};