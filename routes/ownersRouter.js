const express = require("express");
const router = express.Router();
const ownerModel = require("../models/owner-model");
const productsModel = require("../models/product-model");
const upload = require("../config/multer-config");
const bcrypt = require("bcrypt");
const ordersModel = require("../models/orders-model");

if (process.env.NODE_ENV === "production") {
    (async () => {
        try {
            let ownerExists = await ownerModel.findOne({ email: process.env.Owner_Email });
            if (!ownerExists) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(process.env.Owner_Pass, salt);
                await ownerModel.create({
                    fullname: process.env.Owner_Name,
                    email: process.env.Owner_Email,
                    password: hashedPassword,
                });
                console.log("Owner account created in production mode.");
            }
        } catch (err) {
            console.error("Error creating owner:", err);
        }
    })();
}

router.get("/", (req, res) => {
    res.render("owner-login");
});

function isAuthenticated(req, res, next) {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.redirect("/owners"); 
    }
    next();  
}
router.post("/login",async (req, res) => {
    try {
        const { email, password } = req.body;
        const owner = await ownerModel.findOne({ email });
        
        if (!owner) {
            return res.redirect("/owners");
        }

        const isMatch = await bcrypt.compare(password, owner.password);
        if (isMatch) {
            req.session.user = {
                id: owner._id,
                fullname: owner.fullname,
                email: owner.email,
                isAdmin: true, 
            };
            let success = req.flash('success')
            let error = req.flash('error');
            let products = await productsModel.find();
            res.render("admin",{products,success,error});
        } else {
            return res.redirect("/owners");
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("An error occurred during login.");
    }
});


router.get('/login',isAuthenticated, async (req,res)=>{
    let success = req.flash('success')
    let error = req.flash('error');
    let products = await productsModel.find();
    res.render("admin",{products,success,error});
})

router.get("/deleteproduct/:productid",isAuthenticated,async (req, res) => {
    try {
        const productId = req.params.productid;
        const product = await productsModel.findByIdAndDelete(productId);
        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/owners/login");
        }
        req.flash("success", "Product deleted successfully");
        res.redirect("/owners/login");
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to delete product");
        res.redirect("/owners/login");
    }
});

router.get("/editproduct/:productid", isAuthenticated, async (req, res) => {
    try {
        const productId = req.params.productid;
        const product = await productsModel.findById(productId);

        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/owners/login");
        }

        const error = req.flash("error"); 
        res.render("editproduct", { product, error });
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to load product");
        res.redirect("/owners/login");
    }
});


router.post("/products/update/:productid",upload.single("image"), isAuthenticated, async (req, res) => {
    try {
        const productId = req.params.productid;
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
        let updateData = { name, price, discount, bgcolor, panelcolor, textcolor };
        if (req.file) {
            updateData.image = req.file.buffer; 
        }
        const updatedProduct = await productsModel.findByIdAndUpdate(productId, updateData, { new: true });
        if (!updatedProduct) {
            req.flash("error", "Product not found");
            return res.redirect("/owners/login");
        }
        req.flash("success", "Product updated successfully!");
        res.redirect("/owners/login"); 
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to update product");
        res.redirect(`/editproduct/${req.params.productid}`);
    }
});

router.get("/deleteall",isAuthenticated,async (req,res)=>{
    try {
        await productsModel.deleteMany({});
        req.flash("success", "All products deleted successfully");
        res.redirect("/owners/login");
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to delete all products");
        res.redirect("/owners/login");
    }
})

router.get("/admin",isAuthenticated, (req, res) => {
    let success = req.flash("success");
    res.render("createproducts", { success });
});

router.get("/admin/orders", isAuthenticated, async (req, res) => {
    try {
        // Get all orders (not just paid) and sort by creation date (newest first)
        const orders = await ordersModel.find({})
            .populate("userId", "fullname email")
            .populate("products.productId", "name price discount")
            .sort({ createdAt: -1 });

        res.render("admin-orders", { orders });
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to load orders");
        res.redirect("/owners/login");
    }
});

// Update order status route
router.post("/admin/orders/:orderId/update", isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, trackingNumber } = req.body;

        const updateData = { status };

        if (trackingNumber) {
            updateData.trackingNumber = trackingNumber;
        }

        if (status === 'shipped' && !updateData.shippedAt) {
            updateData.shippedAt = new Date();
        }

        if (status === 'delivered') {
            updateData.deliveredAt = new Date();
        }

        await ordersModel.findByIdAndUpdate(orderId, updateData);

        req.flash("success", "Order status updated successfully");
        res.redirect("/owners/admin/orders");
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to update order status");
        res.redirect("/owners/admin/orders");
    }
});



router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
        }
        res.redirect("/owners");
    });
});


module.exports = router;