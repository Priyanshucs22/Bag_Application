const express  = require('express');
const app = express();
const cookeiParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const Razorpay = require('razorpay');
const MongoStore = require("connect-mongo");
require("dotenv").config();
const path = require('path');

const ownersRouter = require('./routes/ownersRouter');
const usersRouter = require('./routes/usersRouter');
const productsRouter = require('./routes/productsRouter');
const indexRouter = require('./routes/indexRouter');
const db = require("./config/mongoose-connection");


app.use(
  session({
    resave: false,  // Don't save if nothing changed
    saveUninitialized: false,  // Don't store empty sessions
    secret: process.env.SESSION_SECRET,  // Encrypt session data
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), // Store in MongoDB
    cookie: {
      secure: process.env.NODE_ENV === "production", 
      maxAge:7 * 24 * 60 * 60 * 1000, // 7 day session expiry
    }
  })
);

app.use(flash());
app.use(cookeiParser());
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({ extended:true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/",indexRouter);
app.use("/owners",ownersRouter);
app.use("/users",usersRouter);
app.use("/products",productsRouter);
app.listen(5000);