const express = require("express");
const router = express.Router();
const wishlistModel = require("../models/wishlist-model");
const productModel = require("../models/product-model");
const isloggedin = require("../middlewares/isLoggedin");

// Toggle product in wishlist
router.post("/toggle/:productId", isloggedin, async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;
        const { action } = req.body;

        // Find or create user's wishlist
        let wishlist = await wishlistModel.findOne({ userId });
        
        if (!wishlist) {
            wishlist = new wishlistModel({ userId, products: [] });
        }

        // Check if product is already in wishlist
        const productIndex = wishlist.products.findIndex(
            item => item.productId.toString() === productId
        );

        if (action === 'add' && productIndex === -1) {
            // Add product to wishlist
            wishlist.products.push({ productId });
            await wishlist.save();
            res.json({ success: true, message: "Added to wishlist", action: 'added' });
        } else if (action === 'remove' && productIndex !== -1) {
            // Remove product from wishlist
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();
            res.json({ success: true, message: "Removed from wishlist", action: 'removed' });
        } else {
            res.json({ success: false, message: "No changes made" });
        }
    } catch (error) {
        console.error("Wishlist toggle error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get user's wishlist
router.get("/", isloggedin, async (req, res) => {
    try {
        const userId = req.user._id;
        const wishlist = await wishlistModel.findOne({ userId })
            .populate('products.productId');
        
        const products = wishlist ? wishlist.products.map(item => item.productId) : [];
        
        res.render("wishlist", { 
            products, 
            success: req.flash("success"),
            error: req.flash("error")
        });
    } catch (error) {
        console.error("Get wishlist error:", error);
        req.flash("error", "Failed to load wishlist");
        res.redirect("/shop");
    }
});

// Get wishlist status for products (API endpoint)
router.get("/status", isloggedin, async (req, res) => {
    try {
        const userId = req.user._id;
        const wishlist = await wishlistModel.findOne({ userId });
        
        const likedProducts = wishlist ? 
            wishlist.products.map(item => item.productId.toString()) : [];
        
        res.json({ success: true, likedProducts });
    } catch (error) {
        console.error("Get wishlist status error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Remove product from wishlist (direct route)
router.get("/remove/:productId", isloggedin, async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;

        const wishlist = await wishlistModel.findOne({ userId });
        
        if (wishlist) {
            wishlist.products = wishlist.products.filter(
                item => item.productId.toString() !== productId
            );
            await wishlist.save();
            req.flash("success", "Product removed from wishlist");
        }
        
        res.redirect("/wishlist");
    } catch (error) {
        console.error("Remove from wishlist error:", error);
        req.flash("error", "Failed to remove product from wishlist");
        res.redirect("/wishlist");
    }
});

module.exports = router;
