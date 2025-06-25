const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "user", 
        required: true 
    },
    products: [{
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "product", 
            required: true 
        },
        addedAt: { 
            type: Date, 
            default: Date.now 
        }
    }]
}, {
    timestamps: true
});

// Ensure a user can only have one wishlist
wishlistSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("wishlist", wishlistSchema);
