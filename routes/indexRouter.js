const express = require("express");
const router = express.Router();
const isloggedin = require("../middlewares/isLoggedin");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

const {createOrder , verifyPayment} = require('../controllers/payment');
router.get("/", (req, res) => {
    let error = req.flash("error");
    let success = req.flash("success");
    res.render("index", { error, success, loggedin: false });
});

router.post('/createOrder',createOrder);
router.post('/verifyOrder',verifyPayment);

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
router.get("/order-success",isloggedin, (req, res) => {
    res.render("order-success", {
        paymentId: req.query.payment_id,
        orderId: req.query.order_id
    });
});

router.get("/shop/search", isloggedin,async (req, res) => {
    try {
        const { query } = req.query;
        const products = await productModel.find({
            name: { $regex: query, $options: 'i' }
        });
        let success = req.flash("success");
        res.render("shop", { products, success });
    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/sort",isloggedin, async (req, res) => {
    try {
        const { sortby } = req.query;
        let sortOption = {};
        if (sortby === "oldest") {
            sortOption = { createdAt: 1 };  // Sort by createdAt ascending (oldest first)
        } else {
            sortOption = { createdAt: -1 }; // Default sort by createdAt descending (newest first)
        }
        let products = await productModel.find().sort(sortOption);
        let success = req.flash("success");
        res.render("shop", { products, success });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/increase/:userId/:cartId", isloggedin,async (req, res) => {
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

router.get("/decrease/:userId/:cartId",isloggedin, async (req, res) => {
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
router.get("/profile", isloggedin, async (req, res) => {
    if (!req.user) {
        return res.redirect("/login");
    }
    res.render("myprofile", { user: req.user });
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