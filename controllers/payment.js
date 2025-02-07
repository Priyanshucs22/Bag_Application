const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});


exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ success: false, message: "Amount is required" });
        }
        const options = {
            amount: amount * 100, 
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);
        res.status(200).json({
            success: true,
            message: "Order created successfully",
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
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
            return res.render("order-success", {
                paymentId: payment_id,
                orderId: order_id
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