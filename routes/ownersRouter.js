const express = require("express");
const router = express.Router();
const ownerModel = require("../models/owner-model");
const productsModel = require("../models/product-model");
const bcrypt = require("bcrypt");
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



router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
        }
        res.redirect("/owners");
    });
});


module.exports = router;