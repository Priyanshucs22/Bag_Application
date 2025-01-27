# Bag Shop Application
A web-based e-commerce application for managing and purchasing bags, with features for user authentication, product management, and shopping cart functionality.

## Table of Contents
1. [Features](#features)
2. [Folder Structure](#folder-structure)
3. [Installation](#installation)
4. [Dependencies](#dependencies)
5. [Future Improvements](#future-improvements)

## Features

# User Authentication
- User registration and login.
- JWT-based authentication for secure access.
- Flash messages for errors and success notifications.

# Product Management
- View all products in the shop.
- Search and sort products (by popularity or creation date).
- Add, edit, and manage products (admin-only functionality).

# Shopping Cart
- Add or remove items from the cart.
- View cart items and proceed to checkout.

# Admin Dashboard
- Manage products and collections.

# User Profile
- View and edit personal information.

# Dynamic UI
- Responsive design powered by **Tailwind CSS**.
- Interactive features such as live search and hover effects.


## Folder Structure

├── config
│   └── [Configuration files for database and environment setup]
├── controllers
│   └── authController.js
├── middlewares
│   └── isLoggedin.js
├── models
│   ├── owner-model.js
│   ├── product-model.js
│   └── user-model.js
├── public
│   └── [Static assets like CSS, JS, and images]
├── routes
│   ├── indexRouter.js
│   ├── ownersRouter.js
│   ├── productsRouter.js
│   └── usersRouter.js
├── utils
│   └── [Utility functions like token generation]
├── views
│   ├── partials
│   │   ├── admin.ejs
│   │   ├── all-products.ejs
│   │   ├── cart.ejs
│   │   ├── createproducts.ejs
│   │   ├── edit-profile.ejs
│   │   ├── myprofile.ejs
│   │   ├── new-collection.ejs
│   │   ├── owner-login.ejs
│   │   └── shop.ejs
├── app.js
└── package.json

## Installation And Start the application

- git clone "https://github.com/Priyanshucs22/Bag_Application.git"
- npm install
- npm start

## Dependencies
- Node.js - Server-side runtime.
- Express.js - Web framework.
- Mongoose - MongoDB ORM.
- Bcrypt - Password hashing.
- JSON Web Token (JWT) - User authentication.
- EJS - Templating engine.
- Tailwind CSS - Front-end styling.
- Connect-Flash - Flash messages.
- Cookie-Parser - Cookie handling.

## Future Improvements
- Integrate a payment gateway for secure transactions.
- Enhance the admin dashboard with analytics and reporting features.
- Improve search functionality with auto-suggestions and filters.
- Add a product review and rating system.