const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");

module.exports = async (req, res, next) =>{
    if(!req.cookies.token){
        req.flash("error","you need to login first");
        return res.redirect("/");
    }
    try{
        let decoded = jwt.verify(req.cookies.token, process.env.JWT_Key);
        let user = await userModel
            .findOne({email:decoded.email})
            .select("-password");  //by that password feild is not selected or not come
        req.user = user;
        next();    
    }catch(err){
        req.flash("error","invalid token");
        res.redirect("/");
    }
};