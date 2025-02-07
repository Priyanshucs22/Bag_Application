const express  = require('express');
const app = express();
const cookeiParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const Razorpay = require('razorpay');
require("dotenv").config();


const ownersRouter = require('./routes/ownersRouter');
const usersRouter = require('./routes/usersRouter');
const productsRouter = require('./routes/productsRouter');
const indexRouter = require('./routes/indexRouter');

const db = require("./config/mongoose-connection");

app.use(
    session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
  })
);

app.use(flash());
app.use(cookeiParser());
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({ extended:true}));
app.set('view engine', 'ejs');

app.use("/",indexRouter);
app.use("/owners",ownersRouter);
app.use("/users",usersRouter);
app.use("/products",productsRouter);

app.listen(5000);