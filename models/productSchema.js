import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
discountvalue: {
  type: Number,
  trim: true,
  min: 0,
  max: 100, 
  default: 0 
},

     productappearance: {
        type: String,
        trim: true
    },
     productstatus: {
        type: String,
        trim: true
    },

  productdetail: {
        type: String,
        trim: true
    },


  howtouse: {
        type: String,
        trim: true
    },

 ingredient: {
        type: String,
        trim: true
    },



    name: {
        type: String,
        required: [true, "Please provide product name"],
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, "Please provide product price"],
        min: [0, "Price cannot be negative"]
    },
    stock: {
        type: Number,
        required: [true, "Please provide product stock"],
        min: [0, "Stock cannot be negative"]
    },
    images: {
        type: [String],
        default: []
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Product = mongoose.model("Product", productSchema);


//  this the wnistday changes ################################