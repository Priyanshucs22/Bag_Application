const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");
const ownerModel = require("../models/owner-model");

router.post("/create", upload.single("image"), async (req, res) => {
    try {
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
        if (!req.file) {
            req.flash("error", "Image is required.");
            return res.redirect("/owners/admin");
        }

        const product = await productModel.create({
            image: req.file.buffer,
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
        });
        
        req.flash("success", "Product created successfully.");
        res.redirect("/owners/admin");
    } catch (e) {
        console.error(e.message);
        res.status(500).send(e.message);
    }
});

router.get('/all', async (req, res) => {
    try {
            let products = await productModel.find();
            let success = req.flash("success");
            res.render("all-products", { products, success });
        } catch (err) {
            console.error(err);
            req.flash("error", "Failed to load products");
            res.redirect("/");
        }
});


router.get('/new-Collection', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);

    await productModel.updateMany(
      { createdAt: { $lte: sevenDaysAgo }, isNewCollection: true },
      { isNewCollection: false }
    );

    const products = await productModel.find({ isNewCollection: true });
    const success = req.flash('success');
    res.render('new-collection', { products, success });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load new collection products');
    res.redirect('/');
  }
});

module.exports = router;
