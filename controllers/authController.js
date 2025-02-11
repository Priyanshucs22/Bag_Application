const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

module.exports.registerUser = async (req, res) => {
    try {
        const { email, password, fullname } = req.body;
        if (!email || !password || !fullname) {
            req.flash("error", "All fields are required");
            return res.redirect("/");
        }
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            req.flash("error", "Email already in use");
            return res.redirect("/");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await userModel.create({
            email,
            password: hashedPassword,
            fullname,
        });
        const token = generateToken(user);
        res.cookie("token", token);
        req.flash("success", "Registration successful");
        return res.redirect("/shop");
    } catch (err) {
        console.error("Error in registerUser:", err.message);
        req.flash("error", "Internal Server Error");
        return res.redirect("/");
    }
};

module.exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            req.flash("error", "Email or password incorrect");
            return res.redirect("/");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("error", "Email or password incorrect");
            return res.redirect("/");
        }
        const token = generateToken(user);
        res.cookie("token", token);
        req.flash("success", "Login successful");
        return res.redirect("/shop");
    } catch (err) {
        console.error("Error in loginUser:", err.message);
        req.flash("error", "Internal Server Error");
        return res.redirect("/");
    }
};

module.exports.logout = (req, res) => {
    try {
        // Clear token cookie
        res.clearCookie("token", {secure: true });
        req.flash("success", "Logged out successfully");
        return res.redirect("/");
    } catch (err) {
        console.error("Error in logout:", err.message);
        req.flash("error", "Internal Server Error");
        return res.redirect("/");
    }
};