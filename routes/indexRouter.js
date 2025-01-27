const express = require("express");
const router = express.Router();
const isloggedin = require("../middlewares/isLoggedin");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

router.get("/", (req, res) => {
    let error = req.flash("error");
    let success = req.flash("success");
    res.render("index", { error, success, loggedin: false });
});

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

router.get("/shop/search", async (req, res) => {
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

router.get("/sort", async (req, res) => {
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


router.get("/cart", isloggedin, async (req, res) => {
    try {
        let user = await userModel
            .findOne({ email: req.user.email })
            .populate("cart");

        if (!user || !user.cart || user.cart.length === 0) {
            return res.render("cart", { user, bill: 0 });
        }

        const bill = user.cart.reduce((total, item) => {
            return total + Number(item.price) + 20 - Number(item.discount);
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

// router.get('/profile/edit', isloggedin, (req, res) => {
//     res.render('edit-profile', { user: req.user });
// });

// router.post('/profile/update', isloggedin, async (req, res) => {
//     try {
//         const { name, email } = req.body;

//         if (!name || !email) {
//             req.flash('error', 'Name and Email are required');
//             return res.redirect('/profile/edit');
//         }
//         const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { name, email }, { new: true });

//         if (!updatedUser) {
//             req.flash('error', 'Failed to update profile');
//             return res.redirect('/profile/edit');
//         }

//         req.flash('success', 'Profile updated successfully');
//         res.redirect('/profile');
//     } catch (err) {
//         console.error('Error updating profile:', err);
//         req.flash('error', 'An error occurred while updating your profile');
//         res.redirect('/profile/edit');
//     }
// });

router.get("/addtocart/:productid", isloggedin, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email });

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/shop");
        }

        user.cart.push(req.params.productid);
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
