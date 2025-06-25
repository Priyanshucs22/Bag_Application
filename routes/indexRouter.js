const express = require("express");
const router = express.Router();
const isloggedin = require("../middlewares/isLoggedin");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const orderModel = require("../models/orders-model");

const { createOrder, verifyPayment } = require('../controllers/payment');
router.get("/", (req, res) => {
    let error = req.flash("error");
    let success = req.flash("success");
    res.render("index", { error, success, loggedin: false });
});

// UI Demo route
router.get("/ui-demo", (req, res) => {
    res.render("ui-demo");
});

router.post('/createOrder',isloggedin, createOrder);
router.post('/verifyOrder',isloggedin, verifyPayment);


router.get("/shop", isloggedin, async (req, res) => {
    try {
        let products = await productModel.find();
        let success = req.flash("success");
        res.render("shop", { products, success });
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to load products");
        res.redirect("/");
    }
});
router.get("/order-success", isloggedin, (req, res) => {
    res.render("order-success", {
        paymentId: req.query.payment_id,
        orderId: req.query.order_id
    });
});

router.get("/sort", isloggedin, async (req, res) => {
    try {
        const { sortby } = req.query;
        let sortOption = {};
        let successMessage = "";

        switch (sortby) {
            case "oldest":
                sortOption = { createdAt: 1 };
                successMessage = "Products sorted by oldest first";
                break;
            case "price-low":
                sortOption = { price: 1 };
                successMessage = "Products sorted by price: low to high";
                break;
            case "price-high":
                sortOption = { price: -1 };
                successMessage = "Products sorted by price: high to low";
                break;
            default:
                sortOption = { createdAt: -1 };
                successMessage = "Products sorted by newest first";
        }

        let products = await productModel.find().sort(sortOption);
        req.flash("success", successMessage);
        res.render("shop", { products, success: req.flash("success") });
    } catch (error) {
        console.error("Error fetching products:", error);
        req.flash("error", "Failed to sort products");
        res.status(500).send("Internal Server Error");
    }
});


router.get("/increase/:userId/:cartId", isloggedin, async (req, res) => {
    try {
        const { userId, cartId } = req.params;
        const user = await userModel.findOneAndUpdate(
            { _id: userId, "cart._id": cartId },
            { $inc: { "cart.$.quantity": 1 } },
            { new: true } // Return updated user
        );

        if (!user) {
            return res.status(404).json({ message: "User or cart item not found" });
        }

        res.redirect("/cart")
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/decrease/:userId/:cartId", isloggedin, async (req, res) => {
    try {
        const { userId, cartId } = req.params;
        const user = await userModel.findOne({ _id: userId, "cart._id": cartId });
        if (!user) {
            return res.status(404).json({ message: "User or cart item not found" });
        }
        const cartItem = user.cart.find(item => item._id.toString() === cartId);
        if (!cartItem) {
            return res.status(404).json({ message: "Cart item not found" });
        }
        if (cartItem.quantity > 1) {
            await userModel.findOneAndUpdate(
                { _id: userId, "cart._id": cartId },
                { "$inc": { "cart.$.quantity": -1 } },
                { new: true }
            );
        } else {
            await userModel.findOneAndUpdate(
                { _id: userId },
                { "$pull": { "cart": { _id: cartId } } },
                { new: true }
            );
        }
        res.redirect("/cart");
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/cart", isloggedin, async (req, res) => {
    try {
        let user = await userModel
            .findOne({ email: req.user.email })
            .populate("cart.product");

        if (!user || !user.cart || user.cart.length === 0) {
            return res.render("cart", { user, bill: 0 });
        }

        const bill = user.cart.reduce((total, item) => {
            if (!item.product || item.product.price == null || item.product.discount == null) return total;
            return total + Number(item.product.price) + 20 - Number(item.product.discount);
        }, 0);

        res.render("cart", { user, bill });
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to load cart");
        res.redirect("/shop");
    }
});

// Get cart count API endpoint
router.get("/cart/count", isloggedin, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        const count = user && user.cart ? user.cart.length : 0;
        res.json({ success: true, count });
    } catch (error) {
        console.error("Get cart count error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Remove item from cart
router.post("/cart/remove/:itemId", isloggedin, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const user = await userModel.findOne({ email: req.user.email });

        if (user && user.cart) {
            // Remove the item from cart
            user.cart = user.cart.filter(item => item._id.toString() !== itemId);
            await user.save();

            res.json({ success: true, message: "Item removed from cart" });
        } else {
            res.status(404).json({ success: false, message: "User or cart not found" });
        }
    } catch (error) {
        console.error("Remove cart item error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
router.get("/profile", isloggedin, async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect("/login");
        }

        // Get user with populated cart
        const user = await userModel.findOne({ email: req.user.email }).populate("cart.product");

        // Get user's orders
        const orders = await orderModel.find({ userId: req.user._id }).populate("products.productId", "name price");

        // Calculate statistics
        const stats = {
            totalOrders: orders.length,
            totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
            cartItems: user.cart ? user.cart.length : 0,
            cartValue: user.cart ? user.cart.reduce((total, item) => {
                if (!item.product || item.product.price == null || item.product.discount == null) return total;
                return total + (Number(item.product.price) - Number(item.product.discount)) * item.quantity;
            }, 0) : 0
        };

        res.render("myprofile", { user, orders, stats });
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to load profile");
        res.redirect("/shop");
    }
});

router.get("/addtocart/:productid", isloggedin, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email });


        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/shop");
        }
        if (!user.cart.includes(req.params.productid))
            productId = (req.params.productid);
        user.cart.push({ product: productId, quantity: 1 });
        user.cart.quantity = 1;

        await user.save();

        req.flash("success", "Product added to cart");
        res.redirect("/shop");
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to add product to cart");
        res.redirect("/shop");
    }
});


module.exports = router;