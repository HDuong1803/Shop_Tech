import mongoose, { Schema } from "mongoose" 

export interface reviewAttributes {
  name?: string
  rating?: number
  comment?: string
}

export interface productAttributes {
  name?: string
  image?: string
  altImage?: string
  brand?: string
  category?: string
  description?: string
  reviews?: [reviewAttributes]
  rating?: number
  numReviews?: number
  price?: number
  countInStock?: number
}

const ReviewSchema = new Schema<reviewAttributes>(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
) 

const ProductSchema = new Schema<productAttributes>(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    altImage: {
      type: String,
      required: false,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reviews: [ReviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
) 

export const ProductDB = mongoose.model("product", ProductSchema, undefined, {
  overwriteModels: true,
})
