const express  = require('express');
const app = express();
const cookeiParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require("connect-mongo");
const xssProtection = require('./middleware/xssProtection');
require("dotenv").config();

const ownersRouter = require('./routes/ownersRouter');
const usersRouter = require('./routes/usersRouter');
const productsRouter = require('./routes/productsRouter');
const indexRouter = require('./routes/indexRouter');
const wishlistRouter = require('./routes/wishlistRouter');
const db = require("./config/mongoose-connection");


app.use(
  session({
    resave: false,  // Don't save if nothing changed
    saveUninitialized: false,  // Don't store empty sessions
    secret: process.env.SESSION_SECRET,  // Encrypt session data
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // Save session for 14 days
    }),
  })
);

app.use(flash());
app.use(cookeiParser());
app.use(express.json());
app.use(express.urlencoded({ extended:true}));
app.use(xssProtection());
app.use(express.static(path.join(__dirname,'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/",indexRouter);
app.use("/owners",ownersRouter);
app.use("/users",usersRouter);
app.use("/products",productsRouter);
app.use("/wishlist",wishlistRouter);

// For Vercel deployment
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;